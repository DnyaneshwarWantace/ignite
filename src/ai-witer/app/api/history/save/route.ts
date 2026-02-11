import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { campaignId, agentId, agentName, inputData, generatedContent } =
      await request.json();

    if (!campaignId || !agentId || !generatedContent) {
      return NextResponse.json(
        { error: "Campaign ID, Agent ID, and Generated Content are required" },
        { status: 400 }
      );
    }

    // Save generation to history
    const { data, error } = await supabaseAdmin
      .from("generation_history")
      .insert({
        campaign_id: campaignId,
        agent_id: agentId,
        agent_name: agentName,
        input_data: inputData || {},
        generated_content: generatedContent,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save generation history" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Save history error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save generation history" },
      { status: 500 }
    );
  }
}
