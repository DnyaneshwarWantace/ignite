const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugAdStructure() {
  console.log('🔍 Debugging Ad Data Structure...\n');

  try {
    // Get a few sample ads
    const ads = await prisma.ad.findMany({
      take: 5,
      include: {
        brand: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${ads.length} ads to analyze\n`);

    ads.forEach((ad, index) => {
      console.log(`\n--- Ad ${index + 1}: ${ad.id} ---`);
      console.log(`Type: ${ad.type}`);
      console.log(`Video URL: ${ad.videoUrl || 'None'}`);
      console.log(`Image URL: ${ad.imageUrl || 'None'}`);
      console.log(`Local Video URL: ${ad.localVideoUrl || 'None'}`);
      console.log(`Local Image URL: ${ad.localImageUrl || 'None'}`);
      console.log(`Brand: ${ad.brand?.name || 'Unknown'}`);
      
      // Parse and analyze content
      try {
        const content = JSON.parse(ad.content);
        console.log('\n📄 Content Analysis:');
        console.log(`- Keys: ${Object.keys(content).join(', ')}`);
        
        if (content.snapshot) {
          console.log(`- Snapshot keys: ${Object.keys(content.snapshot).join(', ')}`);
          console.log(`- Display format: ${content.snapshot.display_format || 'None'}`);
          console.log(`- Cards: ${content.snapshot.cards ? content.snapshot.cards.length : 'None'}`);
          console.log(`- Images: ${content.snapshot.images ? content.snapshot.images.length : 'None'}`);
          console.log(`- Videos: ${content.snapshot.videos ? content.snapshot.videos.length : 'None'}`);
        }
        
        console.log(`- Publisher platform: ${content.publisher_platform || 'None'}`);
        console.log(`- Is active: ${content.is_active}`);
        console.log(`- Page categories: ${content.snapshot?.page_categories?.join(', ') || 'None'}`);
        
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

debugAdStructure(); 