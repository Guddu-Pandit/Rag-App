import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { pinecone, indexName } from "@/lib/pinecone";
import { getEmbeddings } from "@/lib/embeddings";

// Define the state for our RAG graph
const GraphState = Annotation.Root({
    question: Annotation<string>(),
    context: Annotation<string[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    answer: Annotation<string>(),
    loopCount: Annotation<number>({
        reducer: (x, y) => y, // Take the latest value
        default: () => 0,
    }),
    decision: Annotation<"NEED_RETRIEVAL" | "GENERATE" | "VALIDATE" | "END">(),
});

// Initialize the model
const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_APT_KEY, // Fallback for typo in original file
    model: "gemini-2.5-flash", // Using a capable model for reasoning
    temperature: 0,
});

// --- Nodes ---

// Node: Decide next action
const decide_node = async (state: typeof GraphState.State) => {
    const { question } = state;

    const prompt = `You are an autonomous RAG agent. Decide the next action based on the question.
    
    Available actions:
    1. NEED_RETRIEVAL – The question requires external knowledge or context (facts, specific data).
    2. GENERATE – You can answer using general reasoning or if it's a greeting/simple query.
    
    Question: "${question}"
    
    Return ONLY valid JSON:
    {
      "action": "NEED_RETRIEVAL" | "GENERATE",
      "reason": "short explanation"
    }`;

    try {
        const result = await model.invoke(prompt);
        const text = result.content.toString().replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(text);
        return { decision: parsed.action };
    } catch (e: any) {
        console.error("Decision node error:", e);
        // If it's a quota or API error, or parsing error, handle it
        if (e.message?.includes("429") || e.message?.includes("Quota exceeded") || e.message?.includes("Resource has been exhausted")) {
            return { decision: "END", answer: `Error: Quota exceeded. Please check your plan and billing details.` };
        }
        return { decision: "GENERATE" }; // Fallback
    }
};

// Node: Retrieve context from Pinecone
const retrieve_node = async (state: typeof GraphState.State) => {
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
const generate_node = async (state: typeof GraphState.State) => {
    const { question, context } = state;

    const contextText = context.join("\n\n");
    const prompt = `You are an accurate RAG assistant. Answer the question using the provided context if available.
        
    <Context>
    ${contextText || "No context provided."}
    </Context>

    <Question>
    ${question}
    </Question>

    Instructions:
    • Use a confident but neutral tone.
    • If context is provided but doesn't contain the answer, say "Not enough information."
    • If no context is provided, answer to the best of your ability (if it's general knowledge).
    
    Answer:`;

    try {
        const response = await model.invoke(prompt);
        return { answer: response.content.toString() };
    } catch (e: any) {
        console.error("Generation error:", e);
        if (e.message?.includes("429") || e.message?.includes("Quota exceeded") || e.message?.includes("Resource has been exhausted")) {
            return { answer: `Error: Quota exceeded. Please check your plan and billing details.` };
        }
        return { answer: `Error generating response: ${e.message}` };
    }
};

// Node: Validate the answer
const validate_node = async (state: typeof GraphState.State) => {
    const { question, context, answer, loopCount } = state;
    const currentLoop = loopCount + 1;

    // Strict validation prompt
    const prompt = `Validate the generated answer.
    
    Question: ${question}
    Context: ${context.join("\n")}
    Answer: ${answer}
    
    Check:
    1. Is it factually correct?
    2. Is it supported by context?
    3. Does it answer the question?
    
    Return ONLY valid JSON:
    {
      "isValid": boolean,
      "action": "END" | "NEED_RETRIEVAL" | "GENERATE",
      "reason": "explanation"
    }`;

    try {
        const result = await model.invoke(prompt);
        const text = result.content.toString().replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(text);

        let nextAction = parsed.action;

        // Force end if max loops reached
        if (currentLoop >= 3) {
            nextAction = "END";
            // Optional: If invalid and max loops reached, we might want to override the answer, 
            // but for now we'll just end.
        } else if (parsed.isValid) {
            nextAction = "END";
        }

        // If the validator says NEED_RETRIEVAL but we are nearly out of loops, maybe just END?
        // Logic kept simple as per requirements.

        return {
            decision: nextAction,
            loopCount: currentLoop
        };
    } catch (e: any) {
        console.error("Validation error:", e);
        if (e.message?.includes("429") || e.message?.includes("Quota exceeded") || e.message?.includes("Resource has been exhausted")) {
            return { decision: "END", loopCount: currentLoop, answer: `Validation Error: Quota exceeded. Please check your plan and billing details.` };
        }
        return { decision: "END", loopCount: currentLoop };
    }
};

// --- Conditional Edges ---

const route_decision = (state: typeof GraphState.State) => {
    if (state.decision === "NEED_RETRIEVAL") return "retrieve_node";
    if (state.decision === "GENERATE") return "generate_node";
    return "generate_node"; // fallback
};

const route_validation = (state: typeof GraphState.State) => {
    if (state.decision === "END") return END;
    if (state.decision === "NEED_RETRIEVAL") return "retrieve_node";
    if (state.decision === "GENERATE") return "generate_node";
    return END;
};

// --- Graph Definition ---

const workflow = new StateGraph(GraphState)
    .addNode("decide_node", decide_node)
    .addNode("retrieve_node", retrieve_node)
    .addNode("generate_node", generate_node)
    .addNode("validate_node", validate_node)

    .addEdge(START, "decide_node")

    .addConditionalEdges("decide_node", route_decision)

    .addEdge("retrieve_node", "generate_node")
    .addEdge("generate_node", "validate_node")

    .addConditionalEdges("validate_node", route_validation);

// Compile the graph
export const graph = workflow.compile();
