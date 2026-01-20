import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_APT_KEY!);

export async function getEmbeddings(text: string) {
    const model = genAI.getGenerativeModel({ model: "embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
}
