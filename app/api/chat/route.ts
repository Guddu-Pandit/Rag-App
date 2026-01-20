import { NextRequest, NextResponse } from "next/server";
import { graph } from "@/lib/langgraph";

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "No message provided" }, { status: 400 });
        }

        const result = await graph.invoke({
            question: message,
        });

        return NextResponse.json({
            answer: result.answer,
            context: result.context,
        });

    } catch (error: any) {
        console.error("Chat API error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
