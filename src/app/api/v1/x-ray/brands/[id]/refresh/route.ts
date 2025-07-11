import messages from "@apiUtils/messages";
import { createError, createResponse } from "@apiUtils/responseutils";
import { authMiddleware } from "@middleware";
import { User } from "@prisma/client";
import prisma from "@prisma/index";
import { NextRequest, NextResponse } from "next/server";
import { scrapeCompanyAds } from "@apiUtils/adScraper";

export const dynamic = "force-dynamic";

export const POST = authMiddleware(
  async (request: NextRequest, response: NextResponse, user: User, { params }: { params: { id: string } }) => {
    const brandId = params.id;

    // Fetch brand
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return createError({
        message: "Brand not found",
      });
    }

    if (!brand.pageId) {
      return createError({
        message: "Brand does not have a pageId. Cannot refresh analytics.",
      });
    }

    try {
      console.log(`Refreshing analytics for brand ${brand.name} (pageId: ${brand.pageId})`);
      
      // Scrape fresh ads from the page - get up to 3000 ads for comprehensive analytics
      const scrapedAds = await scrapeCompanyAds(brand.pageId, 3000);
      
      if (scrapedAds.length === 0) {
        return createError({
          message: "No ads found for this brand. The page might not have any active ads.",
        });
      }

      console.log(`Found ${scrapedAds.length} ads for ${brand.name}`);

      // Save new ads to database (skip duplicates)
      let newAdsCount = 0;
      for (const scrapedAd of scrapedAds) {
        try {
          // Check if ad already exists
          const existingAd = await prisma.ad.findUnique({
            where: { libraryId: scrapedAd.id },
          });

          if (!existingAd) {
            await prisma.ad.create({
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
              },
            });
            newAdsCount++;
          } else {
            // Update existing ad with fresh data
            await prisma.ad.update({
              where: { libraryId: scrapedAd.id },
              data: {
                content: scrapedAd.content, // Update content to get latest status
                imageUrl: scrapedAd.imageUrl,
                videoUrl: scrapedAd.videoUrl,
                text: scrapedAd.text,
                headline: scrapedAd.headline,
                description: scrapedAd.description,
              },
            });
          }
        } catch (adError) {
          console.error(`Error saving/updating ad ${scrapedAd.id}:`, adError);
          // Continue with other ads even if one fails
        }
      }

      // Update brand's total ads count with actual count from database
      const totalAdsInDb = await prisma.ad.count({
        where: { brandId: brand.id },
      });

      await prisma.brand.update({
        where: { id: brand.id },
        data: { totalAds: totalAdsInDb },
      });

      // Calculate fresh statistics
      const allAds = await prisma.ad.findMany({
        where: { brandId: brand.id },
      });

      const videoAds = allAds.filter((ad: any) => ad.type === 'video').length;
      const imageAds = allAds.filter((ad: any) => ad.type === 'image').length;
      const carouselAds = allAds.filter((ad: any) => ad.type === 'carousel').length;
      
      let activeAds = 0;
      let inactiveAds = 0;
      
      allAds.forEach((ad: any) => {
        try {
          const content = JSON.parse(ad.content);
          if (content.is_active === true) {
            activeAds++;
          } else if (content.is_active === false) {
            inactiveAds++;
          } else {
            // If status is unknown, assume active for recently scraped ads
            activeAds++;
          }
        } catch (e) {
          // If we can't parse content, assume active
          activeAds++;
        }
      });

      return createResponse({
        message: messages.SUCCESS,
        payload: {
          brand: brand.name,
          totalAdsScraped: scrapedAds.length,
          newAdsAdded: newAdsCount,
          totalAdsInDatabase: totalAdsInDb,
          analytics: {
            activeAds,
            inactiveAds,
            videoAds,
            imageAds,
            carouselAds,
          },
        },
      });

    } catch (error: any) {
      console.error("Error refreshing brand analytics:", error);
      return createError({
        message: "Failed to refresh brand analytics. Please try again.",
        payload: { error: error.message },
      });
    }
  }
); 