const { PrismaClient } = require('@prisma/client');

// Import filtering functions
function createInitialFilterState() {
  return {
    format: [],
    platform: [],
    status: [],
    language: [],
    niche: [],
    date: null,
    search: '',
    sort: null
  };
}

function getAdFormat(ad) {
  try {
    if (ad.type) {
      const type = ad.type.toLowerCase();
      if (type === 'video') return 'Video';
      if (type === 'image') return 'Image';
      if (type === 'carousel') return 'Carousal';
    }
    
    if (ad.videoUrl || ad.localVideoUrl) {
      return 'Video';
    }
    
    if (ad.imageUrl || ad.localImageUrl) {
      return 'Image';
    }
    
    const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
    const snapshot = content?.snapshot || {};
    
    if (snapshot.cards && snapshot.cards.length > 1) return 'Carousal';
    if (Array.isArray(snapshot.images) && snapshot.images.length > 1) return 'Carousal';
    
    if (snapshot.display_format) {
      const format = snapshot.display_format.toUpperCase();
      if (format === 'VIDEO') return 'Video';
      if (format === 'IMAGE') return 'Image';
      if (format === 'CAROUSEL') return 'Carousal';
      if (format === 'DCO') {
        if (snapshot.videos?.length > 0) return 'Video';
        if (snapshot.images?.length > 0) return 'Image';
        if (snapshot.cards?.length > 0) return 'Carousal';
        return 'Image';
      }
    }
    
    if (snapshot.videos?.length > 0) return 'Video';
    if (snapshot.images?.length > 0) return 'Image';
    if (snapshot.cards?.length > 0) return 'Carousal';
    
    return 'Image';
  } catch (e) {
    return 'Image';
  }
}

function filterAds(ads, filters) {
  if (!ads || ads.length === 0) return [];
  
  let filtered = ads;
  
  if (filters.format && filters.format.length > 0) {
    const beforeCount = filtered.length;
    filtered = filtered.filter((ad) => {
      const adFormat = getAdFormat(ad);
      return filters.format.includes(adFormat);
    });
    console.log(`🔍 Format filter (${filters.format.join(', ')}): ${beforeCount} -> ${filtered.length} ads`);
  }
  
  return filtered;
}

const prisma = new PrismaClient();

async function testPagination() {
  console.log('🧪 Testing Pagination with Filters...\n');

  try {
    const totalCount = await prisma.ad.count();
    console.log(`📊 Total ads in database: ${totalCount}`);

    // Fetch ALL ads
    console.log('\n🔍 Fetching ALL ads...');
    const startTime = Date.now();
    
    const allAds = await prisma.ad.findMany({
      select: {
        id: true,
        type: true,
        content: true,
        imageUrl: true,
        videoUrl: true,
        localImageUrl: true,
        localVideoUrl: true,
        createdAt: true,
        brand: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }
      ]
    });
    
    const fetchTime = Date.now() - startTime;
    console.log(`⏱️  Fetched ${allAds.length} ads in ${fetchTime}ms`);

    // Test Video filter pagination
    console.log('\n🎥 Testing Video Filter Pagination:');
    
    const filters = createInitialFilterState();
    filters.format = ['Video'];
    
    const videoAds = filterAds(allAds, filters);
    console.log(`📹 Total video ads found: ${videoAds.length}`);
    
    // Simulate pagination
    const limit = 10;
    let page = 1;
    let startIndex = 0;
    
    while (startIndex < videoAds.length) {
      const endIndex = startIndex + limit;
      const pageAds = videoAds.slice(startIndex, endIndex);
      const hasMore = endIndex < videoAds.length;
      
      console.log(`  Page ${page}: ${pageAds.length} ads (${startIndex + 1}-${Math.min(endIndex, videoAds.length)} of ${videoAds.length})`);
      
      if (pageAds.length > 0) {
        console.log(`    First ad: ${pageAds[0].id} - ${pageAds[0].brand?.name || 'Unknown'}`);
        console.log(`    Last ad: ${pageAds[pageAds.length - 1].id} - ${pageAds[pageAds.length - 1].brand?.name || 'Unknown'}`);
      }
      
      if (!hasMore) {
        console.log(`    ✅ Reached end of results`);
        break;
      }
      
      startIndex = endIndex;
      page++;
    }

    // Test Fashion filter pagination
    console.log('\n👗 Testing Fashion Filter Pagination:');
    
    const fashionFilters = createInitialFilterState();
    fashionFilters.niche = ['Fashion'];
    
    const fashionAds = filterAds(allAds, fashionFilters);
    console.log(`👗 Total fashion ads found: ${fashionAds.length}`);
    
    // Simulate pagination
    page = 1;
    startIndex = 0;
    
    while (startIndex < fashionAds.length) {
      const endIndex = startIndex + limit;
      const pageAds = fashionAds.slice(startIndex, endIndex);
      const hasMore = endIndex < fashionAds.length;
      
      console.log(`  Page ${page}: ${pageAds.length} ads (${startIndex + 1}-${Math.min(endIndex, fashionAds.length)} of ${fashionAds.length})`);
      
      if (pageAds.length > 0) {
        console.log(`    First ad: ${pageAds[0].id} - ${pageAds[0].brand?.name || 'Unknown'}`);
        console.log(`    Last ad: ${pageAds[pageAds.length - 1].id} - ${pageAds[pageAds.length - 1].brand?.name || 'Unknown'}`);
      }
      
      if (!hasMore) {
        console.log(`    ✅ Reached end of results`);
        break;
      }
      
      startIndex = endIndex;
      page++;
    }

    const totalTime = Date.now() - startTime;
    console.log(`\n⏱️  Total test time: ${totalTime}ms`);
    console.log(`📈 Performance: ${Math.round(allAds.length / (totalTime / 1000))} ads/second`);
    
    console.log('\n✅ Pagination test completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPagination(); 