"use client";

import { useEffect } from 'react';

export function StartupInitializer() {
  useEffect(() => {
    // Initialize background services after the page has loaded
    // This runs only once when the app first mounts
    const timer = setTimeout(() => {
      fetch('/api/startup')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('🚀 Background services started');
          }
        })
        .catch(error => {
          console.error('Failed to start background services:', error);
        });
    }, 2000); // Wait 2 seconds after page load

    return () => clearTimeout(timer);
  }, []); // Empty dependency array ensures this runs only once

  return null; // This component renders nothing
}
