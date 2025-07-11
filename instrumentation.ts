export async function register() {
  // Only run in development and on server side
  if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
    console.log('🔧 Next.js instrumentation: Starting media worker...');
 
    // Import and initialize the media worker
    const { initializeServerSideMediaWorker } = await import('./lib/server-startup');
    await initializeServerSideMediaWorker();
  }
}