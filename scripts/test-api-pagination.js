const fetch = require('node-fetch');

async function testAPIPagination() {
  console.log('🧪 Testing API Pagination with Frontend Simulation...\n');

  try {
    // Simulate frontend API calls
    const baseUrl = 'https://ignite-jade.vercel.app/api/v1/discover/ads';
    
    // Test 1: Initial load with Video filter
    console.log('🎥 Test 1: Initial load with Video filter (limit=50)');
    const params1 = new URLSearchParams({
      limit: '50',
      format: 'Video'
    });
    
    const response1 = await fetch(`${baseUrl}?${params1.toString()}`);
    const data1 = await response1.json();
    
    console.log('Response 1:', {
      adsCount: data1.payload?.ads?.length || 0,
      hasMore: data1.payload?.pagination?.hasMore || false,
      nextCursor: data1.payload?.pagination?.nextCursor || null,
      totalAdsBeforeFilter: data1.payload?.totalAdsBeforeFilter || 0,
      totalAdsAfterFilter: data1.payload?.totalAdsAfterFilter || 0
    });
    
    if (data1.payload?.pagination?.hasMore && data1.payload?.pagination?.nextCursor) {
      console.log('✅ Has more results, testing next page...');
      
      // Test 2: Load next page
      console.log('\n🎥 Test 2: Load next page with Video filter');
      const params2 = new URLSearchParams({
        limit: '15', // Simulate frontend batch size
        format: 'Video',
        cursorCreatedAt: data1.payload.pagination.nextCursor.createdAt,
        cursorId: data1.payload.pagination.nextCursor.id
      });
      
      const response2 = await fetch(`${baseUrl}?${params2.toString()}`);
      const data2 = await response2.json();
      
      console.log('Response 2:', {
        adsCount: data2.payload?.ads?.length || 0,
        hasMore: data2.payload?.pagination?.hasMore || false,
        nextCursor: data2.payload?.pagination?.nextCursor || null
      });
      
      if (data2.payload?.pagination?.hasMore && data2.payload?.pagination?.nextCursor) {
        console.log('✅ Has more results, testing third page...');
        
        // Test 3: Load third page
        console.log('\n🎥 Test 3: Load third page with Video filter');
        const params3 = new URLSearchParams({
          limit: '15',
          format: 'Video',
          cursorCreatedAt: data2.payload.pagination.nextCursor.createdAt,
          cursorId: data2.payload.pagination.nextCursor.id
        });
        
        const response3 = await fetch(`${baseUrl}?${params3.toString()}`);
        const data3 = await response3.json();
        
        console.log('Response 3:', {
          adsCount: data3.payload?.ads?.length || 0,
          hasMore: data3.payload?.pagination?.hasMore || false,
          nextCursor: data3.payload?.pagination?.nextCursor || null
        });
      }
    } else {
      console.log('❌ No more results or no cursor');
    }
    
    // Test 4: Fashion filter
    console.log('\n👗 Test 4: Initial load with Fashion filter (limit=50)');
    const params4 = new URLSearchParams({
      limit: '50',
      niche: 'Fashion'
    });
    
    const response4 = await fetch(`${baseUrl}?${params4.toString()}`);
    const data4 = await response4.json();
    
    console.log('Response 4:', {
      adsCount: data4.payload?.ads?.length || 0,
      hasMore: data4.payload?.pagination?.hasMore || false,
      nextCursor: data4.payload?.pagination?.nextCursor || null,
      totalAdsBeforeFilter: data4.payload?.totalAdsBeforeFilter || 0,
      totalAdsAfterFilter: data4.payload?.totalAdsAfterFilter || 0
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAPIPagination(); 