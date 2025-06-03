import { NextRequest, NextResponse } from 'next/server';

// POST - Download video through backend proxy
export async function POST(request: NextRequest) {
  try {
    const { videoUrl, adId, companyName } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    console.log('Downloading video from URL:', videoUrl);

    // Fetch the video with proper headers to handle CORS
    const response = await fetch(videoUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'video/mp4,video/*,*/*',
        'Referer': 'https://www.facebook.com/',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity', // Prevent compression issues
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'video/mp4';
    const contentLength = response.headers.get('content-length');
    
    // Check if we got an actual video file
    if (!contentType.includes('video') && !contentType.includes('application/octet-stream')) {
      throw new Error('Invalid content type: ' + contentType);
    }

    // Create readable stream from the response
    const videoBuffer = await response.arrayBuffer();
    
    if (videoBuffer.byteLength === 0) {
      throw new Error('Empty video file received');
    }

    console.log(`Video downloaded successfully: ${videoBuffer.byteLength} bytes`);

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const cleanCompanyName = companyName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
    const filename = `${cleanCompanyName}_ad_video_${timestamp}.mp4`;

    // Return the video file as a response
    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': videoBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Video download failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to download video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 