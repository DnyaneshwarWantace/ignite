import { scrapeCompanyAds } from '@/apiUtils/adScraper';
import prisma from '@prisma/index';

let trackingInterval: NodeJS.Timeout | null = null;

// Configuration
const TRACKING_INTERVAL = 15 * 60 * 1000; // 15 minutes
const MAX_PAGINATION_PAGES = 20; // Safety limit for pagination

// Logging with timestamp
const log = (message: string) => console.log(`[${new Date().toISOString()}] AUTO-TRACKER: ${message}`);

interface PageTrackingInfo {
  pageId: string;
  lastKnownAdId: string;
  lastKnownAdDate: Date;
  lastKnownAdTime: Date;
  totalAdsInDb: number;
}

/**
 * Get tracking info for a page from database
 */
async function getPageTrackingInfo(pageId: string): Promise<PageTrackingInfo | null> {
  try {
    // Get all ads for this page, ordered by creation date (newest first)
    const allAds = await prisma.ad.findMany({
      where: { 
        brand: { pageId: pageId }
      },
      include: {
        brand: { select: { pageId: true } }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    if (allAds.length === 0) {
      log(`No ads found in database for page ${pageId}`);
      return null;
    }

    // Find the oldest active ad (this becomes our last known ad for pagination boundary)
    const activeAds = allAds.filter(ad => 
      ad.content && (() => {
        try {
          const content = JSON.parse(ad.content);
          return content.is_active !== false;
        } catch {
          return true; // Default to active if can't parse
        }
      })()
    );

    if (activeAds.length === 0) {
      log(`No active ads found for page ${pageId}`);
      return null;
    }

    // Get the oldest active ad (last in the ordered list of active ads)
    const oldestActiveAd = activeAds[activeAds.length - 1];
    
    let adDate = new Date();
    try {
      const content = JSON.parse(oldestActiveAd.content);
      const startDate = content.start_date || content.start_date_string;
      if (startDate) {
        adDate = new Date(typeof startDate === 'number' ? startDate * 1000 : startDate);
      }
    } catch (e) {
      adDate = oldestActiveAd.createdAt;
    }

    return {
      pageId,
      lastKnownAdId: oldestActiveAd.libraryId,
      lastKnownAdDate: adDate,
      lastKnownAdTime: oldestActiveAd.createdAt,
      totalAdsInDb: allAds.length
    };
  } catch (error) {
    log(`Error getting tracking info for page ${pageId}: ${error}`);
    return null;
  }
}

/**
 * Track new ads and update statuses for a specific page
 */
async function trackPageAds(pageId: string): Promise<void> {
  log(`🔄 Starting tracking for page ${pageId}`);

  try {
    const trackingInfo = await getPageTrackingInfo(pageId);
    if (!trackingInfo) {
      log(`⏭️ Skipping page ${pageId} - no tracking info available`);
      return;
    }

    log(`📊 Page ${pageId} tracking info: LastKnownAd=${trackingInfo.lastKnownAdId}, Date=${trackingInfo.lastKnownAdDate.toLocaleDateString()}, Total DB Ads=${trackingInfo.totalAdsInDb}`);

    // Step 1: Use pagination to find new ads (ads newer than last known ad)
    let newAds: any[] = [];
    let currentOffset = 0;
    let foundBoundary = false;
    let pageCount = 0;
    let lastKnownAdStillExists = false;

    log(`🔍 Starting pagination to find new ads...`);

    while (!foundBoundary && pageCount < MAX_PAGINATION_PAGES) {
      try {
        const scrapedAds = await scrapeCompanyAds(pageId, 200, currentOffset);
        
        if (scrapedAds.length === 0) {
          log(`📄 Page ${pageCount + 1}: No more ads found`);
          break;
        }

        log(`📄 Page ${pageCount + 1}: Got ${scrapedAds.length} ads (offset: ${currentOffset})`);

        let newAdsInThisPage = 0;
        
        for (const scrapedAd of scrapedAds) {
          try {
            const content = JSON.parse(scrapedAd.content);
            const adStartDate = content.start_date || content.start_date_string;
            let adDate = new Date();
            
            if (adStartDate) {
              adDate = new Date(typeof adStartDate === 'number' ? adStartDate * 1000 : adStartDate);
            }

            // Check if this is our last known ad (boundary)
            if (scrapedAd.id === trackingInfo.lastKnownAdId) {
              log(`🎯 Found last known ad boundary: ${scrapedAd.id}`);
              lastKnownAdStillExists = true;
              foundBoundary = true;
              break;
            }

            // Check if ad is older than our boundary date
            if (adDate <= trackingInfo.lastKnownAdDate) {
              log(`📅 Reached date boundary: ad ${scrapedAd.id} date ${adDate.toLocaleDateString()} <= boundary ${trackingInfo.lastKnownAdDate.toLocaleDateString()}`);
              foundBoundary = true;
              break;
            }

            // Check if this ad already exists in database
            const existingAd = await prisma.ad.findFirst({
              where: { libraryId: scrapedAd.id }
            });

            if (!existingAd) {
              // This is a new ad
              newAds.push(scrapedAd);
              newAdsInThisPage++;
            } else {
              log(`✓ Found existing ad: ${scrapedAd.id}`);
            }

          } catch (error) {
            log(`❌ Error processing ad: ${error}`);
            continue;
          }
        }

        log(`📄 Page ${pageCount + 1}: ${newAdsInThisPage} new ads, ${scrapedAds.length - newAdsInThisPage} existing ads`);

        if (!foundBoundary && scrapedAds.length === 200) {
          // Continue pagination
          currentOffset += 200;
          pageCount++;
          await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
        } else {
          break;
        }

      } catch (error) {
        log(`❌ Error in pagination page ${pageCount + 1}: ${error}`);
        break;
      }
    }

    log(`📊 Pagination complete: Found ${newAds.length} new ads`);

    // Step 2: Save new ads to database
    let savedNewAdsCount = 0;
    for (const newAd of newAds) {
      try {
        // Find the brand for this pageId
        const brand = await prisma.brand.findFirst({
          where: { pageId: pageId }
        });

        if (brand) {
          await prisma.ad.create({
            data: {
              libraryId: newAd.id,
              type: newAd.type,
              content: newAd.content,
              imageUrl: newAd.imageUrl || '',
              videoUrl: newAd.videoUrl,
              text: newAd.text || '',
              headline: newAd.headline || '',
              description: newAd.description || '',
              brandId: brand.id,
              mediaStatus: 'pending',
              mediaRetryCount: 0
            }
          });
          savedNewAdsCount++;
          log(`✅ NEW AD SAVED: ${newAd.id}`);
        }
      } catch (error: any) {
        if (!error.message.includes('Unique constraint')) {
          log(`❌ Error saving new ad ${newAd.id}: ${error}`);
        }
      }
    }

    // Step 3: Check status of existing ads by fetching current active ads
    log(`🔍 Checking status of existing ads...`);
    
    const currentActiveAds = await scrapeCompanyAds(pageId, 2000, 0); // Get more ads to check status
    const activeAdIds = new Set(currentActiveAds.map(ad => ad.id));
    
    log(`📊 Currently active ads from API: ${activeAdIds.size}`);

    // Get all ads from database for this page
    const dbAds = await prisma.ad.findMany({
      where: {
        brand: { pageId: pageId }
      },
      include: {
        brand: { select: { pageId: true } }
      }
    });

    let stillActiveCount = 0;
    let becameInactiveCount = 0;
    let reactivatedCount = 0;
    let lastKnownAdBecameInactive = false;

    for (const dbAd of dbAds) {
      const isCurrentlyActive = activeAdIds.has(dbAd.libraryId);
      
      try {
        const content = JSON.parse(dbAd.content);
        const wasActive = content.is_active !== false;

        if (isCurrentlyActive && wasActive) {
          // Still active - no change needed
          stillActiveCount++;
          
        } else if (isCurrentlyActive && !wasActive) {
          // Became active again
          const updatedContent = { ...content, is_active: true };
          await prisma.ad.update({
            where: { id: dbAd.id },
            data: {
              content: JSON.stringify(updatedContent)
            }
          });
          reactivatedCount++;
          log(`🔄 REACTIVATED: ${dbAd.libraryId}`);
          
        } else if (!isCurrentlyActive && wasActive) {
          // Became inactive
          const updatedContent = { ...content, is_active: false };
          await prisma.ad.update({
            where: { id: dbAd.id },
            data: {
              content: JSON.stringify(updatedContent)
            }
          });
          becameInactiveCount++;
          log(`❌ BECAME INACTIVE: ${dbAd.libraryId}`);
          
          // Check if this was our last known ad
          if (dbAd.libraryId === trackingInfo.lastKnownAdId) {
            lastKnownAdBecameInactive = true;
            log(`⚠️ Last known ad ${trackingInfo.lastKnownAdId} became inactive`);
          }
        }
      } catch (error) {
        log(`❌ Error updating ad status for ${dbAd.libraryId}: ${error}`);
      }
    }

    // Step 4: Update last known ad if it became inactive
    if (lastKnownAdBecameInactive || !lastKnownAdStillExists) {
      log(`🔄 Finding new last known ad...`);
      
      // Find the new oldest active ad to be our boundary
      const activeDbAds = await prisma.ad.findMany({
        where: {
          brand: { pageId: pageId }
        },
        include: {
          brand: { select: { pageId: true } }
        },
        orderBy: [
          { createdAt: 'asc' } // Oldest first
        ]
      });

      const newActiveAds = activeDbAds.filter(ad => {
        try {
          const content = JSON.parse(ad.content);
          return content.is_active !== false;
        } catch {
          return true;
        }
      });

      if (newActiveAds.length > 0) {
        const newLastKnownAd = newActiveAds[0]; // Oldest active ad
        log(`✅ New last known ad: ${newLastKnownAd.libraryId}`);
      } else {
        log(`⚠️ No active ads left for page ${pageId}`);
      }
    }

    // Step 5: Update brand total ads count
    const brand = await prisma.brand.findFirst({
      where: { pageId: pageId }
    });

    if (brand) {
      const totalAds = await prisma.ad.count({
        where: { brandId: brand.id }
      });

      await prisma.brand.update({
        where: { id: brand.id },
        data: { totalAds: totalAds }
      });
    }

    log(`📊 TRACKING SUMMARY for ${pageId}:`);
    log(`   - New ads added: ${savedNewAdsCount}`);
    log(`   - Still active: ${stillActiveCount}`);
    log(`   - Became inactive: ${becameInactiveCount}`);
    log(`   - Reactivated: ${reactivatedCount}`);

  } catch (error) {
    log(`❌ Error tracking page ${pageId}: ${error}`);
  }
}

/**
 * Get all unique page IDs that have been scraped by users
 */
async function getAllTrackedPageIds(): Promise<string[]> {
  try {
    const brands = await prisma.brand.findMany({
      where: {
        pageId: { not: null }
      },
      select: { pageId: true },
      distinct: ['pageId']
    });

    return brands.map(brand => brand.pageId).filter((pageId): pageId is string => Boolean(pageId));
  } catch (error) {
    log(`Error getting tracked page IDs: ${error}`);
    return [];
  }
}

/**
 * Start the auto-tracking service
 */
export async function startAutoTracking(): Promise<boolean> {
  log(`🚀 Starting auto-tracking service...`);

  if (trackingInterval) {
    log(`⚠️ Auto-tracking already running`);
    return true;
  }

  async function runTrackingCycle() {
    const startTime = Date.now();
    log(`🔄 === AUTO-TRACKING CYCLE START ===`);

    try {
      const pageIds = await getAllTrackedPageIds();
      
      if (pageIds.length === 0) {
        log(`⚠️ No pages to track`);
        return;
      }

      log(`📋 Found ${pageIds.length} pages to track: ${pageIds.join(', ')}`);

      // Track each page
      for (const pageId of pageIds) {
        await trackPageAds(pageId);
        // Small delay between pages to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const duration = Date.now() - startTime;
      const nextRun = new Date(Date.now() + TRACKING_INTERVAL);
      log(`✅ === AUTO-TRACKING CYCLE COMPLETE === (took ${Math.round(duration/1000)}s)`);
      log(`⏰ Next cycle at: ${nextRun.toLocaleTimeString()}`);

    } catch (error) {
      log(`❌ Tracking cycle error: ${error}`);
    }
  }

  // Run immediately
  runTrackingCycle();

  // Set up interval
  trackingInterval = setInterval(runTrackingCycle, TRACKING_INTERVAL);
  
  log(`✅ Auto-tracking started with 15-minute intervals`);
  return true;
}

/**
 * Stop the auto-tracking service
 */
export function stopAutoTracking(): void {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
    log(`🛑 Auto-tracking stopped`);
  }
}

/**
 * Get current tracking status
 */
export function getTrackingStatus() {
  return {
    isRunning: trackingInterval !== null,
    intervalMinutes: TRACKING_INTERVAL / (60 * 1000),
    nextRun: trackingInterval ? new Date(Date.now() + TRACKING_INTERVAL) : null
  };
}

/**
 * Manually trigger tracking for a specific page
 */
export async function trackSpecificPage(pageId: string): Promise<void> {
  log(`🎯 Manual tracking triggered for page ${pageId}`);
  await trackPageAds(pageId);
} 