let mediaWorkerStarted = false;

export async function startMediaWorkerOnServerStart() {
  // Only start once and only in development
  if (mediaWorkerStarted || process.env.NODE_ENV === 'production') {
    return;
  }

  try {
    console.log('🚀 Auto-starting media worker...');
    
    // Start the media worker via API endpoint
    const response = await fetch('https://ignite-ldg4.onrender.com/api/v1/media/worker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intervalMinutes: 2
      })
    });

    if (response.ok) {
      console.log('✅ Media worker started successfully');
      mediaWorkerStarted = true;
    } else {
      console.log('⚠️ Failed to start media worker via API');
    }
  } catch (error) {
    // If API is not ready yet, that's expected on first startup
    console.log('📡 API not ready yet, media worker will start when needed');
  }
}

// Auto-start function for development
export function initializeMediaWorker() {
  if (process.env.NODE_ENV === 'development') {
    // Start after a small delay to let the server fully initialize
    setTimeout(() => {
      startMediaWorkerOnServerStart().catch(console.error);
    }, 5000);
  }
}