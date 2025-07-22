import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { transcribeVideoFromUrl } from '@/lib/vosk-transcription';

const prisma = new PrismaClient();

// Your transcription backend URL - update this to match your Vosk server
const TRANSCRIPTION_SERVICE_URL = process.env.TRANSCRIPTION_SERVICE_URL || 'https://ignite-jade.vercel.app';

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
    const existingTranscript = await prisma.adTranscript.findUnique({
      where: { adId: adId }
    });

    if (existingTranscript) {
      console.log('Transcript already exists, returning cached version');
      return NextResponse.json({
        success: true,
        transcription: existingTranscript.transcript,
        cached: true,
        language: existingTranscript.language,
        createdAt: existingTranscript.createdAt
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
      const savedTranscript = await prisma.adTranscript.create({
        data: {
          adId: adId,
          transcript: 'No speech detected in this video. This video may contain only music, sound effects, or background audio without spoken content.',
          language: language,
          confidence: 0,
          wordCount: 0,
          duration: transcriptionData.metadata?.duration || 0,
          service: transcriptionData.metadata?.service || 'Vosk',
          metadata: JSON.stringify({ ...transcriptionData.metadata, noSpeech: true }),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        transcription: savedTranscript.transcript,
        language: savedTranscript.language,
        noSpeech: true,
        metadata: {
          confidence: savedTranscript.confidence,
          wordCount: savedTranscript.wordCount,
          duration: savedTranscript.duration,
          service: savedTranscript.service,
          noSpeech: true
        },
        createdAt: savedTranscript.createdAt
      });
    }

    console.log('Transcription completed, saving to database...');

    // Save transcript to database
    const savedTranscript = await prisma.adTranscript.create({
      data: {
        adId: adId,
        transcript: transcriptionData.transcription,
        language: language,
        confidence: transcriptionData.metadata?.confidence || 0,
        wordCount: transcriptionData.metadata?.wordCount || 0,
        duration: transcriptionData.metadata?.duration || 0,
        service: transcriptionData.metadata?.service || 'Vosk',
        metadata: JSON.stringify(transcriptionData.metadata || {}),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('Transcript saved successfully');

    return NextResponse.json({
      success: true,
      transcription: savedTranscript.transcript,
      language: savedTranscript.language,
      metadata: {
        confidence: savedTranscript.confidence,
        wordCount: savedTranscript.wordCount,
        duration: savedTranscript.duration,
        service: savedTranscript.service
      },
      createdAt: savedTranscript.createdAt
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

    const transcript = await prisma.adTranscript.findUnique({
      where: { adId: adId }
    });

    if (!transcript) {
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