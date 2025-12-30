import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST - Save transcript to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adId, transcript, createdAt } = body;

    if (!adId || !transcript) {
      return NextResponse.json(
        { error: "Ad ID and transcript are required" },
        { status: 400 }
      );
    }

    // Check if transcript already exists for this ad
    const { data: existingTranscript, error: checkError } = await supabase
      .from('ad_transcripts')
      .select('*')
      .eq('ad_id', adId)
      .single();

    let savedTranscript;

    if (existingTranscript && !checkError) {
      // Update existing transcript
      const { data, error: updateError } = await supabase
        .from('ad_transcripts')
        .update({
          transcript: transcript,
          updated_at: new Date(createdAt || new Date()).toISOString()
        })
        .eq('ad_id', adId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating transcript:", updateError);
        return NextResponse.json(
          { error: "Failed to update transcript" },
          { status: 500 }
        );
      }

      savedTranscript = {
        ...data,
        adId: data.ad_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } else {
      // Create new transcript
      const { data, error: insertError } = await supabase
        .from('ad_transcripts')
        .insert({
          ad_id: adId,
          transcript: transcript,
          created_at: new Date(createdAt || new Date()).toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating transcript:", insertError);
        return NextResponse.json(
          { error: "Failed to create transcript" },
          { status: 500 }
        );
      }

      savedTranscript = {
        ...data,
        adId: data.ad_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    }

    return NextResponse.json({
      success: true,
      transcript: savedTranscript
    });

  } catch (error) {
    console.error("Failed to save transcript:", error);
    return NextResponse.json(
      { error: "Failed to save transcript" },
      { status: 500 }
    );
  }
} 