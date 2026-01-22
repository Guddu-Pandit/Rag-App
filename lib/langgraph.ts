import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { pinecone, indexName } from "@/lib/pinecone";
import { getEmbeddings } from "@/lib/embeddings";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { RunnableLambda } from "@langchain/core/runnables";

// Define the state for our RAG graph
const GraphState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    loopCount: Annotation<number>({
        reducer: (x, y) => y, // Take the latest value
        default: () => 0,
    }),
});

// Initialize the model
const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_APT_KEY,
    model: "gemini-2.5-flash-lite",
    temperature: 0,
});

// --- Tools ---

const searchTool = tool(
    async ({ query }) => {
        console.log(`Searching for: ${query}`);
        const embedding = await getEmbeddings(query);
        const index = pinecone.Index(indexName);
        const queryResponse = await index.query({
            vector: embedding as number[],
            topK: 5,
            includeMetadata: true,
        });

        const context = queryResponse.matches
            .map((match) => (match.metadata as any)?.text)
            .filter(Boolean) as string[];

        return context.join("\n\n");
    },
    {
        name: "PineconeVectorSearch",
        description: "Search for context from the knowledge base in Pinecone.",
        schema: z.object({
            query: z.string().describe("The search query to use for retrieval."),
        }),
    }
);

const tools = [searchTool];
const toolNode = new ToolNode(tools);

// Initialize the model with tools
const modelWithTools = model.bindTools(tools);

// --- Nodes ---

// Define the agent logic as a RunnableLambda for better tracing
const agent_generate = RunnableLambda.from(async (state: typeof GraphState.State) => {
    const { messages, loopCount } = state;

    // Safety check for max loops
    if (loopCount >= 3) {
        return {
            messages: [new AIMessage("I've reached the maximum number of attempts to find an answer. Not enough information found.")],
        };
    }

    const systemPrompt = new SystemMessage(`
        You are a helpful and accurate RAG assistant. 
        Your primary goal is to answer user questions using the knowledge base.
        
        STRICT INSTRUCTIONS:
        1. ALWAYS use the 'search' tool first for any factual question or when the user asks for information.
        2. Do NOT ask the user for references, documents, or additional context UNLESS the 'search' tool returns no results or insufficient information.
        3. If you find the answer in the context provided by the search tool, answer the question directly.
        4. If after searching you still don't have enough information, then and only then, ask the user for more references or context.
        5. Format your final answer using bold text for key terms and important points.
    `);

    const response = await modelWithTools.invoke([systemPrompt, ...messages]);

    return {
        messages: [response],
        loopCount: loopCount + 1,
    };
}).withConfig({ runName: "Agent:Generate" });

// Wrapper agent node to maintain graph structure while providing the Trace Group
const agent_node = async (state: typeof GraphState.State) => {
    // This allows LangSmith to show "Agent" as the parent and "Agent:Generate" inside it
    return await agent_generate.invoke(state);
};

// Node specifically for vector search tracing
const vector_search_tool = RunnableLambda.from(async (state: typeof GraphState.State) => {
    return await toolNode.invoke(state);
}).withConfig({ runName: "Tool:VectorSearch" });

// --- Conditional Edges ---

const should_continue = (state: typeof GraphState.State) => {
    const { messages, loopCount } = state;
    const lastMessage = messages[messages.length - 1] as AIMessage;

    if (loopCount >= 3) {
        return "Finish";
    }

    if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
        return "CallTools";
    }

    return "Finish";
};

// --- Graph Definition ---

const workflow = new StateGraph(GraphState)
    .addNode("Agent", agent_node)
    .addNode("Tool", vector_search_tool)

    .addEdge(START, "Agent")

    .addConditionalEdges("Agent", should_continue, {
        "CallTools": "Tool",
        "Finish": END
    })

    .addEdge("Tool", "Agent");

// Compile the graph
export const graph = workflow.compile({ name: "LangGraph-Agent-RAG" });
