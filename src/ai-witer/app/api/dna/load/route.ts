import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // Load all DNA content for this campaign
    const { data, error } = await supabaseAdmin
      .from("dna_content")
      .select("*")
      .eq("campaign_id", campaignId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to load DNA content" },
        { status: 500 }
      );
    }

    // Convert array to object with section_id as keys
    const dnaData: Record<string, string> = {};
    data?.forEach((item) => {
      dnaData[item.section_id] = item.content;
    });

    return NextResponse.json({ success: true, data: dnaData });
  } catch (error: any) {
    console.error("Load DNA error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load DNA content" },
      { status: 500 }
    );
  }
}
