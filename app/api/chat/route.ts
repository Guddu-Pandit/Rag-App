import { NextRequest } from "next/server";
import { graph } from "@/lib/langgraph";
import { HumanMessage } from "@langchain/core/messages";

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();

        if (!message) {
            return new Response(JSON.stringify({ error: "No message provided" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const eventStream = graph.streamEvents(
                    {
                        messages: [new HumanMessage(message)],
                    },
                    { version: "v2" }
                );

                for await (const event of eventStream) {
                    const eventType = event.event;

                    if (eventType === "on_chat_model_stream") {
                        const content = event.data?.chunk?.content;
                        if (content) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "content", content })}\n\n`));
                        }
                    } else if (eventType === "on_chain_start" && event.name === "LangGraph-Agent-RAG") {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "status", content: "Thinking" })}\n\n`));
                    } else if (eventType === "on_tool_start") {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "status", content: "Calling VectorSearch" })}\n\n`));
                    } else if (eventType === "on_tool_end") {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "status", content: "Generating" })}\n\n`));
                    }
                }
                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (error: any) {
        console.error("Chat API error:", error);
        return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
