let mediaWorkerInitialized = false;
let autoTrackingInitialized = false;
let workerInterval: NodeJS.Timeout | null = null;

export async function initializeAutoTracking() {
  // Only initialize once
  if (autoTrackingInitialized) {
    console.log('⚠️ Auto-tracking already initialized');
    return;
  }

  try {
    console.log('🚀 Initializing auto-tracking service...');

    // Dynamic import to avoid module loading issues
    const { startAutoTracking, getTrackingStatus } = await import('./auto-tracker');

    // Check if auto-tracking is already running
    const status = getTrackingStatus();
    if (status.isRunning || status.isCycleInProgress) {
      console.log('⚠️ Auto-tracking is already running, skipping initialization');
      autoTrackingInitialized = true;
      return;
    }

    // Start auto-tracking with a delay to ensure database is ready
    setTimeout(async () => {
      try {
        const started = await startAutoTracking();
        if (started) {
          console.log('✅ Auto-tracking service started successfully');
        } else {
          console.log('⚠️ Auto-tracking service could not be started');
        }
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
    console.log('⚠️ Media worker already initialized');
    return;
  }

  try {
    console.log('🚀 Initializing server-side media worker...');

    // Function to process media via API endpoint (uses Supabase storage)
    async function processMediaViaAPI(batchSize: number = 10) {
      try {
        const response = await fetch(`http://localhost:3000/api/v1/media/process?batch=${batchSize}`);
        const result = await response.json();

        if (result.success) {
          console.log(`✅ Media processing complete: ${result.results.success} succeeded, ${result.results.failed} failed`);
        } else {
          console.error('❌ Media processing failed:', result.error);
        }
      } catch (error) {
        console.error('❌ Error calling media processing API:', error);
      }
    }

    // Process pending media immediately on startup
    setTimeout(async () => {
      try {
        await processMediaViaAPI(10);
        console.log('✅ Initial media processing complete');
      } catch (error) {
        console.error('❌ Error in initial media processing:', error);
      }
    }, 10000); // Wait 10 seconds for server to be ready

    // Set up interval processing (every 2 minutes)
    workerInterval = setInterval(async () => {
      try {
        await processMediaViaAPI(10);
      } catch (error) {
        console.error('❌ Error in media worker interval:', error);
      }
    }, 2 * 60 * 1000);

    mediaWorkerInitialized = true;
    console.log('✅ Server-side media worker initialized (using Supabase storage)');

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