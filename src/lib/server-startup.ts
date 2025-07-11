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
    const { startAutoTracking, getTrackingStatus } = require('./auto-tracker.ts');
    
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