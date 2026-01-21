import { Pinecone } from '@pinecone-database/pinecone';

export const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});


export const indexName = process.env.PINECONE_INDEX!;

export async function deleteDocumentVectors(documentId: string, chunks?: any[]) {
    console.log(`[Pinecone] Starting deletion for document: ${documentId}`);
    try {
        const index = pinecone.Index(indexName);

        // 1. Delete by specific IDs
        // Strategy: Combine known IDs from DB with a "blind sweep" of potential IDs.
        // This handles cases where DB inserts failed (e.g. dimension mismatch) but Pinecone uploads succeeded.
        // We generate IDs for chunks 0 to 500 to be safe.
        const vectorIds = new Set<string>();

        // Add known chunks
        if (chunks && chunks.length > 0) {
            chunks.forEach(c => {
                vectorIds.add(`${documentId}-chunk-${c.chunk_index}`);
            });
        }

        // Add "Blind Sweep" chunks (0 to 500)
        // This ensures we clean up "ghost" vectors handling from failed DB syncs
        for (let i = 0; i <= 500; i++) {
            vectorIds.add(`${documentId}-chunk-${i}`);
        }

        // Always try to delete the base ID too
        vectorIds.add(documentId);

        const idsArray = Array.from(vectorIds);

        if (idsArray.length > 0) {
            console.log(`[Pinecone] Deleting ${idsArray.length} potential vector IDs (including blind sweep)...`);
            // Batch delete in chunks of 1000
            for (let i = 0; i < idsArray.length; i += 1000) {
                const batch = idsArray.slice(i, i + 1000);
                await index.deleteMany(batch);
            }
            console.log("[Pinecone] IDs deletion command sent.");
        }

        // 2. Delete by Metadata Filter (Catch-all / Redundancy)
        // Note: usage of deleteMany with filter is NOT supported in standard Starter (free) indexes.
        // We wrap it to prevent crashing, but the ID sweep above is the primary reliable method.
        try {
            console.log(`[Pinecone] Attempting metadata filter deletion (may fail on Starter tier): { documentId: "${documentId}" }`);
            await index.deleteMany({
                filter: { documentId: documentId }
            });
            console.log("[Pinecone] Metadata filter deletion request sent.");
        } catch (filterError: any) {
            console.warn("[Pinecone] Metadata filter deletion failed (likely not supported on this index tier). Relying on ID deletion.");
            // Do not throw, as we already performed ID deletion
        }

        return true;
    } catch (error) {
        console.error("[Pinecone] Critical Deletion error:", error);
        // We log but don't throw, so we don't block DB deletion
        return false;
    }
}
