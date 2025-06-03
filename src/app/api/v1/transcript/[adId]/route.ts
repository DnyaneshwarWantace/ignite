import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    const transcript = await prisma.transcript.findUnique({
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
      transcript: transcript.text,
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