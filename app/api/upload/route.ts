import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { pinecone, indexName } from "@/lib/pinecone";
import { getEmbeddings } from "@/lib/embeddings";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFParse } from "pdf-parse";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const fileName = `${Date.now()}-${file.name}`;
        const bucketName = process.env.BUCKET_NAME || "rag_app";

        // 1. Upload to Supabase Storage
        // We use supabaseAdmin to bypass RLS policies if SUPABASE_SERVICE_ROLE_KEY is provided.
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from(bucketName)
            .upload(fileName, file);

        if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            return NextResponse.json({ error: `Supabase upload error: ${uploadError.message}` }, { status: 500 });
        }

        // 2. Extract Text
        let text = "";
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        if (file.type === "application/pdf") {
            const parser = new PDFParse({ data: new Uint8Array(buffer) });
            const result = await parser.getText();
            text = result.text;
        } else {
            text = buffer.toString("utf-8");
        }

        // 3. Chunk Text
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const chunks = await splitter.createDocuments([text]);

        // 4. Generate Embeddings and Upsert to Pinecone
        const index = pinecone.Index(indexName);

        const vectors = await Promise.all(
            chunks.map(async (chunk, i: number) => {
                const embedding = await getEmbeddings(chunk.pageContent);
                return {
                    id: `${fileName}-chunk-${i}`,
                    values: embedding,
                    metadata: {
                        text: chunk.pageContent,
                        fileName: file.name,
                        storagePath: uploadData.path,
                    },
                };
            })
        );

        // Pinecone upsert in batches of 100
        for (let i = 0; i < vectors.length; i += 100) {
            const batch = vectors.slice(i, i + 100);
            await index.upsert(batch);
        }

        return NextResponse.json({
            success: true,
            fileName,
            storagePath: uploadData.path
        });

    } catch (error: any) {
        console.error("API Upload error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
