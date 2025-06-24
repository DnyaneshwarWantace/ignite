import { NextRequest, NextResponse } from "next/server";

// Conditionally import auto-tracker functions to avoid build issues
let autoTracker: any = null;
if (process.env.DATABASE_URL) {
  try {
    autoTracker = require("../../../../../lib/auto-tracker");
  } catch (error) {
    console.warn("Failed to load auto-tracker:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!autoTracker) {
      return NextResponse.json({
        success: false,
        error: "Auto-tracker not available during build"
      }, { status: 503 });
    }

    const status = autoTracker.getTrackingStatus();
    
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
    if (!autoTracker) {
      return NextResponse.json({
        success: false,
        error: "Auto-tracker not available during build"
      }, { status: 503 });
    }

    const { action, pageId } = await request.json();
    
    switch (action) {
      case 'start':
        await autoTracker.startAutoTracking();
        return NextResponse.json({
          success: true,
          message: 'Auto-tracking started'
        });
        
      case 'stop':
        autoTracker.stopAutoTracking();
        return NextResponse.json({
          success: true,
          message: 'Auto-tracking stopped'
        });
        
      case 'track_page':
        if (!pageId) {
          return NextResponse.json({
            success: false,
            error: 'pageId is required for track_page action'
          }, { status: 400 });
        }
        
        await autoTracker.trackSpecificPage(pageId);
        return NextResponse.json({
          success: true,
          message: `Tracking completed for page ${pageId}`
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use start, stop, or track_page'
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
} 