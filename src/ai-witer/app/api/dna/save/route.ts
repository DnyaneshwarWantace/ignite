import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { campaignId, sectionId, content } = await request.json();

    if (!campaignId || !sectionId) {
      return NextResponse.json(
        { error: "Campaign ID and Section ID are required" },
        { status: 400 }
      );
    }

    // Upsert DNA content (update if exists, insert if not)
    const { data, error } = await supabaseAdmin
      .from("dna_content")
      .upsert(
        {
          campaign_id: campaignId,
          section_id: sectionId,
          content: content || "",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "campaign_id,section_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save DNA content" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Save DNA error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save DNA content" },
      { status: 500 }
    );
  }
}
