import { NextRequest, NextResponse } from "next/server";
import { startAutoTracking, stopAutoTracking, getTrackingStatus, trackSpecificPage } from "@/lib/auto-tracker";

export async function GET(request: NextRequest) {
  try {
    const status = getTrackingStatus();
    
    return NextResponse.json({
      success: true,
      status
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (pageId) {
      // If pageId is provided, track specific page
      await trackSpecificPage(pageId);
      return NextResponse.json({
        success: true,
        message: `Tracked page ${pageId}`
      });
    } else {
      // Otherwise start auto-tracking
      const started = await startAutoTracking();
      const status = getTrackingStatus();
      
      return NextResponse.json({
        success: true,
        started,
        status
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
} 