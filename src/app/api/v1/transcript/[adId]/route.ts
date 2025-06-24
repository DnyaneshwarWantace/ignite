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

    if (!prisma) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    const transcript = await prisma.adTranscript.findUnique({
      where: { adId }
    });

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transcript: transcript.transcript,
      createdAt: transcript.createdAt,
      updatedAt: transcript.updatedAt
    });

  } catch (error) {
    console.error("Failed to retrieve transcript:", error);
    return NextResponse.json(
      { error: "Failed to retrieve transcript" },
      { status: 500 }
    );
  }
} 