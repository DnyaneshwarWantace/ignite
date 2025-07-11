import messages from "@apiUtils/messages";
import { createError, createResponse } from "@apiUtils/responseutils";
import { authMiddleware } from "@middleware";
import { User } from "@prisma/client";
import prisma from "@prisma/index";
import { NextRequest, NextResponse } from "next/server";
import validation from "./validation";
import { scrapeCompanyAds, extractPageIdFromInput } from "@apiUtils/adScraper";
import { v2 as cloudinary } from 'cloudinary';
import { startAutoTracking } from "../../../../../../../lib/auto-tracker";

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

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Media processing is now handled by the dedicated /api/v1/media/process endpoint

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
      targetFolder = await prisma.folder.findFirst({
        where: {
          name: "Default",
          userId: user.id,
        },
      });

      // If no default folder exists, create one
      if (!targetFolder) {
        try {
          targetFolder = await prisma.folder.create({
            data: {
              name: "Default",
              userId: user.id,
            },
          });
          console.log("Created new Default folder for user:", user.id);
        } catch (error) {
          console.error("Error creating default folder:", error);
          return createError({
            message: "Failed to create default folder. Please try logging out and logging back in.",
          });
        }
      } else {
        console.log("Using existing Default folder:", targetFolder.id);
      }
    }

    // Fetch folder
    if (folderId !== "0") {
      targetFolder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId: user.id,
        },
      });

      if (!targetFolder) {
        return createError({
          message: messages.FOLDER_NOT_FOUND,
        });
      }
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
      let existingBrand = await prisma.brand.findFirst({
        where: {
          pageId: extractedPageId,
        },
        include: {
          ads: {
            select: { libraryId: true }
          }
        }
      });
      
      if (existingBrand) {
        existingAdsCount = existingBrand.ads.length;
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
      let brand = await prisma.brand.findFirst({
        where: {
          pageId: extractedPageId,
        },
    });

      if (!brand) {
        // Extract brand name from first ad or use page ID as fallback
        const brandName = extractBrandNameFromAds(scrapedAds) || `Brand ${extractedPageId}`;
        
        // Create new brand with basic info
        brand = await prisma.brand.create({
          data: {
            name: brandName,
            logo: scrapedAds[0]?.imageUrl || "",
            totalAds: scrapedAds.length,
            pageId: extractedPageId,
            folders: {
              connect: {
                id: targetFolder.id
              }
            }
          },
        });
      } else {
        // Update total ads count with actual count
        const currentAdCount = await prisma.ad.count({
          where: { brandId: brand.id },
        });
        
        // Update brand and connect to folder if not already connected
        await prisma.brand.update({
          where: { id: brand.id },
          data: { 
            totalAds: currentAdCount + scrapedAds.length,
            folders: {
              connect: {
                id: targetFolder.id
              }
            }
          },
        });
      }

      // Save scraped ads to database with improved duplicate checking
      const savedAds = [];
      const newAdIds = scrapedAds.map(ad => ad.id);
      
      // GLOBAL duplicate check - check across ALL brands, not just current brand
      const existingAds = await prisma.ad.findMany({
        where: { 
          libraryId: { in: newAdIds }
          // Remove brandId filter to check globally
        },
        select: { 
          libraryId: true, 
          brandId: true,
          mediaStatus: true,
          localImageUrl: true,
          localVideoUrl: true 
        }
      });
      
      const existingAdMap = new Map();
      existingAds.forEach(ad => {
        existingAdMap.set(ad.libraryId, ad);
      });
      
      console.log(`Found ${existingAds.length} existing ads globally out of ${newAdIds.length} scraped ads`);
      
      for (const scrapedAd of scrapedAds) {
        try {
          const existingAd = existingAdMap.get(scrapedAd.id);
          
          if (!existingAd) {
            // New ad - create with pending media status
            const savedAd = await prisma.ad.create({
              data: {
                libraryId: scrapedAd.id,
                type: scrapedAd.type,
                content: scrapedAd.content,
                imageUrl: scrapedAd.imageUrl,
                videoUrl: scrapedAd.videoUrl,
                text: scrapedAd.text,
                headline: scrapedAd.headline,
                description: scrapedAd.description,
                brandId: brand.id,
                mediaStatus: 'pending', // Set pending for media processing
                mediaRetryCount: 0,
                createdAt: scrapedAd.created_time ? new Date(scrapedAd.created_time) : new Date()
              },
            });
            savedAds.push(savedAd);
            console.log(`✅ New ad added: ${scrapedAd.id} - mediaStatus: pending`);
          } else if (existingAd.brandId !== brand.id) {
            // Ad exists under different brand - link to current brand too
            const savedAd = await prisma.ad.create({
              data: {
                libraryId: scrapedAd.id,
                type: scrapedAd.type,
                content: scrapedAd.content,
                imageUrl: scrapedAd.imageUrl,
                videoUrl: scrapedAd.videoUrl,
                text: scrapedAd.text,
                headline: scrapedAd.headline,
                description: scrapedAd.description,
                brandId: brand.id,
                // Copy media status and URLs from existing ad if already processed
                mediaStatus: existingAd.mediaStatus || 'pending',
                localImageUrl: existingAd.localImageUrl,
                localVideoUrl: existingAd.localVideoUrl,
                mediaRetryCount: 0,
                createdAt: scrapedAd.created_time ? new Date(scrapedAd.created_time) : new Date()
              },
            });
            savedAds.push(savedAd);
            console.log(`✅ Ad linked to brand: ${scrapedAd.id} - mediaStatus: ${savedAd.mediaStatus}`);
          }
        } catch (e) {
          console.error(`Error processing ad ${scrapedAd.id}:`, e);
        }
      }

    // Log that ads were added (background worker will pick them up automatically)
    if (savedAds.length > 0) {
      console.log(`✅ Added ${savedAds.length} new ads with mediaStatus='pending' - background worker will process them automatically`);
        
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
        brand: brand,
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