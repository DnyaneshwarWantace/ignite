import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { transcribeVideoFromUrl } from '@/lib/vosk-transcription';

// Your transcription backend URL - update this to match your Vosk server
const TRANSCRIPTION_SERVICE_URL = process.env.TRANSCRIPTION_SERVICE_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, adId, language = 'en-us' } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    if (!adId) {
      return NextResponse.json(
        { error: 'Ad ID is required' },
        { status: 400 }
      );
    }

    console.log(`Starting transcription for ad ${adId} with language ${language}`);

    // Check if transcript already exists in database
    const { data: existingTranscript, error: checkError } = await supabase
      .from('ad_transcripts')
      .select('*')
      .eq('ad_id', adId)
      .single();

    if (existingTranscript && !checkError) {
      console.log('Transcript already exists, returning cached version');
      return NextResponse.json({
        success: true,
        transcription: existingTranscript.transcript,
        cached: true,
        language: existingTranscript.language,
        createdAt: new Date(existingTranscript.created_at)
      });
    }

    // Use integrated Vosk transcription service
    console.log('Starting integrated Vosk transcription...');
    const transcriptionData = await transcribeVideoFromUrl(videoUrl, language);

    if (!transcriptionData.success) {
      throw new Error('Transcription service failed');
    }

    // Handle case where video has no speech content
    if (transcriptionData.metadata?.noSpeech || !transcriptionData.transcription) {
      console.log('No speech detected in video');
      
      // Save empty transcript to database to avoid re-processing
      const { data: savedTranscript, error: insertError } = await supabase
        .from('ad_transcripts')
        .insert({
          ad_id: adId,
          transcript: 'No speech detected in this video. This video may contain only music, sound effects, or background audio without spoken content.',
          language: language,
          confidence: 0,
          word_count: 0,
          duration: transcriptionData.metadata?.duration || 0,
          service: transcriptionData.metadata?.service || 'Vosk',
          metadata: JSON.stringify({ ...transcriptionData.metadata, noSpeech: true }),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error saving transcript:', insertError);
        return NextResponse.json(
          { error: 'Failed to save transcript' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        transcription: savedTranscript.transcript,
        language: savedTranscript.language,
        noSpeech: true,
        metadata: {
          confidence: savedTranscript.confidence,
          wordCount: savedTranscript.word_count,
          duration: savedTranscript.duration,
          service: savedTranscript.service,
          noSpeech: true
        },
        createdAt: new Date(savedTranscript.created_at)
      });
    }

    console.log('Transcription completed, saving to database...');

    // Save transcript to database
    const { data: savedTranscript2, error: insert2Error } = await supabase
      .from('ad_transcripts')
      .insert({
        ad_id: adId,
        transcript: transcriptionData.transcription,
        language: language,
        confidence: transcriptionData.metadata?.confidence || 0,
        word_count: transcriptionData.metadata?.wordCount || 0,
        duration: transcriptionData.metadata?.duration || 0,
        service: transcriptionData.metadata?.service || 'Vosk',
        metadata: JSON.stringify(transcriptionData.metadata || {}),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insert2Error) {
      console.error('Error saving transcript:', insert2Error);
      return NextResponse.json(
        { error: 'Failed to save transcript' },
        { status: 500 }
      );
    }

    console.log('Transcript saved successfully');

    return NextResponse.json({
      success: true,
      transcription: savedTranscript2.transcript,
      language: savedTranscript2.language,
      metadata: {
        confidence: savedTranscript2.confidence,
        wordCount: savedTranscript2.word_count,
        duration: savedTranscript2.duration,
        service: savedTranscript2.service
      },
      createdAt: new Date(savedTranscript2.created_at)
    });

  } catch (error) {
    console.error('Transcription failed:', error);
    
    // Return detailed error information
    return NextResponse.json(
      { 
        error: 'Transcription failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve existing transcript
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adId = searchParams.get('adId');

    if (!adId) {
      return NextResponse.json(
        { error: 'Ad ID is required' },
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
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transcript: transcript.transcript,
      language: transcript.language,
      metadata: {
        confidence: transcript.confidence,
        wordCount: transcript.wordCount,
        duration: transcript.duration,
        service: transcript.service
      },
      createdAt: transcript.createdAt
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