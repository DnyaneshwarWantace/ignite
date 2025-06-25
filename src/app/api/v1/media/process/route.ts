import { NextRequest, NextResponse } from "next/server";
import prisma from "@prisma/index";
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to check if URL is accessible
async function isUrlAccessible(url: string): Promise<boolean> {
  try {
    // Skip accessibility check for Facebook URLs as they often block HEAD requests
    // but work fine for actual image uploads to Cloudinary
    if (url.includes('fbcdn.net') || url.includes('scontent') || url.includes('facebook.com')) {
      console.log(`ℹ️ Skipping HEAD check for Facebook URL (will attempt upload directly)`);
      return true;
    }
    
    const response = await fetch(url, { 
      method: 'HEAD', 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    return response.ok;
  } catch {
    // For Facebook URLs, assume they're accessible even if HEAD fails
    if (url.includes('fbcdn.net') || url.includes('scontent') || url.includes('facebook.com')) {
      console.log(`ℹ️ HEAD request failed but continuing with Facebook URL`);
      return true;
    }
    return false;
  }
}

// Extract media URLs from ad content
function extractMediaUrls(ad: any): { imageUrls: string[], videoUrls: string[] } {
  const imageUrls: string[] = [];
  const videoUrls: string[] = [];

  // Add direct URLs
  if (ad.imageUrl && ad.imageUrl.trim() !== '') {
    imageUrls.push(ad.imageUrl);
  }
  if (ad.videoUrl && ad.videoUrl.trim() !== '') {
    videoUrls.push(ad.videoUrl);
  }

  // Parse content for additional URLs
  try {
    const content = JSON.parse(ad.content);
    const snapshot = content.snapshot || {};
    
    // Extract from images array (prefer resized for faster uploads)
    if (snapshot.images && Array.isArray(snapshot.images)) {
      snapshot.images.forEach((img: any) => {
        if (img.resized_image_url) imageUrls.push(img.resized_image_url);
        else if (img.original_image_url) imageUrls.push(img.original_image_url);
      });
    }
    
    // Extract from cards array (prefer resized for faster uploads)
    if (snapshot.cards && Array.isArray(snapshot.cards)) {
      snapshot.cards.forEach((card: any) => {
        if (card.resized_image_url) imageUrls.push(card.resized_image_url);
        else if (card.original_image_url) imageUrls.push(card.original_image_url);
      });
    }

    // Search for video URLs
    if (snapshot.videos && snapshot.videos.length > 0) {
      snapshot.videos.forEach((video: any) => {
        if (video.video_hd_url) videoUrls.push(video.video_hd_url);
        else if (video.video_sd_url) videoUrls.push(video.video_sd_url);
      });
    }
  } catch (error) {
    console.log(`Could not parse content for ad ${ad.libraryId}:`, error);
  }

  // Remove duplicates
  return {
    imageUrls: Array.from(new Set(imageUrls)),
    videoUrls: Array.from(new Set(videoUrls))
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const batchSize = parseInt(url.searchParams.get('batch') || '10');
    
    console.log('🔄 Starting media processing...');
    
    // Get pending ads
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
      include: {
        brand: { select: { name: true } }
      },
      take: batchSize,
      orderBy: [
        { mediaRetryCount: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    console.log(`Found ${pendingAds.length} ads to process`);

    const results = {
      processed: 0,
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const ad of pendingAds) {
      try {
        // Update status to processing
        await prisma.ad.update({
          where: { id: ad.id },
          data: { mediaStatus: 'processing' }
        });

        const { imageUrls, videoUrls } = extractMediaUrls(ad);
        let localImageUrl = null;
        let localVideoUrl = null;

        // Process ALL images for carousel ads
        const localImageUrls: string[] = [];
        if (imageUrls.length > 0 && !ad.localImageUrl) {
          for (let i = 0; i < imageUrls.length; i++) {
            const imageUrl = imageUrls[i];
            try {
              const isAccessible = await isUrlAccessible(imageUrl);
              if (!isAccessible) {
                console.log(`❌ Image ${i+1}/${imageUrls.length} not accessible: ${imageUrl.substring(0, 60)}...`);
                continue;
              }

              console.log(`📷 Processing image ${i+1}/${imageUrls.length} for ad ${ad.libraryId}`);
              
              // Add delay to check URL format
              if (!imageUrl.startsWith('https://')) {
                console.log(`⚠️ Invalid URL format: ${imageUrl}`);
                continue;
              }
              
              const result = await cloudinary.uploader.upload(imageUrl, {
                folder: 'ads/images',
                public_id: `ad_${ad.id}_img${i+1}_${Date.now()}`,
                resource_type: 'image',
                timeout: 60000 // Keep reasonable timeout
              });
              
              // Store both original and Cloudinary URLs
              localImageUrls.push(imageUrl);
              
              // For now, use first successful upload as primary image
              if (!localImageUrl) {
                localImageUrl = imageUrl;
              }
              
            } catch (imageError) {
              console.error(`❌ Image ${i+1}/${imageUrls.length} upload failed:`, imageError);
              // Continue with next image instead of breaking
              continue;
            }
            
            // Small delay between image uploads
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          console.log(`📊 Successfully processed ${localImageUrls.length}/${imageUrls.length} images for ad ${ad.libraryId}`);
        }

        // Process videos  
        if (videoUrls.length > 0 && !ad.localVideoUrl) {
          for (const videoUrl of videoUrls) {
            try {
              const isAccessible = await isUrlAccessible(videoUrl);
              if (!isAccessible) continue;

              console.log(`🎥 Processing video for ad ${ad.libraryId}`);
              const result = await cloudinary.uploader.upload(videoUrl, {
                folder: 'ads/videos',
                public_id: `ad_${ad.id}_${Date.now()}`,
                resource_type: 'video',
                timeout: 60000,
                // FIXED: Control video transformations
                transformation: [{
                  quality: 'auto:good',
                  format: 'mp4'
                }],
                eager: false // Don't create eager transformations
              });
              
              localVideoUrl = result.secure_url;
              console.log(`✅ Video uploaded: ${localVideoUrl}`);
              break;
            } catch (videoError) {
              console.error(`Video upload failed:`, videoError);
              continue;
            }
          }
        }

        // Update ad with results
        if (localImageUrl || localVideoUrl) {
          await prisma.ad.update({
            where: { id: ad.id },
            data: {
              mediaStatus: 'success',
              localImageUrl: localImageUrl || ad.localImageUrl,
              localVideoUrl: localVideoUrl || ad.localVideoUrl,
              mediaDownloadedAt: new Date(),
              mediaError: null,
              content: JSON.stringify({
                ...JSON.parse(ad.content),
                originalImageUrls: localImageUrls
              })
            }
          });
          results.success++;
        } else {
          const newRetryCount = (ad.mediaRetryCount || 0) + 1;
          await prisma.ad.update({
            where: { id: ad.id },
            data: {
              mediaStatus: newRetryCount >= 5 ? 'failed' : 'pending',
              mediaRetryCount: newRetryCount,
              mediaError: 'No accessible media found'
            }
          });
          results.failed++;
        }

        results.processed++;

      } catch (error) {
        console.error(`Error processing ad ${ad.libraryId}:`, error);
        const newRetryCount = (ad.mediaRetryCount || 0) + 1;
        
        await prisma.ad.update({
          where: { id: ad.id },
          data: {
            mediaStatus: newRetryCount >= 5 ? 'failed' : 'pending',
            mediaRetryCount: newRetryCount,
            mediaError: (error as Error).message
          }
        });
        
        results.failed++;
        results.errors.push(`Ad ${ad.libraryId}: ${(error as Error).message}`);
      }

      // Small delay to prevent overwhelming Cloudinary
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} ads`,
      results
    });

  } catch (error) {
    console.error("Media processing error:", error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Trigger processing for specific ads
  try {
    const { adIds } = await request.json();
    
    if (!adIds || !Array.isArray(adIds)) {
      return NextResponse.json({
        success: false,
        error: "adIds array is required"
      }, { status: 400 });
    }

    const results = {
      processed: 0,
      success: 0,
      failed: 0
    };

    for (const adId of adIds) {
      try {
        const ad = await prisma.ad.findUnique({
          where: { id: adId },
          include: { brand: { select: { name: true } } }
        });

        if (!ad) continue;

        // Reset status for reprocessing
        await prisma.ad.update({
          where: { id: ad.id },
          data: { 
            mediaStatus: 'processing',
            mediaRetryCount: 0,
            mediaError: null
          }
        });

        const { imageUrls, videoUrls } = extractMediaUrls(ad);
        let localImageUrl = null;
        let localVideoUrl = null;

        // Process media (same logic as GET)
        if (imageUrls.length > 0) {
          for (const imageUrl of imageUrls) {
            try {
              const isAccessible = await isUrlAccessible(imageUrl);
              if (!isAccessible) continue;

              const result = await cloudinary.uploader.upload(imageUrl, {
                folder: 'ads/images',
                public_id: `ad_${ad.id}_${Date.now()}`,
                resource_type: 'image',
                timeout: 30000,
                transformation: [{
                  quality: 'auto:good',
                  fetch_format: 'auto'
                }],
                responsive_breakpoints: false,
                eager: false
              } as any);
              
              localImageUrl = result.secure_url;
              break;
            } catch (error) {
              continue;
            }
          }
        }

        if (videoUrls.length > 0) {
          for (const videoUrl of videoUrls) {
            try {
              const isAccessible = await isUrlAccessible(videoUrl);
              if (!isAccessible) continue;

              const result = await cloudinary.uploader.upload(videoUrl, {
                folder: 'ads/videos',
                public_id: `ad_${ad.id}_${Date.now()}`,
                resource_type: 'video',
                timeout: 60000,
                transformation: [{
                  quality: 'auto:good',
                  format: 'mp4'
                }],
                eager: false
              });
              
              localVideoUrl = result.secure_url;
              break;
            } catch (error) {
              continue;
            }
          }
        }

        // Update results
        if (localImageUrl || localVideoUrl) {
          await prisma.ad.update({
            where: { id: ad.id },
            data: {
              mediaStatus: 'success',
              localImageUrl,
              localVideoUrl,
              mediaDownloadedAt: new Date()
            }
          });
          results.success++;
        } else {
          await prisma.ad.update({
            where: { id: ad.id },
            data: {
              mediaStatus: 'failed',
              mediaError: 'No accessible media found'
            }
          });
          results.failed++;
        }

        results.processed++;

      } catch (error) {
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Manually processed ${results.processed} ads`,
      results
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
} 