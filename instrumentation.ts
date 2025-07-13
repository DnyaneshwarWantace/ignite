export async function register() {
  // Only run on server side (both development and production)
  if (typeof window === 'undefined') {
    console.log('🔧 Next.js instrumentation: Starting services...');
 
    // Import and initialize the media worker and auto-tracking
    const { initializeServerSideMediaWorker, initializeAutoTracking } = await import('./lib/server-startup');
    
    // Initialize services with error handling
    try {
    await initializeServerSideMediaWorker();
      console.log('✅ Media worker initialized');
    } catch (error) {
      console.error('❌ Failed to initialize media worker:', error);
    }
    
    try {
      await initializeAutoTracking();
      console.log('✅ Auto-tracking initialized');
    } catch (error) {
      console.error('❌ Failed to initialize auto-tracking:', error);
    }
  }
}