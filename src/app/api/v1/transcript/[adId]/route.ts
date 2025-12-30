import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET - Retrieve transcript by ad ID
export async function GET(
  request: NextRequest,
  { params }: { params: { adId: string } }
) {
  try {
    const { adId } = params;

    if (!adId) {
      return NextResponse.json(
        { error: "Ad ID is required" },
        { status: 400 }
      );
    }

    const { data: transcript, error } = await supabase
      .from('ad_transcripts')
      .select('*')
      .eq('ad_id', adId)
      .single();

    if (error || !transcript) {
      return NextResponse.json(
        { error: "Transcript not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transcript: transcript.transcript,
      createdAt: new Date(transcript.created_at),
      updatedAt: new Date(transcript.updated_at)
    });

  } catch (error) {
    console.error("Failed to retrieve transcript:", error);
    return NextResponse.json(
      { error: "Failed to retrieve transcript" },
      { status: 500 }
    );
  }
} 