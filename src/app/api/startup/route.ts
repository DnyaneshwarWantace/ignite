import { NextResponse } from 'next/server';

let servicesInitialized = false;

export async function GET() {
  if (servicesInitialized) {
    return NextResponse.json({
      success: true,
      message: 'Services already running',
      initialized: true
    });
  }

  try {
    // Initialize services asynchronously without blocking
    Promise.resolve().then(async () => {
      const { initializeServerSideMediaWorker, initializeAutoTracking } = await import('@/lib/server-startup');

      await initializeServerSideMediaWorker();
      await initializeAutoTracking();

      console.log('✅ Background services initialized via startup API');
    }).catch(error => {
      console.error('❌ Failed to initialize services:', error);
    });

    servicesInitialized = true;

    return NextResponse.json({
      success: true,
      message: 'Services initialization started',
      initialized: false
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
