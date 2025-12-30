import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { adId: string } }
) {
  try {
    const { adId } = params;

    if (!adId) {
      return NextResponse.json(
        { error: 'Ad ID is required' },
        { status: 400 }
      );
    }

    // Find transcript for this ad
    const { data: transcript, error } = await supabase
      .from('ad_transcripts')
      .select('*')
      .eq('ad_id', adId)
      .single();

    if (error || !transcript) {
      return NextResponse.json(
        { transcript: null, hasTranscript: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      transcript: transcript.transcript,
      hasTranscript: true,
      language: transcript.language,
      metadata: {
        confidence: transcript.confidence,
        wordCount: transcript.word_count,
        duration: transcript.duration,
        service: transcript.service
      },
      createdAt: new Date(transcript.created_at),
      updatedAt: new Date(transcript.updated_at)
    });

  } catch (error) {
    console.error('Failed to retrieve transcript:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve transcript',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { adId: string } }
) {
  try {
    const { adId } = params;

    if (!adId) {
      return NextResponse.json(
        { error: 'Ad ID is required' },
        { status: 400 }
      );
    }

    // Delete transcript for this ad
    const { error: deleteError } = await supabase
      .from('ad_transcripts')
      .delete()
      .eq('ad_id', adId);

    if (deleteError) {
      console.error('Error deleting transcript:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete transcript' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transcript deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete transcript:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete transcript',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 