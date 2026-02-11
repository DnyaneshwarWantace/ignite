let mediaWorkerInitialized = false;
let autoTrackingInitialized = false;
let mediaWorkerTimeout: NodeJS.Timeout | null = null;
const MEDIA_BATCH_SIZE = 15;
const DELAY_WHEN_MORE_PENDING_MS = 5000;
const DELAY_WHEN_IDLE_MS = 2 * 60 * 1000;

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
    console.log('🚀 Initializing server-side media worker (continuous until queue empty)...');

    function scheduleNext(delayMs: number) {
      if (mediaWorkerTimeout) clearTimeout(mediaWorkerTimeout);
      mediaWorkerTimeout = setTimeout(async () => {
        mediaWorkerTimeout = null;
        try {
          const response = await fetch(`http://localhost:3000/api/v1/media/process?batch=${MEDIA_BATCH_SIZE}`);
          const contentType = response.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            const text = await response.text();
            console.error(`❌ Media API returned non-JSON (${response.status}): ${text.slice(0, 200)}`);
            scheduleNext(DELAY_WHEN_IDLE_MS);
            return;
          }
          const result = await response.json();

          if (result.success && result.results) {
            const { processed, success, failed, totalDone, remaining } = result.results;
            console.log(`📦 Media batch done: ${success} succeeded, ${failed} failed (${processed} in batch) | Total done: ${totalDone ?? '?'} | Remaining: ${remaining ?? '?'}`);
            if (processed > 0) {
              scheduleNext(DELAY_WHEN_MORE_PENDING_MS);
              return;
            }
          } else {
            console.error('❌ Media processing failed:', result.error);
          }
        } catch (error) {
          console.error('❌ Error calling media processing API:', error);
        }
        scheduleNext(DELAY_WHEN_IDLE_MS);
      }, delayMs);
    }

    setTimeout(() => {
      scheduleNext(0);
    }, 3000);

    mediaWorkerInitialized = true;
    console.log('✅ Media worker started — will process pending ads in 3s, then every 5s until queue empty');

    process.on('SIGINT', () => {
      if (mediaWorkerTimeout) {
        clearTimeout(mediaWorkerTimeout);
        mediaWorkerTimeout = null;
        console.log('🛑 Media worker stopped');
      }
    });

    process.on('SIGTERM', () => {
      if (mediaWorkerTimeout) {
        clearTimeout(mediaWorkerTimeout);
        mediaWorkerTimeout = null;
        console.log('🛑 Media worker stopped');
      }
    });

  } catch (error) {
    console.error('❌ Error initializing server-side media worker:', error);
  }
} 