const fetch = require('node-fetch');

async function quickTest() {
  console.log('🧪 Quick API Test...\n');

  try {
    // Test Video filter with limit=50
    const response = await fetch('https://ignite-jade.vercel.app/api/v1/discover/ads?limit=50&format=Video');
    const data = await response.json();
    
    console.log('Video Filter Response:');
    console.log('- Ads returned:', data.payload?.ads?.length || 0);
    console.log('- Has more:', data.payload?.pagination?.hasMore);
    console.log('- Next cursor:', data.payload?.pagination?.nextCursor ? 'exists' : 'null');
    console.log('- Total before filter:', data.payload?.totalAdsBeforeFilter || 0);
    console.log('- Total after filter:', data.payload?.totalAdsAfterFilter || 0);
    
    if (data.payload?.pagination?.hasMore && data.payload?.pagination?.nextCursor) {
      console.log('\n✅ API is working correctly - should load more ads!');
    } else {
      console.log('\n❌ API says no more ads');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

quickTest(); 