import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { pinecone, indexName } from "@/lib/pinecone";

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: documentId } = await context.params;

        if (!documentId) {
            console.error("Deletion failed: Document ID is missing");
            return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
        }

        console.log(`>>> STARTING DELETION FOR DOCUMENT: ${documentId}`);

        // 1. Get document details from Supabase to get the file path
        console.log("1. Fetching document metadata from Supabase...");
        const { data: docData, error: fetchError } = await supabaseAdmin
            .from("documents")
            .select("file_path, bucket_name")
            .eq("id", documentId)
            .single();

        if (fetchError || !docData) {
            console.error("Error fetching document for deletion:", fetchError || "Document data not found");
            return NextResponse.json({ error: "Document not found or already deleted" }, { status: 404 });
        }
        console.log(`   Found file: ${docData.file_path} in bucket: ${docData.bucket_name}`);

        // 2. Delete from Pinecone
        console.log("2. Deleting vectors from Pinecone...");
        const index = pinecone.Index(indexName);
        try {
            // First, try to get the chunks from the database to know exactly which IDs to delete
            console.log(`   Fetching chunks for document ${documentId} from Supabase...`);
            const { data: chunks, error: chunksFetchError } = await supabaseAdmin
                .from("document_chunks")
                .select("chunk_index")
                .eq("document_id", documentId);

            if (chunksFetchError) {
                console.warn("   WARNING: Failed to fetch chunk indices from DB:", chunksFetchError.message);
            }

            const vectorIds: string[] = [];
            if (chunks && chunks.length > 0) {
                chunks.forEach(c => {
                    vectorIds.push(`${documentId}-chunk-${c.chunk_index}`);
                });
            }

            // Always attempt to delete the base ID just in case
            vectorIds.push(documentId);

            if (vectorIds.length > 0) {
                console.log(`   Attempting to delete ${vectorIds.length} specific vector IDs from Pinecone...`);
                console.log(`   First 5 IDs to delete: ${vectorIds.slice(0, 5).join(", ")}`);

                // Pinecone delete by ID in batches of 1000
                for (let i = 0; i < vectorIds.length; i += 1000) {
                    const batch = vectorIds.slice(i, i + 1000);
                    await index.deleteMany(batch);
                }
                console.log("   Pinecone: Specific IDs deletion command sent successfully.");
            } else {
                console.log("   No specific vector IDs found in DB to delete.");
            }

            // Also keep the filter as a secondary/redundancy check
            // IMPORTANT: Some index types in Pinecone (like Starter/Serverless) 
            // handle filters differently. This ensures we try both ways.
            console.log(`   Applying Pinecone Filter as fallback: { documentId: "${documentId}" }`);
            await index.deleteMany({
                filter: { documentId: { "$eq": documentId } }
            });
            console.log("   Pinecone: Filter-based deletion command sent successfully.");

        } catch (pineconeError: any) {
            console.error("   ERROR during Pinecone deletion:", pineconeError);
            // We continue even if Pinecone fails to ensure DB and Storage are cleaned up
        }

        // 3. Delete from Supabase Storage
        console.log("3. Deleting file from Supabase Storage...");
        const { error: storageError } = await supabaseAdmin.storage
            .from(docData.bucket_name)
            .remove([docData.file_path]);

        if (storageError) {
            console.warn("   WARNING: Failed to delete from Supabase Storage:", storageError.message);
        } else {
            console.log("   Success: File deleted from Storage.");
        }

        // 4. Delete from Supabase DB
        console.log("4. Deleting records from Supabase DB...");

        // Delete chunks first to avoid FK constraints if cascade isn't set
        const { error: chunksDeleteError } = await supabaseAdmin
            .from("document_chunks")
            .delete()
            .eq("document_id", documentId);

        if (chunksDeleteError) {
            console.warn("   WARNING: Error deleting document chunks:", chunksDeleteError.message);
        } else {
            console.log("   Success: Chunks deleted from DB.");
        }

        const { error: docDeleteError } = await supabaseAdmin
            .from("documents")
            .delete()
            .eq("id", documentId);

        if (docDeleteError) {
            console.error("   CRITICAL ERROR: Failed to delete document record from DB:", docDeleteError.message);
            return NextResponse.json({ error: `DB deletion error: ${docDeleteError.message}` }, { status: 500 });
        }

        console.log(">>> DOCUMENT SUCCESSFULLY DELETED FROM ALL SOURCES.");
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("!!! UNEXPECTED DELETION API ERROR:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
