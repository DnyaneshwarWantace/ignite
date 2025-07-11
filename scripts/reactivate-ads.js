const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reactivateAllAds() {
  try {
    // Get all ads
    const ads = await prisma.ad.findMany();
    console.log(`Found ${ads.length} total ads`);
    
    let reactivatedCount = 0;
    
    // Update each ad's content to set is_active to true
    for (const ad of ads) {
      try {
        const content = JSON.parse(ad.content);
        content.is_active = true;
        
        await prisma.ad.update({
          where: { id: ad.id },
          data: { content: JSON.stringify(content) }
        });
        
        reactivatedCount++;
        console.log(`✅ Reactivated ad: ${ad.libraryId}`);
      } catch (error) {
        console.error(`❌ Error reactivating ad ${ad.libraryId}:`, error);
      }
    }
    
    console.log(`\n=== REACTIVATION COMPLETE ===`);
    console.log(`Total ads processed: ${ads.length}`);
    console.log(`Successfully reactivated: ${reactivatedCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reactivateAllAds(); 