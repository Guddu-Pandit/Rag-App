import { NextRequest, NextResponse } from "next/server";
import { graph } from "@/lib/langgraph";
import { HumanMessage } from "@langchain/core/messages";

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "No message provided" }, { status: 400 });
        }

        const result = await graph.invoke({
            messages: [new HumanMessage(message)],
        });

        const lastMessage = result.messages[result.messages.length - 1];

        return NextResponse.json({
            answer: lastMessage.content,
        });

    } catch (error: any) {
        console.error("Chat API error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
