import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { pinecone, indexName } from "@/lib/pinecone";
import { getEmbeddings } from "@/lib/embeddings";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import pdf from "pdf-parse-fork";
import mammoth from "mammoth";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const userId = formData.get("userId") as string | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const fileName = `${Date.now()}-${file.name}`;
        const bucketName = process.env.BUCKET_NAME || "rag_app";

        // 1. Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from(bucketName)
            .upload(fileName, file);

        if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            return NextResponse.json({ error: `Supabase upload error: ${uploadError.message}` }, { status: 500 });
        }

        // 2. Insert into documents table
        const { data: docData, error: docError } = await supabaseAdmin
            .from("documents")
            .insert({
                user_id: userId || null,
                file_name: file.name,
                file_path: uploadData.path,
                bucket_name: bucketName,
                mime_type: file.type,
                file_size: file.size,
            })
            .select()
            .single();

        if (docError) {
            console.error("Supabase DB insert error (documents):", docError);
            return NextResponse.json({ error: `Supabase DB insert error: ${docError.message}` }, { status: 500 });
        }

        const documentId = docData.id;

        // 3. Extract Text
        let text = "";
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        if (file.type === "application/pdf") {
            try {
                // Use Uint8Array for extraction as requested
                const uint8Array = new Uint8Array(bytes);
                const data = await pdf(Buffer.from(uint8Array));
                text = data.text;
            } catch (pdfError: any) {
                console.error("PDF Parsing error:", pdfError);
                return NextResponse.json({ error: `PDF Parsing error: ${pdfError.message}` }, { status: 500 });
            }
        } else if (
            file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            file.name.endsWith(".docx") ||
            file.name.endsWith(".doc")
        ) {
            try {
                const result = await mammoth.extractRawText({ buffer });
                text = result.value;
            } catch (docError: any) {
                console.error("Docx Parsing error:", docError);
                return NextResponse.json({ error: `Docx Parsing error: ${docError.message}` }, { status: 500 });
            }
        } else {
            text = buffer.toString("utf-8");
        }

        if (!text || text.trim().length === 0) {
            return NextResponse.json({ error: "No text could be extracted from the file" }, { status: 400 });
        }

        // 4. Chunk Text
        console.log("Starting text chunking...");
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const chunks = await splitter.createDocuments([text]);
        console.log(`Created ${chunks.length} chunks.`);

        if (chunks.length === 0) {
            console.warn("No chunks created from the document.");
        }

        // 5. Generate Embeddings and Sync with Supabase (PGVector) and Pinecone
        const index = pinecone.Index(indexName);

        const vectors = await Promise.all(
            chunks.map(async (chunk, i: number) => {
                try {
                    console.log(`Processing chunk ${i}...`);
                    const embedding = await getEmbeddings(chunk.pageContent);

                    // Insert into document_chunks table
                    const { error: chunkError } = await supabaseAdmin
                        .from("document_chunks")
                        .insert({
                            document_id: documentId,
                            content: chunk.pageContent,
                            embedding: embedding,
                            chunk_index: i,
                        });

                    if (chunkError) {
                        console.error(`Chunk ${i} Supabase insert error:`, chunkError);
                        // We don't throw here to allow other chunks to proceed, but you might want to change this
                    }

                    return {
                        id: `${documentId}-chunk-${i}`,
                        values: embedding,
                        metadata: {
                            text: chunk.pageContent,
                            filename: file.name,
                            storagePath: uploadData.path,
                            documentId: documentId,
                        },
                    };
                } catch (err: any) {
                    console.error(`Error processing chunk ${i}:`, err);
                    return null;
                }
            })
        );

        // Filter out failed chunks
        const validVectors = vectors.filter((v): v is NonNullable<typeof v> => v !== null);
        console.log(`Uploading ${validVectors.length} vectors to Pinecone...`);

        // Pinecone upsert in batches of 100
        try {
            for (let i = 0; i < validVectors.length; i += 100) {
                const batch = validVectors.slice(i, i + 100);
                await index.upsert(batch);
            }
            console.log("Pinecone upload complete.");
        } catch (pineconeError: any) {
            console.error("Pinecone upsert error:", pineconeError);
            return NextResponse.json({ error: `Pinecone upsert error: ${pineconeError.message}` }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            documentId,
            fileName: file.name,
            storagePath: uploadData.path,
            chunkCount: validVectors.length
        });

    } catch (error: any) {
        console.error("API Upload error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
