export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🔧 Next.js instrumentation: Starting background services...');

    // Start services in a completely non-blocking way
    // Don't await - let them start in the background
    Promise.resolve().then(async () => {
      // Wait for server to be ready (shorter so worker starts sooner)
      await new Promise(resolve => setTimeout(resolve, 5000));

      try {
        const { initializeServerSideMediaWorker, initializeAutoTracking } = await import('./src/lib/server-startup');

        initializeServerSideMediaWorker().catch(err => console.error('Media worker init error:', err));
        initializeAutoTracking().catch(err => console.error('Auto-tracker init error:', err));

        console.log('✅ Background services (media worker + auto-tracking) started');
      } catch (error) {
        console.error('❌ Failed to import server startup:', error);
      }
    });
  }
}