import { NextRequest, NextResponse } from 'next/server';

// Conditionally import Prisma to avoid build issues
let prisma: any = null;
if (process.env.DATABASE_URL) {
  try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
  } catch (error) {
    console.warn("Failed to load Prisma in ads transcript route:", error);
  }
}

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

    if (!prisma) {
      return NextResponse.json(
        { transcript: null, hasTranscript: false },
        { status: 503 }
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

    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
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