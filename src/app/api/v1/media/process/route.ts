import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { uploadImageFromUrl, uploadVideoFromUrl } from "@/lib/supabase-storage";

// Helper function to check if URL is accessible
async function isUrlAccessible(url: string): Promise<boolean> {
  try {
    // Skip accessibility check for Facebook URLs as they often block HEAD requests
    // but work fine for actual image uploads to Supabase Storage
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
    const { data: pendingAds, error: fetchError } = await supabase
      .from('ads')
      .select('*, brand:brands(name)')
      .or(`media_status.eq.pending,and(media_status.eq.failed,media_retry_count.lt.5)`)
      .order('media_retry_count', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(batchSize);

    if (fetchError) {
      console.error('Error fetching pending ads:', fetchError);
      return NextResponse.json({
        success: false,
        error: fetchError.message
      }, { status: 500 });
    }

    if (!pendingAds) {
      return NextResponse.json({
        success: true,
        message: 'No pending ads found',
        results: { processed: 0, success: 0, failed: 0, errors: [] }
      });
    }

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
        await supabase
          .from('ads')
          .update({ media_status: 'processing' })
          .eq('id', ad.id);

        const { imageUrls, videoUrls } = extractMediaUrls(ad);
        let localImageUrl = null;
        let localVideoUrl = null;

        // Process ALL images for carousel ads
        const localImageUrls: string[] = [];
        if (imageUrls.length > 0 && !ad.local_image_url) {
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
              
              const uploadedUrl = await uploadImageFromUrl(imageUrl, {
                folder: 'ads/images',
                filename: `ad_${ad.id}_img${i+1}_${Date.now()}.jpg`
              });

              // Store uploaded Supabase URL
              localImageUrls.push(uploadedUrl);

              // For now, use first successful upload as primary image
              if (!localImageUrl) {
                localImageUrl = uploadedUrl;
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
        if (videoUrls.length > 0 && !ad.local_video_url) {
          for (const videoUrl of videoUrls) {
            try {
              const isAccessible = await isUrlAccessible(videoUrl);
              if (!isAccessible) continue;

              console.log(`🎥 Processing video for ad ${ad.libraryId}`);
              const uploadedUrl = await uploadVideoFromUrl(videoUrl, {
                folder: 'ads/videos',
                filename: `ad_${ad.id}_${Date.now()}.mp4`
              });

              localVideoUrl = uploadedUrl;
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
          await supabase
            .from('ads')
            .update({
              media_status: 'success',
              local_image_url: localImageUrl || ad.local_image_url,
              local_video_url: localVideoUrl || ad.local_video_url,
              media_downloaded_at: new Date().toISOString(),
              media_error: null,
              content: JSON.stringify({
                ...JSON.parse(ad.content),
                originalImageUrls: localImageUrls
              })
            })
            .eq('id', ad.id);
          results.success++;
        } else {
          const newRetryCount = (ad.media_retry_count || 0) + 1;
          await supabase
            .from('ads')
            .update({
              media_status: newRetryCount >= 5 ? 'failed' : 'pending',
              media_retry_count: newRetryCount,
              media_error: 'No accessible media found'
            })
            .eq('id', ad.id);
          results.failed++;
        }

        results.processed++;

      } catch (error) {
        console.error(`Error processing ad ${ad.library_id}:`, error);
        const newRetryCount = (ad.media_retry_count || 0) + 1;

        await supabase
          .from('ads')
          .update({
            media_status: newRetryCount >= 5 ? 'failed' : 'pending',
            media_retry_count: newRetryCount,
            media_error: (error as Error).message
          })
          .eq('id', ad.id);

        results.failed++;
        results.errors.push(`Ad ${ad.library_id}: ${(error as Error).message}`);
      }

      // Small delay to prevent overwhelming Supabase Storage
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
        const { data: ad, error: adError } = await supabase
          .from('ads')
          .select('*, brand:brands(name)')
          .eq('id', adId)
          .single();

        if (!ad || adError) continue;

        // Reset status for reprocessing
        await supabase
          .from('ads')
          .update({
            media_status: 'processing',
            media_retry_count: 0,
            media_error: null
          })
          .eq('id', ad.id);

        const { imageUrls, videoUrls } = extractMediaUrls(ad);
        let localImageUrl = null;
        let localVideoUrl = null;

        // Process media (same logic as GET)
        if (imageUrls.length > 0) {
          for (const imageUrl of imageUrls) {
            try {
              const isAccessible = await isUrlAccessible(imageUrl);
              if (!isAccessible) continue;

              const uploadedUrl = await uploadImageFromUrl(imageUrl, {
                folder: 'ads/images',
                filename: `ad_${ad.id}_${Date.now()}.jpg`
              });

              localImageUrl = uploadedUrl;
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

              const uploadedUrl = await uploadVideoFromUrl(videoUrl, {
                folder: 'ads/videos',
                filename: `ad_${ad.id}_${Date.now()}.mp4`
              });

              localVideoUrl = uploadedUrl;
              break;
            } catch (error) {
              continue;
            }
          }
        }

        // Update results
        if (localImageUrl || localVideoUrl) {
          await supabase
            .from('ads')
            .update({
              media_status: 'success',
              local_image_url: localImageUrl,
              local_video_url: localVideoUrl,
              media_downloaded_at: new Date().toISOString()
            })
            .eq('id', ad.id);
          results.success++;
        } else {
          await supabase
            .from('ads')
            .update({
              media_status: 'failed',
              media_error: 'No accessible media found'
            })
            .eq('id', ad.id);
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