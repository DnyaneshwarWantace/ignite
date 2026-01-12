import messages from "@apiUtils/messages";
import { createError, createResponse } from "@apiUtils/responseutils";
import { authMiddleware } from "@middleware";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import validation from "./validation";
import { scrapeCompanyAds, extractPageIdFromInput } from "@apiUtils/adScraper";
import { startAutoTracking } from "../../../../../../../lib/auto-tracker";

// Type definition for User (matching Supabase schema)
interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export const dynamic = "force-dynamic";

// Helper function to extract brand name from scraped ads
function extractBrandNameFromAds(scrapedAds: any[]): string | null {
  for (const ad of scrapedAds) {
    try {
      const content = JSON.parse(ad.content);
      
      // Try ScrapeCreators API format first
      if (content.page_name) return content.page_name;
      if (content.snapshot?.page_name) return content.snapshot.page_name;
      if (content.snapshot?.current_page_name) return content.snapshot.current_page_name;
      
      // Try other possible fields for brand/page name
      if (content.advertiser_name) return content.advertiser_name;
      if (content.brand_name) return content.brand_name;
      if (content.page?.name) return content.page.name;
      if (content.advertiser?.name) return content.advertiser.name;
    } catch (e) {
      // Continue to next ad if JSON parsing fails
      continue;
    }
  }
  return null;
}

// Media processing is now handled by the dedicated /api/v1/media/process endpoint
// which uses Supabase Storage instead of Cloudinary

export const POST = authMiddleware(
  async (request: NextRequest, response: NextResponse, user: User) => {
    let requestBody;
    let value;
    
    try {
      requestBody = await request.json();
      console.log("Request body received:", requestBody);
      console.log("Request body type:", typeof requestBody);
      console.log("Request body keys:", Object.keys(requestBody || {}));
      
      const { error, value: validatedValue } = validation.post.validate(requestBody);
    if (error) {
        console.log("Validation error details:", error.details);
        console.log("Validation error message:", error.message);
      return createError({
        message: messages.VALIDATION_ERROR,
        payload: error.details,
        });
      }
      value = validatedValue;
      console.log("Validated value:", value);
    } catch (parseError) {
      console.log("JSON parse error:", parseError);
      return createError({
        message: "Invalid JSON in request body",
        payload: { error: (parseError as Error).message },
      });
    }

    let { folderId, brandUrl, offset = 0 } = value;
    let targetFolder = null;

    // Handle default folder when folder id is 0
    if (folderId === "0") {
      // First, try to find an existing "Default" folder for this user
      const { data: existingFolder, error: findError } = await supabase
        .from('folders')
        .select('*')
        .eq('name', 'Default')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (existingFolder && !findError) {
        targetFolder = existingFolder;
        console.log("Using existing Default folder:", targetFolder.id);
      } else {
        // If no default folder exists, create one
        const { data: newFolder, error: folderCreateError } = await supabase
          .from('folders')
          .insert({
            name: "Default",
            user_id: user.id,
          })
          .select()
          .single();

        if (folderCreateError) {
          return createError({
            message: "Failed to create default folder",
            payload: folderCreateError.message,
          });
        }
        targetFolder = newFolder;
        console.log("Created new Default folder for user:", user.id);
      }
    }

    // Fetch folder
    if (folderId !== "0") {
      const { data: folder, error: folderError } = await supabase
        .from('folders')
        .select('*')
        .eq('id', folderId)
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (folderError || !folder) {
        return createError({
          message: messages.FOLDER_NOT_FOUND,
        });
      }
      targetFolder = folder;
    }

    // Extract pageId from input (URL or direct page ID)
    const extractedPageId = extractPageIdFromInput(brandUrl);

    if (!extractedPageId) {
      return createError({
        message: "Could not extract page ID from the input. Please provide a valid Facebook Ad Library URL or page ID.",
      });
    }

    // Ensure we have a valid folder
    if (!targetFolder) {
      return createError({
        message: "Failed to find or create target folder",
      });
    }

    try {
      // Get existing ads count for this brand for informational purposes
      let existingAdsCount = 0;
      const { data: existingBrand, error: brandFetchError } = await supabase
        .from('brands')
        .select('*, ads(library_id)')
        .eq('page_id', extractedPageId)
        .limit(1)
        .single();

      if (existingBrand && !brandFetchError) {
        existingAdsCount = existingBrand.ads?.length || 0;
        console.log(`Found existing brand with ${existingAdsCount} ads`);
      }
      
      // Scrape ads from the page with provided offset
      // If offset is 0, start from beginning; otherwise start from offset
      const effectiveOffset = offset || existingAdsCount;
      console.log(`Using offset: ${effectiveOffset} (provided: ${offset}, existing: ${existingAdsCount})`);
      
      let scrapedAds = await scrapeCompanyAds(extractedPageId, 200, effectiveOffset);
      
      if (scrapedAds.length === 0) {
        // For testing purposes, create a mock ad if no ads are found
        console.log("No ads found from API, creating mock ad for testing");
        const mockAd = {
          id: `mock_ad_${extractedPageId}_${Date.now()}`,
          type: 'image' as const,
          content: JSON.stringify({
            pageId: extractedPageId,
            mock: true,
            created: new Date().toISOString()
          }),
          imageUrl: '',
          videoUrl: undefined,
          text: 'This is a mock ad created for testing purposes',
          headline: 'Test Ad',
          description: 'Mock ad description',
          created_time: new Date().toISOString()
        };
        
        // Use mock ad for testing
        scrapedAds = [mockAd];
        console.log("Using mock ad for testing:", mockAd);
      }

      // Create or find brand
      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .select('*')
        .eq('page_id', extractedPageId)
        .limit(1)
        .single();

      let finalBrand = brand;

      if (brandError || !brand) {
        // Extract brand name from first ad or use page ID as fallback
        const brandName = extractBrandNameFromAds(scrapedAds) || `Brand ${extractedPageId}`;

        // Create new brand with basic info
        const { data: newBrand, error: createBrandError } = await supabase
          .from('brands')
          .insert({
            name: brandName,
            logo: scrapedAds[0]?.imageUrl || "",
            total_ads: scrapedAds.length,
            page_id: extractedPageId,
          })
          .select()
          .single();

        if (createBrandError) {
          throw new Error(`Failed to create brand: ${createBrandError.message}`);
        }
        finalBrand = newBrand;

        // Connect brand to folder using brand_folders table
        const { error: folderBrandError } = await supabase
          .from('brand_folders')
          .insert({
            brand_id: newBrand.id,
            folder_id: targetFolder.id
          });

        if (folderBrandError && !folderBrandError.message.includes('duplicate')) {
          console.error('Error connecting brand to folder:', folderBrandError);
        }
      } else {
        // Update total ads count with actual count
        const { count: currentAdCount, error: countError } = await supabase
          .from('ads')
          .select('*', { count: 'exact', head: true })
          .eq('brand_id', brand.id);

        // Update brand total ads
        const { error: updateError } = await supabase
          .from('brands')
          .update({
            total_ads: (currentAdCount || 0) + scrapedAds.length,
          })
          .eq('id', brand.id);

        if (updateError) {
          console.error('Error updating brand:', updateError);
        }

        // Connect to folder if not already connected
        const { data: existingConnection, error: checkError } = await supabase
          .from('brand_folders')
          .select('*')
          .eq('brand_id', brand.id)
          .eq('folder_id', targetFolder.id)
          .single();

        if (!existingConnection || checkError) {
          const { error: folderBrandError } = await supabase
            .from('brand_folders')
            .insert({
              brand_id: brand.id,
              folder_id: targetFolder.id
            });

          if (folderBrandError && !folderBrandError.message.includes('duplicate')) {
            console.error('Error connecting brand to folder:', folderBrandError);
          }
        }
      }

      // Save scraped ads to database with improved duplicate checking
      const savedAds = [];
      const newAdIds = scrapedAds.map(ad => ad.id);

      // GLOBAL duplicate check - check across ALL brands, not just current brand
      const { data: existingAds, error: existingAdsError } = await supabase
        .from('ads')
        .select('library_id, brand_id, media_status, local_image_url, local_video_url')
        .in('library_id', newAdIds);

      const existingAdMap = new Map();
      if (existingAds && !existingAdsError) {
        existingAds.forEach(ad => {
          existingAdMap.set(ad.library_id, ad);
        });
      }

      console.log(`Found ${existingAds?.length || 0} existing ads globally out of ${newAdIds.length} scraped ads`);
      
      for (const scrapedAd of scrapedAds) {
        try {
          const existingAd = existingAdMap.get(scrapedAd.id);

          if (!existingAd) {
            // New ad - create with pending media status
            // Try insert first, handle race condition if duplicate
            const { data: savedAd, error: createAdError } = await supabase
              .from('ads')
              .insert({
                library_id: scrapedAd.id,
                type: scrapedAd.type,
                content: scrapedAd.content,
                image_url: scrapedAd.imageUrl,
                video_url: scrapedAd.videoUrl,
                text: scrapedAd.text,
                headline: scrapedAd.headline,
                description: scrapedAd.description,
                brand_id: finalBrand.id,
                media_status: 'pending', // Set pending for media processing
                media_retry_count: 0,
                created_at: scrapedAd.created_time ? new Date(scrapedAd.created_time).toISOString() : new Date().toISOString()
              })
              .select()
              .single();

            if (!createAdError && savedAd) {
              savedAds.push(savedAd);
              console.log(`✅ New ad added: ${scrapedAd.id} - mediaStatus: pending`);
            } else if (createAdError?.code === '23505') {
              // Duplicate key - ad was created between our check and insert (race condition)
              // This is fine, just skip it
              console.log(`⚠️ Ad ${scrapedAd.id} already exists (race condition), skipping`);
            } else {
              console.error(`Error creating ad ${scrapedAd.id}:`, createAdError);
            }
          } else {
            // Ad already exists - skip it (library_id is unique, can't have same ad under multiple brands)
            // If it's under a different brand, we can't duplicate it due to unique constraint
            console.log(`⏭️ Ad ${scrapedAd.id} already exists under brand ${existingAd.brand_id}, skipping`);
          }
        } catch (e) {
          console.error(`Error processing ad ${scrapedAd.id}:`, e);
        }
      }

    // Log that ads were added (background worker will pick them up automatically)
    if (savedAds.length > 0) {
      console.log(`✅ Added ${savedAds.length} new ads with mediaStatus='pending' - background worker will process them automatically`);
        
        // Trigger media processing for the new ads
        try {
          const mediaProcessorUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/v1/media/process?batch=${Math.min(savedAds.length, 10)}`;
          // Trigger processing asynchronously (don't wait for it)
          fetch(mediaProcessorUrl).catch(err => {
            console.log('Media processor trigger failed (will be picked up by background worker):', err.message);
          });
          console.log(`🔄 Triggered media processing for new ads`);
        } catch (mediaError) {
          console.error('Error triggering media processing:', mediaError);
          // Don't fail the request if media processing trigger fails
        }
        
        // Check if auto-tracking is already running before starting it
        try {
          const { getTrackingStatus } = require('@/lib/auto-tracker');
          const status = getTrackingStatus();
          
          if (!status.isRunning) {
            console.log(`ℹ️ Auto-tracking not running, will be started by server initialization`);
          } else {
            console.log(`ℹ️ Auto-tracking already running with ${status.intervalMinutes} minute intervals`);
          }
        } catch (autoTrackError) {
          console.error('Error checking auto-tracking status:', autoTrackError);
          // Don't fail the request if auto-tracking check fails
        }
      }

    return createResponse({
      message: messages.SUCCESS,
      payload: {
        folder: targetFolder,
        brand: finalBrand,
        adsScraped: savedAds.length,
        totalAdsFound: scrapedAds.length,
        duplicatesSkipped: scrapedAds.length - savedAds.length,
        existingAdsCount: existingAdsCount,
        offsetUsed: effectiveOffset,
        pagination: {
          hasMore: scrapedAds.length === 200, // If we got exactly 200, there might be more
          nextOffset: effectiveOffset + scrapedAds.length,
          currentOffset: effectiveOffset
        }
      },
    });
    } catch (e: any) {
      console.error("Error processing request:", e);
      return createError({
        message: "An error occurred while processing the request",
        payload: { error: e.message },
      });
    }
  }
);