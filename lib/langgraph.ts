import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { pinecone, indexName } from "@/lib/pinecone";
import { getEmbeddings } from "@/lib/embeddings";

// Define the state for our RAG graph
const GraphState = Annotation.Root({
    question: Annotation<string>(),
    context: Annotation<string[]>(),
    answer: Annotation<string>(),
});

// Initialize the model
const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_APT_KEY,
    model: "gemini-2.5-flash",
    temperature: 0,
});

// Node: Retrieve context from Pinecone
const retrieve = async (state: typeof GraphState.State) => {
    const { question } = state;
    const embedding = await getEmbeddings(question);

    const index = pinecone.Index(indexName);
    const queryResponse = await index.query({
        vector: embedding as number[],
        topK: 5,
        includeMetadata: true,
    });

    const context = queryResponse.matches
        .map((match) => (match.metadata as any)?.text)
        .filter(Boolean) as string[];

    return { context };
};

// Node: Generate answer using the model
const generate = async (state: typeof GraphState.State) => {
    const { question, context } = state;

    const contextText = context.join("\n\n");
    const prompt = `You are an accurate RAG (retrieval-augmented) assistant. Answer the question using only the provided context.  
        Do NOT add information that is not explicitly supported by the context.

        <Context>
        ${contextText}
        </Context>

        <Question>
        ${question}
        </Question>

        Instructions:
        • Use a confident but neutral tone
        • If the context does not contain the answer → reply with: "Not enough information."
        • Do not explain why you don't know — just use the sentence above

        Answer:`;

    const response = await model.invoke(prompt);
    return { answer: response.content.toString() };
};

// Define the graph
const workflow = new StateGraph(GraphState)
    .addNode("retrieve", retrieve)
    .addNode("generate", generate)
    .addEdge(START, "retrieve")
    .addEdge("retrieve", "generate")
    .addEdge("generate", END);

// Compile the graph
export const graph = workflow.compile();
