"use server";

import { supabase } from "@/lib/supabase";
import { pinecone, indexName } from "@/lib/pinecone";
import { getEmbeddings } from "@/lib/embeddings";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFParse } from "pdf-parse";

export async function uploadDocument(formData: FormData) {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const fileName = `${Date.now()}-${file.name}`;
    const bucketName = process.env.BUCKET_NAME || "rag_app";

    // 1. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

    if (uploadError) throw new Error(`Supabase upload error: ${uploadError.message}`);

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

    // Pinecone upsert in batches of 100 to be safe
    for (let i = 0; i < vectors.length; i += 100) {
        const batch = vectors.slice(i, i + 100);
        await index.upsert(batch);
    }

    return { success: true, fileName, storagePath: uploadData.path };
}
