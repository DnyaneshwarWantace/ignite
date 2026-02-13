import { getAdById } from '@/apiUtils/adScraper';
import prisma from '@prisma/index';

// Service state tracking
let trackingInterval: NodeJS.Timeout | null = null;
let isTrackingCycleRunning = false;
let lastCycleStartTime: Date | null = null;
let lastCycleEndTime: Date | null = null;
let nextCycleTime: Date | null = null;

// Configuration
const TRACKING_INTERVAL = 15 * 24 * 60 * 60 * 1000; // 15 days in milliseconds
const BATCH_SIZE = 50; // Number of ads to check per batch
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds delay between batches to avoid rate limiting

// Logging with timestamp
const log = (message: string) => console.log(`[${new Date().toISOString()}] AUTO-TRACKER: ${message}`);

/**
 * Check and update status for all ads in the database
 * Uses direct ad ID API calls to check if each ad is still active
 * This runs every 15 days to update ad statuses
 */
async function checkAllAdStatuses(): Promise<void> {
  log(`🔄 Starting status check for all ads in database`);

  try {
    // Get all ads from database
    const allAds = await prisma.ad.findMany({
      select: {
        id: true,
        libraryId: true,
        content: true,
      },
    });

    if (allAds.length === 0) {
      log(`⚠️ No ads found in database`);
      return;
    }

    log(`📊 Found ${allAds.length} ads to check`);

    let checkedCount = 0;
    let markedInactiveCount = 0;
    let markedActiveCount = 0;
    let errorCount = 0;

    // Process ads in batches to avoid overwhelming the API
    for (let i = 0; i < allAds.length; i += BATCH_SIZE) {
      const batch = allAds.slice(i, i + BATCH_SIZE);

      log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allAds.length / BATCH_SIZE)} (${batch.length} ads)`);

      // Check each ad in the batch
      for (const dbAd of batch) {
        try {
          // Use direct ad ID API to get accurate status from Facebook
          // This hits the single ad endpoint which gives us the TRUE status
          const adData = await getAdById(dbAd.libraryId);

          if (!adData) {
            // API call failed - skip this ad
            log(`⚠️ Skipping ad ${dbAd.libraryId} - API returned no data`);
            errorCount++;
            continue;
          }

          checkedCount++;

          // Get the accurate status from Facebook API response
          const apiContent = JSON.parse(adData.content);
          const accurateStatus = apiContent.is_active; // This is the TRUE status from Facebook

          // Get current database status
          let dbContent;
          try {
            dbContent = JSON.parse(dbAd.content);
          } catch (e) {
            dbContent = {};
          }
          const oldStatus = dbContent.is_active;

          // Always update with the latest data from Facebook API
          await prisma.ad.update({
            where: { id: dbAd.id },
            data: { content: adData.content }
          });

          // Log status changes to track winners (ads running longer)
          if (accurateStatus === false && oldStatus !== false) {
            markedInactiveCount++;
            log(`❌ Ad stopped: ${dbAd.libraryId} (is_active: ${oldStatus} → false)`);
          } else if (accurateStatus === true && oldStatus === false) {
            markedActiveCount++;
            log(`✅ Ad reactivated: ${dbAd.libraryId} (is_active: false → true)`);
          } else if (accurateStatus === true) {
            log(`✓ Ad still running: ${dbAd.libraryId} (winner - running longer)`);
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          errorCount++;
          log(`❌ Error checking ad ${dbAd.libraryId}: ${error}`);
          continue;
        }
      }

      // Delay between batches
      if (i + BATCH_SIZE < allAds.length) {
        log(`⏸️  Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    log(`📊 STATUS CHECK COMPLETE:`);
    log(`   - Total ads checked: ${checkedCount}`);
    log(`   - Ads marked inactive: ${markedInactiveCount}`);
    log(`   - Ads marked active: ${markedActiveCount}`);
    log(`   - Errors encountered: ${errorCount}`);

  } catch (error) {
    log(`❌ Error in status check: ${error}`);
  }
}

/**
 * Starts the auto-tracking service
 * Checks ad statuses every 15 days
 */
export async function startAutoTracking(): Promise<boolean> {
  // Check if a tracking cycle is currently running
  if (isTrackingCycleRunning) {
    log(`⚠️ Cannot start: Status check cycle currently in progress`);
    return false;
  }

  // Check if interval is already set
  if (trackingInterval) {
    log(`⚠️ Auto-tracking already running`);
    return false;
  }

  log(`🚀 Starting auto-tracking service (checks every 15 days)...`);

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
      // Check status of all ads in database using direct ad ID API
      await checkAllAdStatuses();

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
    const daysInterval = TRACKING_INTERVAL / (24 * 60 * 60 * 1000);
    log(`✅ Auto-tracking started - will check ad statuses every ${daysInterval} days`);
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
  const intervalDays = TRACKING_INTERVAL / (24 * 60 * 60 * 1000);
  return {
    isRunning: trackingInterval !== null,
    isCycleInProgress: isTrackingCycleRunning,
    lastCycleStart: lastCycleStartTime?.toLocaleString() || null,
    lastCycleEnd: lastCycleEndTime?.toLocaleString() || null,
    nextCycleTime: nextCycleTime?.toLocaleString() || null,
    intervalMinutes: TRACKING_INTERVAL / (60 * 1000),
    intervalDays: intervalDays
  };
}

/**
 * Manually triggers a status check for all ads
 */
export async function triggerManualStatusCheck(): Promise<void> {
  try {
    log(`🔄 Manual status check triggered`);
    await checkAllAdStatuses();
  } catch (error) {
    log(`Error in manual status check: ${error}`);
    throw error;
  }
}

/**
 * Triggers a status check (optionally scoped to a page in the future).
 * For now runs full check; pageId is logged for API compatibility.
 */
export async function trackSpecificPage(pageId: string): Promise<void> {
  log(`🔄 Track specific page requested: ${pageId}`);
  await checkAllAdStatuses();
} 