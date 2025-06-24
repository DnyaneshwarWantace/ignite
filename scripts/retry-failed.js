const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dwzdr8ei9',
  api_key: '741397439758848',
  api_secret: 'kOPze_jNVA8xgTAA5GsjSTMLLig',
});

// Helper function to check if URL is accessible with better error handling
async function isUrlAccessible(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(url, { 
      method: 'HEAD', 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log(`   URL check failed: ${error.message}`);
    return false;
  }
}

// Enhanced media URL extraction with better parsing
function extractAllMediaUrls(ad) {
  const imageUrls = [];
  const videoUrls = [];
  
  try {
    // Add direct URLs from ad fields
    if (ad.imageUrl && ad.imageUrl.startsWith('http')) {
      imageUrls.push(ad.imageUrl);
    }
    if (ad.videoUrl && ad.videoUrl.startsWith('http')) {
      videoUrls.push(ad.videoUrl);
    }
    
    // Parse content for additional URLs
    if (ad.content) {
      const content = JSON.parse(ad.content);
      const snapshot = content.snapshot || {};
      
      // Facebook API structure - check images array
      if (snapshot.images && snapshot.images.length > 0) {
        snapshot.images.forEach(img => {
          // Try all possible image URL fields
          const urls = [
            img.original_image_url,
            img.resized_image_url,
            img.watermarked_resized_image_url,
            img.url,
            img.src
          ].filter(url => url && url.startsWith('http'));
          
          imageUrls.push(...urls);
        });
      }
      
      // Check videos array
      if (snapshot.videos && snapshot.videos.length > 0) {
        snapshot.videos.forEach(vid => {
          const urls = [
            vid.video_hd_url,
            vid.video_sd_url,
            vid.url,
            vid.src
          ].filter(url => url && url.startsWith('http'));
          
          videoUrls.push(...urls);
        });
      }
      
      // Check cards for carousel ads
      if (snapshot.cards && snapshot.cards.length > 0) {
        snapshot.cards.forEach(card => {
          // Images from cards
          const cardImageUrls = [
            card.resized_image_url,
            card.original_image_url,
            card.url,
            card.src
          ].filter(url => url && url.startsWith('http'));
          
          // Videos from cards
          const cardVideoUrls = [
            card.video_hd_url,
            card.video_sd_url,
            card.url,
            card.src
          ].filter(url => url && url.startsWith('http') && (url.includes('video') || url.includes('.mp4')));
          
          imageUrls.push(...cardImageUrls);
          videoUrls.push(...cardVideoUrls);
        });
      }
      
      // Check for creative object
      if (snapshot.creative && snapshot.creative.object_story_spec) {
        const creative = snapshot.creative.object_story_spec;
        if (creative.photo_data && creative.photo_data.url) {
          imageUrls.push(creative.photo_data.url);
        }
        if (creative.video_data && creative.video_data.video_id) {
          // Note: video_id would need special handling to get actual URL
        }
      }
    }
  } catch (error) {
    console.log(`Error parsing content for ad ${ad.id}: ${error.message}`);
  }
  
  return {
    imageUrls: [...new Set(imageUrls)], // Remove duplicates
    videoUrls: [...new Set(videoUrls)] // Remove duplicates
  };
}

// Retry failed uploads with improved logic
async function retryFailedUploads() {
  console.log('🔄 Starting retry process for failed uploads...');
  
  try {
    // Get failed ads
    const failedAds = await prisma.ad.findMany({
      where: {
        mediaStatus: 'failed',
        mediaRetryCount: { lt: 5 } // Only retry up to 5 times
      },
      include: {
        brand: { select: { name: true } }
      },
      orderBy: [
        { mediaRetryCount: 'asc' }, // Process lower retry counts first
        { updatedAt: 'asc' } // Retry oldest failures first
      ]
    });
    
    console.log(`📥 Found ${failedAds.length} failed ads to retry`);
    
    if (failedAds.length === 0) {
      console.log('✅ No failed ads to retry!');
      return;
    }
    
    let retryCount = 0;
    let successCount = 0;
    
    for (const ad of failedAds) {
      console.log(`\n🔄 Retrying: ${ad.brand?.name || 'Unknown'} - ${ad.type} (Attempt ${ad.mediaRetryCount + 1})`);
      
      try {
        // Mark as processing
        await prisma.ad.update({
          where: { id: ad.id },
          data: { mediaStatus: 'processing' }
        });
        
        const { imageUrls, videoUrls } = extractAllMediaUrls(ad);
        console.log(`   Found ${imageUrls.length} image URLs, ${videoUrls.length} video URLs`);
        
        let localImageUrl = ad.localImageUrl;
        let localVideoUrl = ad.localVideoUrl;
        let hasNewMedia = false;
        
        // Process images if we don't have a local image yet
        if (imageUrls.length > 0 && !localImageUrl) {
          for (const imageUrl of imageUrls) {
            try {
              console.log(`   📸 Testing image: ${imageUrl.substring(0, 60)}...`);
              
              const isAccessible = await isUrlAccessible(imageUrl);
              if (!isAccessible) {
                console.log(`   ❌ Image not accessible`);
                continue;
              }
              
              console.log(`   ☁️  Uploading to Cloudinary...`);
              const result = await cloudinary.uploader.upload(imageUrl, {
                folder: 'ads/images',
                public_id: `ad_${ad.id}_retry_${Date.now()}`,
                resource_type: 'image',
                timeout: 60000,
                transformation: [
                  { quality: 'auto:good' },
                  { fetch_format: 'auto' }
                ]
              });
              
              localImageUrl = result.secure_url;
              hasNewMedia = true;
              console.log(`   ✅ Image uploaded: ${localImageUrl}`);
              break; // Success, stop trying other images
            } catch (error) {
              console.log(`   ❌ Image upload failed: ${error.message}`);
              continue;
            }
          }
        }
        
        // Process videos if we don't have a local video yet
        if (videoUrls.length > 0 && !localVideoUrl) {
          for (const videoUrl of videoUrls) {
            try {
              console.log(`   🎥 Testing video: ${videoUrl.substring(0, 60)}...`);
              
              const isAccessible = await isUrlAccessible(videoUrl);
              if (!isAccessible) {
                console.log(`   ❌ Video not accessible`);
                continue;
              }
              
              console.log(`   ☁️  Uploading video to Cloudinary...`);
              const result = await cloudinary.uploader.upload(videoUrl, {
                folder: 'ads/videos',
                public_id: `ad_${ad.id}_retry_${Date.now()}`,
                resource_type: 'video',
                timeout: 180000, // 3 minutes for videos
                transformation: [
                  { quality: 'auto:good' },
                  { format: 'mp4' }
                ]
              });
              
              localVideoUrl = result.secure_url;
              hasNewMedia = true;
              console.log(`   ✅ Video uploaded: ${localVideoUrl}`);
              break; // Success, stop trying other videos
            } catch (error) {
              console.log(`   ❌ Video upload failed: ${error.message}`);
              continue;
            }
          }
        }
        
        // Update ad with results
        const hasAnyMedia = localImageUrl || localVideoUrl;
        const finalStatus = hasAnyMedia ? 'success' : 'failed';
        const newRetryCount = finalStatus === 'failed' ? ad.mediaRetryCount + 1 : ad.mediaRetryCount;
        
        await prisma.ad.update({
          where: { id: ad.id },
          data: {
            localImageUrl,
            localVideoUrl,
            mediaStatus: finalStatus,
            mediaDownloadedAt: finalStatus === 'success' ? new Date() : ad.mediaDownloadedAt,
            mediaError: finalStatus === 'failed' ? 'No accessible media URLs found after retry' : null,
            mediaRetryCount: newRetryCount
          }
        });
        
        retryCount++;
        if (finalStatus === 'success') {
          successCount++;
        }
        
        console.log(`   ✅ Retry result: ${finalStatus.toUpperCase()}`);
        
        // Small delay between retries
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`   ❌ Retry failed: ${error.message}`);
        
        await prisma.ad.update({
          where: { id: ad.id },
          data: {
            mediaStatus: 'failed',
            mediaError: error.message,
            mediaRetryCount: ad.mediaRetryCount + 1
          }
        });
      }
    }
    
    console.log(`\n🎉 Retry process complete!`);
    console.log(`📊 Results: ${successCount}/${retryCount} successful retries`);
    
    // Final status check
    const finalStatus = await prisma.ad.groupBy({
      by: ['mediaStatus'],
      _count: { mediaStatus: true }
    });
    
    console.log('\n📈 Updated Status Breakdown:');
    finalStatus.forEach(status => {
      console.log(`   ${status.mediaStatus}: ${status._count.mediaStatus} ads`);
    });
    
  } catch (error) {
    console.error('❌ Retry process failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

retryFailedUploads(); 