import { NextRequest, NextResponse } from "next/server";

let workerRunning = false;
let workerInterval: NodeJS.Timeout | null = null;

export async function POST(request: NextRequest) {
  try {
    const { intervalMinutes = 2 } = await request.json();

    if (workerRunning) {
      return NextResponse.json({
        success: true,
        message: "Media worker is already running",
        status: "running"
      });
    }

    console.log(`🚀 Starting media worker with ${intervalMinutes} minute intervals`);
    
    // Import and start the media worker functions
    const { processPendingMedia } = require("../../../scripts/media-worker.js");
    
    // Process immediately
    await processPendingMedia(5);
    
    // Set up interval processing
    workerInterval = setInterval(async () => {
      try {
        await processPendingMedia(5);
      } catch (error) {
        console.error('❌ Error in media worker interval:', error);
      }
    }, intervalMinutes * 60 * 1000);

    workerRunning = true;

    return NextResponse.json({
      success: true,
      message: `Media worker started with ${intervalMinutes} minute intervals`,
      status: "started",
      intervalMinutes
    });

  } catch (error) {
    console.error("Error starting media worker:", error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!workerRunning) {
      return NextResponse.json({
        success: true,
        message: "Media worker is not running",
        status: "stopped"
      });
    }

    if (workerInterval) {
      clearInterval(workerInterval);
      workerInterval = null;
    }

    workerRunning = false;

    return NextResponse.json({
      success: true,
      message: "Media worker stopped",
      status: "stopped"
    });

  } catch (error) {
    console.error("Error stopping media worker:", error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    status: workerRunning ? "running" : "stopped",
    message: workerRunning 
      ? "Media worker is currently running" 
      : "Media worker is not running"
  });
} 