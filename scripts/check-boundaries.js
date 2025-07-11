const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBoundaries(pageId) {
  try {
    // Get all ads for this page
    const ads = await prisma.ad.findMany({
      where: {
        brand: {
          pageId: pageId
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    if (ads.length === 0) {
      console.log(`No ads found for page ${pageId}`);
      return;
    }

    console.log(`\n=== Found ${ads.length} ads for page ${pageId} ===\n`);
    
    // Get newest ad (boundary)
    const newestAd = ads[0];
    console.log('=== NEWEST AD (Upper Boundary) ===');
    console.log('ID:', newestAd.libraryId);
    console.log('Created:', newestAd.createdAt.toLocaleString());
    
    try {
      const content = JSON.parse(newestAd.content);
      console.log('Status:', content.is_active ? 'Active' : 'Inactive');
      console.log('Start Date:', content.start_date ? new Date(content.start_date * 1000).toLocaleString() : 'N/A');
    } catch (e) {
      console.log('Error parsing content:', e.message);
    }

    // Find the ad with earliest start_date
    let oldestStartDateAd = null;
    let oldestStartDate = new Date();

    ads.forEach(ad => {
      try {
        const content = JSON.parse(ad.content);
        if (content.start_date) {
          const startDate = new Date(content.start_date * 1000);
          if (startDate < oldestStartDate) {
            oldestStartDate = startDate;
            oldestStartDateAd = ad;
          }
        }
      } catch (e) {}
    });

    if (oldestStartDateAd) {
      console.log('\n=== OLDEST AD BY START DATE (Lower Boundary) ===');
      console.log('ID:', oldestStartDateAd.libraryId);
      console.log('Created:', oldestStartDateAd.createdAt.toLocaleString());
      
      try {
        const content = JSON.parse(oldestStartDateAd.content);
        console.log('Status:', content.is_active ? 'Active' : 'Inactive');
        console.log('Start Date:', content.start_date ? new Date(content.start_date * 1000).toLocaleString() : 'N/A');
        if (content.end_date) {
          console.log('End Date:', new Date(content.end_date * 1000).toLocaleString());
        }
      } catch (e) {
        console.log('Error parsing content:', e.message);
      }
    }

    // Show all ads sorted by start date
    console.log('\n=== ALL ADS (Sorted by Start Date) ===');
    
    const sortedAds = [...ads].sort((a, b) => {
      try {
        const contentA = JSON.parse(a.content);
        const contentB = JSON.parse(b.content);
        const dateA = contentA.start_date ? new Date(contentA.start_date * 1000) : new Date(0);
        const dateB = contentB.start_date ? new Date(contentB.start_date * 1000) : new Date(0);
        return dateA - dateB;
      } catch (e) {
        return 0;
      }
    });

    sortedAds.forEach((ad, index) => {
      console.log(`\nAd #${index + 1}:`);
      console.log('ID:', ad.libraryId);
      console.log('Created:', ad.createdAt.toLocaleString());
      
      try {
        const content = JSON.parse(ad.content);
        console.log('Status:', content.is_active ? 'Active' : 'Inactive');
        console.log('Start Date:', content.start_date ? new Date(content.start_date * 1000).toLocaleString() : 'N/A');
        if (content.end_date) {
          console.log('End Date:', new Date(content.end_date * 1000).toLocaleString());
        }
      } catch (e) {
        console.log('Error parsing content:', e.message);
      }
      console.log('----------------------------------------');
    });

    // Show summary
    console.log('\n=== BOUNDARY SUMMARY ===');
    console.log('Total Ads:', ads.length);
    console.log('Creation Date Range:', ads[ads.length - 1].createdAt.toLocaleString(), 'to', newestAd.createdAt.toLocaleString());
    if (oldestStartDateAd) {
      console.log('Start Date Range:', oldestStartDate.toLocaleString(), 'to', new Date(JSON.parse(newestAd.content).start_date * 1000).toLocaleString());
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check the specific page
checkBoundaries('1506095676301426'); 