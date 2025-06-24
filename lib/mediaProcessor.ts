import { PrismaClient } from '@prisma/client';
import { 
  uploadImageToCloudinary, 
  uploadVideoToCloudinary, 
  extractMediaUrls, 
  isUrlAccessible 
} from './cloudinary';

const prisma = new PrismaClient();

export interface MediaProcessingResult {
  success: boolean;
  localImageUrl?: string;
  localVideoUrl?: string;
  error?: string;
}

export async function processAdMedia(adId: string): Promise<MediaProcessingResult> {
  console.log(`Processing media for ad: ${adId}`);
  
  try {
    // Mark as processing
    await prisma.ad.update({
      where: { id: adId },
      data: { mediaStatus: 'processing' }
    });

    // Get ad data
    const ad = await prisma.ad.findUnique({
      where: { id: adId }
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    // Extract media URLs from content
    const { imageUrls, videoUrls } = extractMediaUrls(ad.content);
    
    let localImageUrl: string | undefined;
    let localVideoUrl: string | undefined;

    // Process the best image URL
    if (imageUrls.length > 0) {
      for (const imageUrl of imageUrls) {
        try {
          // Check if URL is accessible
          const isAccessible = await isUrlAccessible(imageUrl);
          if (!isAccessible) {
            console.log(`Image URL not accessible: ${imageUrl}`);
            continue;
          }

          console.log(`Uploading image for ad ${adId}: ${imageUrl}`);
          const uploadResult = await uploadImageToCloudinary(imageUrl, adId);
          localImageUrl = uploadResult.secure_url;
          console.log(`Image uploaded successfully: ${localImageUrl}`);
          break; // Success, use this image
        } catch (error) {
          console.error(`Failed to upload image ${imageUrl}:`, error);
          continue; // Try next image
        }
      }
    }

    // Process the best video URL
    if (videoUrls.length > 0) {
      for (const videoUrl of videoUrls) {
        try {
          // Check if URL is accessible
          const isAccessible = await isUrlAccessible(videoUrl);
          if (!isAccessible) {
            console.log(`Video URL not accessible: ${videoUrl}`);
            continue;
          }

          console.log(`Uploading video for ad ${adId}: ${videoUrl}`);
          const uploadResult = await uploadVideoToCloudinary(videoUrl, adId);
          localVideoUrl = uploadResult.secure_url;
          console.log(`Video uploaded successfully: ${localVideoUrl}`);
          break; // Success, use this video
        } catch (error) {
          console.error(`Failed to upload video ${videoUrl}:`, error);
          continue; // Try next video
        }
      }
    }

    // Update ad with results
    const updateData: any = {
      mediaStatus: 'success',
      mediaDownloadedAt: new Date(),
      mediaError: null,
      mediaRetryCount: 0
    };

    if (localImageUrl) {
      updateData.localImageUrl = localImageUrl;
    }

    if (localVideoUrl) {
      updateData.localVideoUrl = localVideoUrl;
    }

    await prisma.ad.update({
      where: { id: adId },
      data: updateData
    });

    return {
      success: true,
      localImageUrl,
      localVideoUrl
    };

  } catch (error) {
    console.error(`Media processing failed for ad ${adId}:`, error);
    
    // Update ad with failure status
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      select: { mediaRetryCount: true }
    });

    const retryCount = (ad?.mediaRetryCount || 0) + 1;
    const maxRetries = 3;

    await prisma.ad.update({
      where: { id: adId },
      data: {
        mediaStatus: retryCount >= maxRetries ? 'failed' : 'pending',
        mediaError: error instanceof Error ? error.message : 'Unknown error',
        mediaRetryCount: retryCount
      }
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function processPendingMedia(batchSize: number = 10): Promise<void> {
  console.log(`Processing batch of ${batchSize} pending media items...`);
  
  try {
    // Get pending ads (including failed ones with retry count < 3)
    const pendingAds = await prisma.ad.findMany({
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
      },
      orderBy: {
        createdAt: 'asc' // Process oldest first
      },
      take: batchSize
    });

    console.log(`Found ${pendingAds.length} ads to process`);

    // Process each ad
    for (const ad of pendingAds) {
      try {
        await processAdMedia(ad.id);
        
        // Small delay between processing to avoid overwhelming Cloudinary
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to process ad ${ad.id}:`, error);
        continue;
      }
    }

    console.log(`Completed processing batch of ${pendingAds.length} ads`);
  } catch (error) {
    console.error('Error in processPendingMedia:', error);
  }
}

// Background worker function
export async function startMediaProcessor(intervalMinutes: number = 2): Promise<void> {
  console.log(`Starting media processor with ${intervalMinutes} minute intervals`);
  
  const processInterval = setInterval(async () => {
    try {
      await processPendingMedia(10); // Process 10 ads at a time
    } catch (error) {
      console.error('Error in media processor interval:', error);
    }
  }, intervalMinutes * 60 * 1000);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down media processor...');
    clearInterval(processInterval);
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Shutting down media processor...');
    clearInterval(processInterval);
    process.exit(0);
  });
}

// API endpoint helper to manually trigger processing
export async function manuallyProcessAd(adId: string): Promise<MediaProcessingResult> {
  return await processAdMedia(adId);
}

export default {
  processAdMedia,
  processPendingMedia,
  startMediaProcessor,
  manuallyProcessAd
}; 