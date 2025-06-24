import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    const transcript = await prisma.adTranscript.findUnique({
      where: { adId: adId }
    });

    if (!transcript) {
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
        wordCount: transcript.wordCount,
        duration: transcript.duration,
        service: transcript.service
      },
      createdAt: transcript.createdAt,
      updatedAt: transcript.updatedAt
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
    await prisma.adTranscript.delete({
      where: { adId: adId }
    });

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