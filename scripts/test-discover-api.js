const { PrismaClient } = require('@prisma/client');

// Import the filtering functions
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

function filterAds(ads, filters, brandName) {
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

async function testDiscoverAPI() {
  console.log('🧪 Testing Discover API Logic...\n');

  try {
    // Get total count
    const totalCount = await prisma.ad.count();
    console.log(`📊 Total ads in database: ${totalCount}`);

    // Test fetching ALL ads and filtering
    console.log('\n🔍 Testing: Fetch ALL ads and filter for Video format...');
    
    const startTime = Date.now();
    
    // Fetch ALL ads (simulating the new API logic)
    const allAds = await prisma.ad.findMany({
      select: {
        id: true,
        type: true,
        content: true,
        imageUrl: true,
        videoUrl: true,
        localImageUrl: true,
        localVideoUrl: true,
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
    
    // Apply Video filter
    const filterStartTime = Date.now();
    const filters = createInitialFilterState();
    filters.format = ['Video'];
    
    const videoAds = filterAds(allAds, filters);
    const filterTime = Date.now() - filterStartTime;
    
    console.log(`🎥 Found ${videoAds.length} video ads in ${filterTime}ms`);
    
    // Show sample results
    if (videoAds.length > 0) {
      console.log('\n📋 Sample Video Ads:');
      videoAds.slice(0, 5).forEach((ad, index) => {
        console.log(`  ${index + 1}. ${ad.id} - ${ad.brand?.name || 'Unknown Brand'} (${ad.type})`);
      });
      if (videoAds.length > 5) {
        console.log(`  ... and ${videoAds.length - 5} more`);
      }
    } else {
      console.log('❌ No video ads found');
    }
    
    // Test other formats
    console.log('\n🔍 Testing other formats...');
    const formatTests = ['Image', 'Carousal'];
    
    formatTests.forEach(format => {
      const filters = createInitialFilterState();
      filters.format = [format];
      const result = filterAds(allAds, filters);
      console.log(`  ${format}: ${result.length} ads`);
    });
    
    const totalTime = Date.now() - startTime;
    console.log(`\n⏱️  Total time: ${totalTime}ms`);
    console.log(`📈 Performance: ${Math.round(allAds.length / (totalTime / 1000))} ads/second`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDiscoverAPI(); 