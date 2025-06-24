import { NextRequest, NextResponse } from "next/server";

// Conditionally import Prisma to avoid build issues
let prisma: any = null;
if (process.env.DATABASE_URL) {
  try {
    const { PrismaClient } = require("@prisma/client");
    prisma = new PrismaClient();
  } catch (error) {
    console.warn("Failed to load Prisma in transcript route:", error);
  }
}

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

    if (!prisma) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    // Check if transcript already exists for this ad
    const existingTranscript = await prisma.adTranscript.findUnique({
      where: { adId }
    });

    let savedTranscript;

    if (existingTranscript) {
      // Update existing transcript
      savedTranscript = await prisma.adTranscript.update({
        where: { adId },
        data: {
          transcript: transcript,
          updatedAt: new Date(createdAt || new Date())
        }
      });
    } else {
      // Create new transcript
      savedTranscript = await prisma.adTranscript.create({
        data: {
          adId,
          transcript: transcript,
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