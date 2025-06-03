import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
    const existingTranscript = await prisma.transcript.findUnique({
      where: { adId }
    });

    let savedTranscript;

    if (existingTranscript) {
      // Update existing transcript
      savedTranscript = await prisma.transcript.update({
        where: { adId },
        data: {
          text: transcript,
          updatedAt: new Date(createdAt || new Date())
        }
      });
    } else {
      // Create new transcript
      savedTranscript = await prisma.transcript.create({
        data: {
          adId,
          text: transcript,
          createdAt: new Date(createdAt || new Date()),
          updatedAt: new Date()
        }
      });
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