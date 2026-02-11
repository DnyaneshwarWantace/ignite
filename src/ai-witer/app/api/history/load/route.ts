import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const agentId = searchParams.get("agentId");

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // Build query
    let query = supabaseAdmin
      .from("generation_history")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });

    // Filter by agent if specified
    if (agentId) {
      query = query.eq("agent_id", agentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to load generation history" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Load history error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load generation history" },
      { status: 500 }
    );
  }
}
