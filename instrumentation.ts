export async function register() {
  // Only run in development and on server side
  if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
    console.log('🔧 Next.js instrumentation: Starting services...');
 
    // Import and initialize services
    const { initializeServerSideMediaWorker, initializeAutoTracking } = await import('./lib/server-startup');
    await initializeServerSideMediaWorker();
    await initializeAutoTracking();
  }
}