import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_APT_KEY! });

export async function getEmbeddings(text: string) {
    const modelName = "text-embedding-004";
    console.log(`Generating embeddings using model: ${modelName}`);

    const result = await genAI.models.embedContent({
        model: modelName,
        contents: [text]
    });

    if (!result.embeddings || result.embeddings.length === 0) {
        throw new Error("Failed to generate embeddings: No embeddings returned");
    }

    return result.embeddings[0].values;
}
