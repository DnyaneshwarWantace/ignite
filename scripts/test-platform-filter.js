const { PrismaClient } = require('@prisma/client');

// Import the JavaScript versions of the functions
function getAdPlatform(ad) {
  try {
    const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
    
    // Get publisher_platform from API
    if (content.publisher_platform && Array.isArray(content.publisher_platform)) {
      return content.publisher_platform.map((platform) => {
        const p = platform.toLowerCase();
        if (p === 'facebook') return 'Facebook';
        if (p === 'instagram') return 'Instagram';
        if (p === 'tiktok') return 'TikTok Organic';
        if (p === 'youtube') return 'Youtube';
        if (p === 'linkedin') return 'LinkedIn';
        if (p === 'audience_network') return 'Facebook';
        if (p === 'messenger') return 'Facebook';
        return p.charAt(0).toUpperCase() + p.slice(1);
      });
    }
    
    // Handle comma-separated string format
    if (content.publisher_platform && typeof content.publisher_platform === 'string') {
      const platforms = content.publisher_platform.split(',').map((p) => p.trim().toLowerCase());
      return platforms.map((platform) => {
        if (platform === 'facebook') return 'Facebook';
        if (platform === 'instagram') return 'Instagram';
        if (platform === 'tiktok') return 'TikTok Organic';
        if (platform === 'youtube') return 'Youtube';
        if (platform === 'linkedin') return 'LinkedIn';
        if (platform === 'audience_network') return 'Facebook';
        if (platform === 'messenger') return 'Facebook';
        return platform.charAt(0).toUpperCase() + platform.slice(1);
      });
    }
  } catch (e) {
    console.error('Error in getAdPlatform:', e);
  }
  
  return ['Facebook'];
}

const prisma = new PrismaClient();

async function testPlatformFilter() {
  console.log('🌐 Testing Platform Filter with Real Data...\n');

  try {
    const ads = await prisma.ad.findMany({
      take: 10,
      include: {
        brand: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${ads.length} ads to test\n`);

    ads.forEach((ad, index) => {
      console.log(`\n--- Ad ${index + 1}: ${ad.id} ---`);
      console.log(`Brand: ${ad.brand?.name || 'Unknown'}`);
      
      try {
        const content = JSON.parse(ad.content);
        console.log(`Raw publisher_platform: ${content.publisher_platform}`);
        
        const platforms = getAdPlatform(ad);
        console.log(`Detected platforms: ${platforms.join(', ')}`);
        
        // Test each platform filter
        const testPlatforms = ['Facebook', 'Instagram', 'TikTok Organic', 'Youtube'];
        testPlatforms.forEach(platform => {
          const matches = platforms.includes(platform);
          console.log(`  ${platform}: ${matches ? '✅' : '❌'}`);
        });
        
      } catch (e) {
        console.log('❌ Error parsing content:', e.message);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPlatformFilter(); 