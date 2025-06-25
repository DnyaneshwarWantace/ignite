import { NextRequest, NextResponse } from "next/server";
import { startAutoTracking, stopAutoTracking, getTrackingStatus, trackSpecificPage } from "../../../../../lib/auto-tracker";

export const dynamic = "force-dynamic";

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
    const { action, pageId } = await request.json();
    
    switch (action) {
      case 'start':
        await startAutoTracking();
        return NextResponse.json({
          success: true,
          message: 'Auto-tracking started'
        });
        
      case 'stop':
        stopAutoTracking();
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
        
        await trackSpecificPage(pageId);
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