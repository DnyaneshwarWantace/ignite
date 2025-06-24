require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Global statistics tracking
const stats = {
  totalProcessed: 0,
  totalSuccess: 0,
  totalFailed: 0,
  totalImages: 0,
  totalVideos: 0,
  startTime: new Date(),
  lastStatusReport: new Date()
};

// Status reporting function
function printStatusReport() {
  const now = new Date();
  const uptime = Math.floor((now - stats.startTime) / 1000 / 60); // minutes
  const successRate = stats.totalProcessed > 0 ? ((stats.totalSuccess / stats.totalProcessed) * 100).toFixed(1) : '0.0';
  
  console.log('\n📊 ===== MEDIA WORKER STATUS REPORT =====');
  console.log(`⏱️  Uptime: ${uptime} minutes`);
  console.log(`📈 Total Processed: ${stats.totalProcessed} ads`);
  console.log(`✅ Successful: ${stats.totalSuccess} ads (${successRate}%)`);
  console.log(`❌ Failed: ${stats.totalFailed} ads`);
  console.log(`🖼️  Images Uploaded: ${stats.totalImages}`);
  console.log(`🎥 Videos Uploaded: ${stats.totalVideos}`);
  console.log(`📅 Last Report: ${now.toLocaleTimeString()}`);
  console.log('==========================================\n');
  
  stats.lastStatusReport = now;
}

// Get overall database statistics
async function getDatabaseStats() {
  try {
    const totalAds = await prisma.ad.count();
    const pendingAds = await prisma.ad.count({
      where: {
        OR: [
          { mediaStatus: 'pending' },
          {
            AND: [
              { mediaStatus: 'failed' },
              { mediaRetryCount: { lt: 3 } }
            ]
          }
        ]
      }
    });
    const successfulAds = await prisma.ad.count({
      where: { mediaStatus: 'success' }
    });
    const failedAds = await prisma.ad.count({
      where: { 
        AND: [
          { mediaStatus: 'failed' },
          { mediaRetryCount: { gte: 3 } }
        ]
      }
    });
    
    return { totalAds, pendingAds, successfulAds, failedAds };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return { totalAds: 0, pendingAds: 0, successfulAds: 0, failedAds: 0 };
  }
}

// Extract media URLs from ad content
function extractMediaUrls(ad) {
  const content = ad.content || ad.adSnapshot || '';
  const imageUrls = [];
  const videoUrls = [];

  // Extract image URLs
  const imageMatches = content.match(/https?:\/\/[^\s'"<>]*\.(jpg|jpeg|png|gif|webp)[^\s'"<>]*/gi) || [];
  imageUrls.push(...imageMatches);

  // Extract video URLs
  const videoMatches = content.match(/https?:\/\/[^\s'"<>]*\.(mp4|mov|avi|webm)[^\s'"<>]*/gi) || [];
  videoUrls.push(...videoMatches);

  // Facebook specific patterns
  const fbImageMatches = content.match(/https:\/\/scontent[^"'\s<>]*/gi) || [];
  const fbVideoMatches = content.match(/https:\/\/video[^"'\s<>]*/gi) || [];
  
  imageUrls.push(...fbImageMatches.filter(url => !url.includes('.mp4')));
  videoUrls.push(...fbVideoMatches);

  return {
    imageUrls: [...new Set(imageUrls)].filter(url => url && url.startsWith('https')),
    videoUrls: [...new Set(videoUrls)].filter(url => url && url.startsWith('https'))
  };
}

// Check if URL is accessible
async function isUrlAccessible(url) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Process a single ad's media
async function processAdMedia(ad) {
  console.log(`📸 Processing media for ad: ${ad.libraryId || ad.id}`);
  
  try {
    // Mark as processing
    await prisma.ad.update({
      where: { id: ad.id },
      data: { mediaStatus: 'processing' }
    });

    const { imageUrls, videoUrls } = extractMediaUrls(ad);
    let localImageUrl = null;
    let localVideoUrl = null;

    // Process images
    if (imageUrls.length > 0 && !ad.localImageUrl) {
      for (const imageUrl of imageUrls) {
        try {
          const isAccessible = await isUrlAccessible(imageUrl);
          if (!isAccessible) continue;

          console.log(`📷 Uploading image to Cloudinary...`);
          const result = await cloudinary.uploader.upload(imageUrl, {
            folder: 'ads/images',
            public_id: `ad_${ad.id}_${Date.now()}`,
            resource_type: 'image',
            timeout: 60000,
            transformation: [
              { quality: 'auto:good' },
              { fetch_format: 'auto' }
            ]
          });
          
          localImageUrl = result.secure_url;
          console.log(`✅ Image uploaded successfully`);
          break;
        } catch (error) {
          console.log(`❌ Image upload failed: ${error.message}`);
          continue;
        }
      }
    }

    // Process videos
    if (videoUrls.length > 0 && !ad.localVideoUrl) {
      for (const videoUrl of videoUrls) {
        try {
          const isAccessible = await isUrlAccessible(videoUrl);
          if (!isAccessible) continue;

          console.log(`🎥 Uploading video to Cloudinary...`);
          const result = await cloudinary.uploader.upload(videoUrl, {
            folder: 'ads/videos',
            public_id: `ad_${ad.id}_${Date.now()}`,
            resource_type: 'video',
            timeout: 180000,
            transformation: [
              { quality: 'auto:good' },
              { format: 'mp4' }
            ]
          });
          
          localVideoUrl = result.secure_url;
          console.log(`✅ Video uploaded successfully`);
          break;
        } catch (error) {
          console.log(`❌ Video upload failed: ${error.message}`);
          continue;
        }
      }
    }

    // Update ad with results
    const hasMedia = localImageUrl || localVideoUrl;
    const updateData = {
      mediaStatus: hasMedia ? 'success' : 'failed',
      mediaDownloadedAt: hasMedia ? new Date() : null,
      mediaError: hasMedia ? null : 'No accessible media found',
      mediaRetryCount: hasMedia ? 0 : (ad.mediaRetryCount || 0) + 1
    };

    if (localImageUrl) updateData.localImageUrl = localImageUrl;
    if (localVideoUrl) updateData.localVideoUrl = localVideoUrl;

    // If max retries reached, mark as permanently failed
    if (!hasMedia && updateData.mediaRetryCount >= 5) {
      updateData.mediaStatus = 'failed';
    } else if (!hasMedia) {
      updateData.mediaStatus = 'pending'; // Retry later
    }

    await prisma.ad.update({
      where: { id: ad.id },
      data: updateData
    });

    // Update global stats
    stats.totalProcessed++;
    if (hasMedia) {
      stats.totalSuccess++;
      if (localImageUrl) stats.totalImages++;
      if (localVideoUrl) stats.totalVideos++;
    } else {
      stats.totalFailed++;
    }

    return { success: hasMedia, localImageUrl, localVideoUrl };

  } catch (error) {
    console.error(`❌ Error processing ad ${ad.libraryId || ad.id}:`, error.message);
    
    const retryCount = (ad.mediaRetryCount || 0) + 1;
    await prisma.ad.update({
      where: { id: ad.id },
      data: {
        mediaStatus: retryCount >= 3 ? 'failed' : 'pending',
        mediaRetryCount: retryCount,
        mediaError: error.message
      }
    });

    return { success: false, error: error.message };
  }
}

// Process batch of pending ads
async function processPendingMedia(batchSize = 5) {
  try {
    // Get pending ads (including failed ones with retry count < 5)
    const pendingAds = await prisma.ad.findMany({
      where: {
        OR: [
          { mediaStatus: 'pending' },
          {
            AND: [
              { mediaStatus: 'failed' },
              { mediaRetryCount: { lt: 5 } }
            ]
          }
        ]
      },
      orderBy: [
        { mediaRetryCount: 'asc' },
        { createdAt: 'asc' }
      ],
      take: batchSize
    });

    if (pendingAds.length === 0) {
      console.log('✅ No pending ads to process');
      
      // Show database stats even when no processing needed
      const dbStats = await getDatabaseStats();
      console.log(`📊 Current Status: ${dbStats.totalAds} total ads, ${dbStats.successfulAds} processed, ${dbStats.failedAds} permanently failed`);
      
      return { processed: 0, success: 0, failed: 0 };
    }

    console.log(`🔄 Processing ${pendingAds.length} pending ads...`);

    const results = { processed: 0, success: 0, failed: 0 };

    for (const ad of pendingAds) {
      const result = await processAdMedia(ad);
      results.processed++;
      
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
      }

      // Small delay between ads to avoid overwhelming Cloudinary
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ Batch complete: ${results.success} success, ${results.failed} failed`);
    
    // Show enhanced status every batch
    const dbStats = await getDatabaseStats();
    console.log(`📊 Database Status: ${dbStats.pendingAds} pending, ${dbStats.successfulAds} processed, ${dbStats.failedAds} permanently failed`);
    
    return results;

  } catch (error) {
    console.error('❌ Error in processPendingMedia:', error);
    return { processed: 0, success: 0, failed: 0, error: error.message };
  }
}

// Main worker function
async function startMediaWorker() {
  console.log('🚀 Starting Media Worker...');
  console.log('📡 Checking for pending ads every 2 minutes');
  console.log('📊 Status reports every 10 minutes');
  
  // Show initial database status
  const initialStats = await getDatabaseStats();
  console.log(`📋 Initial Database Status: ${initialStats.pendingAds} pending, ${initialStats.successfulAds} processed, ${initialStats.failedAds} permanently failed`);
  
  // Process immediately on start
  await processPendingMedia(5);

  // Set up interval processing (every 2 minutes)
  const processingIntervalId = setInterval(async () => {
    await processPendingMedia(5);
  }, 2 * 60 * 1000);

  // Set up status reporting (every 10 minutes)
  const statusIntervalId = setInterval(() => {
    printStatusReport();
  }, 10 * 60 * 1000);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down media worker...');
    printStatusReport(); // Final status report
    clearInterval(processingIntervalId);
    clearInterval(statusIntervalId);
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down media worker...');
    printStatusReport(); // Final status report
    clearInterval(processingIntervalId);
    clearInterval(statusIntervalId);
    await prisma.$disconnect();
    process.exit(0);
  });

  // Keep the process alive
  console.log('✅ Media Worker is running! Press Ctrl+C to stop.');
}

// Start the worker if this script is run directly
if (require.main === module) {
  startMediaWorker().catch(console.error);
}

module.exports = { startMediaWorker, processPendingMedia, processAdMedia };