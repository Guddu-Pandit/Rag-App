import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    try {
        // Fetch documents ordered by upload date
        const { data, error } = await supabaseAdmin
            .from("documents")
            .select("*")
            .order("uploaded_at", { ascending: false });

        if (error) {
            console.error("Error fetching documents:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Documents API error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
