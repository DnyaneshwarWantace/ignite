import { scrapeCompanyAds } from '@/apiUtils/adScraper';
import prisma from '@prisma/index';

// Service state tracking
let trackingInterval: NodeJS.Timeout | null = null;
let isTrackingCycleRunning = false;
let lastCycleStartTime: Date | null = null;
let lastCycleEndTime: Date | null = null;
let nextCycleTime: Date | null = null;

// Configuration
const TRACKING_INTERVAL = 30 * 60 * 1000; // 30 minutes
const MAX_PAGINATION_PAGES = 20; // Safety limit for pagination

// Logging with timestamp
const log = (message: string) => console.log(`[${new Date().toISOString()}] AUTO-TRACKER: ${message}`);

interface PageTrackingInfo {
  pageId: string;
  lastKnownAdId: string;
  lastKnownAdDate: Date;
  lastKnownAdTime: Date;
  oldestAdId: string;    // Added for oldest ad tracking
  oldestAdStartDate: Date;  // Added for oldest ad tracking
  oldestAdCreatedAt: Date;  // Added for creation time boundary
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

    // Find the ad with the oldest start date
    let oldestStartDate = new Date();
    let oldestStartDateAd = allAds[0];
    
    for (const ad of allAds) {
      try {
        const content = JSON.parse(ad.content);
        const startDate = content.start_date || content.start_date_string;
        if (startDate) {
          const adStartDate = new Date(typeof startDate === 'number' ? startDate * 1000 : startDate);
          if (adStartDate < oldestStartDate) {
            oldestStartDate = adStartDate;
            oldestStartDateAd = ad;
          }
        }
      } catch (e) {
        // Skip ads with invalid content
        continue;
      }
    }

    return {
      pageId,
      lastKnownAdId: oldestActiveAd.libraryId,
      lastKnownAdDate: adDate,
      lastKnownAdTime: oldestActiveAd.createdAt,
      oldestAdId: oldestStartDateAd.libraryId,
      oldestAdStartDate: oldestStartDate,
      oldestAdCreatedAt: oldestStartDateAd.createdAt,
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

    log(`📊 Page ${pageId} tracking info:`);
    log(`   - Last Known Ad: ${trackingInfo.lastKnownAdId} (${trackingInfo.lastKnownAdDate.toLocaleDateString()})`);
    log(`   - Oldest Ad: ${trackingInfo.oldestAdId}`);
    log(`   - Oldest Ad Created: ${trackingInfo.oldestAdCreatedAt.toLocaleString()}`);
    log(`   - Oldest Ad Start Date: ${trackingInfo.oldestAdStartDate.toLocaleString()}`);
    log(`   - Total DB Ads: ${trackingInfo.totalAdsInDb}`);

    // Step 1: Use pagination to find new ads and check status of existing ones
    let newAds: any[] = [];
    let currentOffset = 0;
    let foundBoundary = false;
    let pageCount = 0;
    let lastKnownAdStillExists = false;
    let foundOldestAdId = false;
    let reachedCreationTime = false;

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
        let reachedOldestDate = false;
        
        for (const scrapedAd of scrapedAds) {
          try {
            // First priority: Check if this is our oldest ad by ID
            if (scrapedAd.id === trackingInfo.oldestAdId) {
              log(`🎯 Found oldest ad by ID: ${scrapedAd.id}`);
              foundOldestAdId = true;
              foundBoundary = true;
              break;
            }

            // Second priority: Check creation time
            const adCreatedAt = new Date(scrapedAd.created_time);
            if (!foundOldestAdId && adCreatedAt <= trackingInfo.oldestAdCreatedAt) {
              log(`⏰ Reached creation time boundary: ${adCreatedAt.toLocaleString()} <= ${trackingInfo.oldestAdCreatedAt.toLocaleString()}`);
              reachedCreationTime = true;
              foundBoundary = true;
              break;
            }

            const content = JSON.parse(scrapedAd.content);
            const adStartDate = content.start_date || content.start_date_string;
            let adDate = new Date();
            
            if (adStartDate) {
              adDate = new Date(typeof adStartDate === 'number' ? adStartDate * 1000 : adStartDate);
            }

            // Third priority: Only check start date boundary if we haven't found by ID or creation time
            if (!foundOldestAdId && !reachedCreationTime && adDate < trackingInfo.oldestAdStartDate) {
              log(`📅 Reached oldest start date boundary: ${adDate.toLocaleDateString()} < ${trackingInfo.oldestAdStartDate.toLocaleDateString()}`);
              reachedOldestDate = true;
              foundBoundary = true;
              break;
            }

            // Check if this is our last known ad (for status tracking)
            if (scrapedAd.id === trackingInfo.lastKnownAdId) {
              log(`✓ Found last known ad: ${scrapedAd.id}`);
              lastKnownAdStillExists = true;
            }

            // Check if this ad already exists in database
            const existingAd = await prisma.ad.findFirst({
              where: { libraryId: scrapedAd.id }
            });

            if (!existingAd) {
              // This is a new ad
              newAds.push(scrapedAd);
              newAdsInThisPage++;
              log(`✨ Found new ad: ${scrapedAd.id} (Created: ${adCreatedAt.toLocaleString()}, Start: ${adDate.toLocaleString()})`);
            } else {
              // Update existing ad's status if needed
              try {
                const existingContent = JSON.parse(existingAd.content);
                if (content.is_active !== existingContent.is_active) {
                  log(`🔄 Status changed for ad ${scrapedAd.id}: ${existingContent.is_active} -> ${content.is_active}`);
                  await prisma.ad.update({
                    where: { id: existingAd.id },
                    data: { content: scrapedAd.content }
                  });
                }
              } catch (e) {
                log(`❌ Error updating status for ad ${scrapedAd.id}: ${e}`);
              }
            }

          } catch (error) {
            log(`❌ Error processing ad: ${error}`);
            continue;
          }
        }

        log(`📄 Page ${pageCount + 1}: ${newAdsInThisPage} new ads found`);

        // Stop if we've found any boundary or got less than requested
        if (foundOldestAdId || reachedCreationTime || reachedOldestDate || scrapedAds.length < 200) {
          foundBoundary = true;
          break;
        }

        // Continue pagination
        currentOffset += 200;
        pageCount++;
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting

      } catch (error) {
        log(`❌ Error in pagination page ${pageCount + 1}: ${error}`);
        break;
      }
    }

    log(`📊 Pagination complete: Found ${newAds.length} new ads`);
    if (foundOldestAdId) {
      log(`✅ Stopped at oldest ad ID: ${trackingInfo.oldestAdId}`);
    } else if (reachedCreationTime) {
      log(`✅ Stopped at creation time: ${trackingInfo.oldestAdCreatedAt.toLocaleString()}`);
    } else if (foundBoundary) {
      log(`✅ Stopped at start date: ${trackingInfo.oldestAdStartDate.toLocaleString()}`);
    }

    // Get all seen ad IDs from API responses
    const seenAdIds = new Set<string>();
    
    // Track IDs from pagination results
    let statusCheckOffset = 0;
    while (true) {
      const scrapedAds = await scrapeCompanyAds(pageId, 200, statusCheckOffset);
      if (scrapedAds.length === 0) break;
      
      for (const ad of scrapedAds) {
        seenAdIds.add(ad.id);
      }
      
      if (scrapedAds.length < 200) break;
      statusCheckOffset += 200;
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }

    log(`📊 Found ${seenAdIds.size} active ads from API`);

    // Get all ads from database for this page
    const dbAds = await prisma.ad.findMany({
      where: {
        brand: { pageId: pageId }
      }
    });

    let markedInactiveCount = 0;
    let markedActiveCount = 0;

    // Update status for each ad
    for (const dbAd of dbAds) {
      try {
        const content = JSON.parse(dbAd.content);
        const wasActive = content.is_active !== false;
        const isFoundInApi = seenAdIds.has(dbAd.libraryId);

        if (!isFoundInApi && wasActive) {
          // Only mark inactive if not found in API and was previously active
          content.is_active = false;
          await prisma.ad.update({
            where: { id: dbAd.id },
            data: { content: JSON.stringify(content) }
          });
          markedInactiveCount++;
          log(`❌ Marked as inactive: ${dbAd.libraryId} (not found in API)`);
        } else if (isFoundInApi && !wasActive) {
          // Mark active if found in API and was previously inactive
          content.is_active = true;
          await prisma.ad.update({
            where: { id: dbAd.id },
            data: { content: JSON.stringify(content) }
          });
          markedActiveCount++;
          log(`✅ Marked as active: ${dbAd.libraryId} (found in API)`);
        }
      } catch (error) {
        log(`❌ Error updating ad ${dbAd.libraryId} status: ${error}`);
      }
    }

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

    // Step 3: Update brand total ads count
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
    log(`   - Pages scanned: ${pageCount + 1}`);
    log(`   - Ads marked inactive: ${markedInactiveCount}`);
    log(`   - Ads marked active: ${markedActiveCount}`);
    if (foundOldestAdId) {
      log(`   - Stopped at: Oldest Ad ID ${trackingInfo.oldestAdId}`);
    } else if (reachedCreationTime) {
      log(`   - Stopped at: Creation Time ${trackingInfo.oldestAdCreatedAt.toLocaleString()}`);
    } else {
      log(`   - Stopped at: Start Date ${trackingInfo.oldestAdStartDate.toLocaleString()}`);
    }

  } catch (error) {
    log(`❌ Error tracking page ${pageId}: ${error}`);
  }
}

/**
 * Gets all page IDs that we're currently tracking
 */
async function getAllTrackedPageIds(): Promise<string[]> {
  try {
    const brands = await prisma.brand.findMany({
      select: { pageId: true },
      where: {
        pageId: { not: null }
      }
    });
    
    return brands.map(b => b.pageId).filter(Boolean) as string[];
  } catch (error) {
    log(`Error getting tracked page IDs: ${error}`);
    return [];
  }
}

/**
 * Starts the auto-tracking service
 */
export async function startAutoTracking(): Promise<boolean> {
  // Check if a tracking cycle is currently running
  if (isTrackingCycleRunning) {
    log(`⚠️ Cannot start: Tracking cycle currently in progress`);
    return false;
  }

  // Check if interval is already set
  if (trackingInterval) {
    log(`⚠️ Auto-tracking already running`);
    return false;
  }
  
  log(`🚀 Starting auto-tracking service...`);

  async function runTrackingCycle() {
    // Prevent multiple cycles from running simultaneously
    if (isTrackingCycleRunning) {
      log(`⚠️ Previous cycle still running, skipping this cycle`);
      return;
    }

    isTrackingCycleRunning = true;
    lastCycleStartTime = new Date();
    nextCycleTime = new Date(Date.now() + TRACKING_INTERVAL);
    
    log(`🔄 === AUTO-TRACKING CYCLE START ===`);
    log(`⏰ Next cycle scheduled for: ${nextCycleTime.toLocaleString()}`);

    try {
      const pageIds = await getAllTrackedPageIds();
      
      if (pageIds.length === 0) {
        log(`⚠️ No pages to track`);
        return;
      }

      log(`📋 Found ${pageIds.length} pages to track: ${pageIds.join(', ')}`);

      // Track each page
      for (const pageId of pageIds) {
        if (!isTrackingCycleRunning) {
          // Check if service was stopped mid-cycle
          log(`⚠️ Tracking cycle interrupted, stopping`);
          return;
        }

        await trackPageAds(pageId);
        // Small delay between pages to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const duration = Date.now() - lastCycleStartTime.getTime();
      log(`✅ === AUTO-TRACKING CYCLE COMPLETE === (took ${Math.round(duration/1000)}s)`);

    } catch (error) {
      log(`❌ Tracking cycle error: ${error}`);
    } finally {
      lastCycleEndTime = new Date();
      isTrackingCycleRunning = false;
    }
  }

  // Run first cycle immediately
  await runTrackingCycle();
  
  // Then set up interval if service wasn't stopped during first run
  if (!trackingInterval && isTrackingCycleRunning === false) {
    trackingInterval = setInterval(runTrackingCycle, TRACKING_INTERVAL);
    log(`✅ Auto-tracking started with ${TRACKING_INTERVAL/60000}-minute intervals`);
    return true;
  }

  return false;
}

/**
 * Stops the auto-tracking service
 */
export function stopAutoTracking(): void {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  
  // Signal any running cycle to stop
  isTrackingCycleRunning = false;
  nextCycleTime = null;
  
  log(`🛑 Auto-tracking stopped`);
}

/**
 * Gets current tracking status
 */
export function getTrackingStatus() {
  return {
    isRunning: trackingInterval !== null,
    isCycleInProgress: isTrackingCycleRunning,
    lastCycleStart: lastCycleStartTime?.toLocaleString() || null,
    lastCycleEnd: lastCycleEndTime?.toLocaleString() || null,
    nextCycleTime: nextCycleTime?.toLocaleString() || null,
    intervalMinutes: TRACKING_INTERVAL / (60 * 1000)
  };
}

/**
 * Manually triggers tracking for a specific page
 */
export async function trackSpecificPage(pageId: string): Promise<void> {
  try {
    await trackPageAds(pageId);
  } catch (error) {
    log(`Error tracking specific page ${pageId}: ${error}`);
    throw error;
  }
} 