let mediaWorkerInitialized = false;
let autoTrackingInitialized = false;
let workerInterval: NodeJS.Timeout | null = null;

export async function initializeAutoTracking() {
  // Only initialize once
  if (autoTrackingInitialized) {
    return;
  }

  try {
    console.log('🚀 Initializing auto-tracking service...');
    
    // Dynamic import to avoid module loading issues
    const { startAutoTracking } = require('./auto-tracker.ts');
    
    // Start auto-tracking with a delay to ensure database is ready
    setTimeout(async () => {
      try {
        await startAutoTracking();
        console.log('✅ Auto-tracking service started successfully');
      } catch (error) {
        console.error('❌ Error starting auto-tracking service:', error);
      }
    }, 5000); // 5 second delay to ensure everything is ready

    autoTrackingInitialized = true;

  } catch (error) {
    console.error('❌ Error initializing auto-tracking service:', error);
  }
}

export async function initializeServerSideMediaWorker() {
  // Only initialize once
  if (mediaWorkerInitialized) {
    return;
  }

  try {
    console.log('🚀 Initializing server-side media worker...');
    
    // Dynamic import to avoid module loading issues
    const { processPendingMedia } = require('../scripts/media-worker.js');
    
    // Process pending media immediately on startup
    setTimeout(async () => {
      try {
        await processPendingMedia(5);
        console.log('✅ Initial media processing complete');
      } catch (error) {
        console.error('❌ Error in initial media processing:', error);
      }
    }, 2000);

    // Set up interval processing (every 2 minutes)
    workerInterval = setInterval(async () => {
      try {
        await processPendingMedia(5);
      } catch (error) {
        console.error('❌ Error in media worker interval:', error);
      }
    }, 2 * 60 * 1000);

    mediaWorkerInitialized = true;
    console.log('✅ Server-side media worker initialized');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      if (workerInterval) {
        clearInterval(workerInterval);
        console.log('🛑 Media worker interval cleared');
      }
    });

    process.on('SIGTERM', () => {
      if (workerInterval) {
        clearInterval(workerInterval);
        console.log('🛑 Media worker interval cleared');
      }
    });

  } catch (error) {
    console.error('❌ Error initializing server-side media worker:', error);
  }
}

// Auto-initialize in both development and production
if (typeof window === 'undefined') {
  initializeServerSideMediaWorker();
  initializeAutoTracking();
}