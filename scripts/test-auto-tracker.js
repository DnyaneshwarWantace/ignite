// Simple test script to verify auto-tracker via API calls
async function testAutoTracker() {
  console.log('🧪 Testing Auto-Tracker via API...\n');

  const baseUrl = 'http://localhost:3000';

  try {
    // Check initial status
    console.log('📊 Checking initial status...');
    let response = await fetch(`${baseUrl}/api/v1/auto-tracker`);
    let data = await response.json();
    console.log('Initial Status:', JSON.stringify(data, null, 2));

    if (!data.status.isRunning) {
      // Start auto-tracking
      console.log('\n🚀 Starting auto-tracker...');
      response = await fetch(`${baseUrl}/api/v1/auto-tracker`, {
        method: 'POST'
      });
      data = await response.json();
      console.log('Start Response:', JSON.stringify(data, null, 2));

      // Wait a bit
      console.log('\n⏳ Waiting 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check status again
      console.log('\n📊 Checking status after start...');
      response = await fetch(`${baseUrl}/api/v1/auto-tracker`);
      data = await response.json();
      console.log('Final Status:', JSON.stringify(data, null, 2));
    }

    console.log('\n✅ Test complete!');
    console.log('\n💡 Auto-tracker should now be running and will check for new ads every 24 hours');
    console.log('💡 Media worker runs every 2 minutes to download media from new ads');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n⚠️  Make sure your Next.js development server is running on localhost:3000');
    console.log('   Run: npm run dev');
  }
}

testAutoTracker();
