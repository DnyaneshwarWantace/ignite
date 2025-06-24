import messages from "@apiUtils/messages";
import { createError, createResponse } from "@apiUtils/responseutils";
import { authMiddleware } from "@middleware";
import { User } from "@prisma/client";
import prisma from "@prisma/index";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = authMiddleware(
  async (request: NextRequest, context: { params: { id: string } }, user: User) => {
    const brandId = context.params.id;

    // Fetch brand with ads
    const brand = await prisma.brand.findUnique({
      where: {
        id: brandId,
      },
      include: {
        ads: true,
      },
    });

    if (!brand) {
      return createError({
        message: "Brand not found",
      });
    }

    const ads = brand.ads || [];
    
    // Calculate real statistics
    const videoAds = ads.filter((ad: any) => ad.type === 'video').length;
    const imageAds = ads.filter((ad: any) => ad.type === 'image').length;
    const carouselAds = ads.filter((ad: any) => ad.type === 'carousel').length;
    
    // Calculate active/inactive ads based on ad data
    let activeAds = 0;
    let inactiveAds = 0;
    
    ads.forEach((ad: any) => {
      try {
        const content = JSON.parse(ad.content);
        // Check if ad is active based on ScrapeCreators API format
        // Try multiple possible field names for active status
        const isActive = content.is_active ?? content.active ?? content.status === 'active' ?? 
                       content.ad_delivery_status === 'active' ?? content.delivery_status === 'active';
        
        if (isActive === true) {
          activeAds++;
        } else if (isActive === false) {
          inactiveAds++;
        } else {
          // Check if ad has end_date to determine if it's inactive
          const endDate = content.end_date || content.end_date_string;
          const startDate = content.start_date || content.start_date_string;
          
          if (endDate) {
            const endDateTime = new Date(endDate).getTime();
            const now = Date.now();
            if (endDateTime < now) {
              inactiveAds++;
            } else {
              activeAds++;
            }
          } else if (startDate) {
            // If no end date but has start date, consider it active if recent
            const startDateTime = new Date(startDate).getTime();
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            if (startDateTime > thirtyDaysAgo) {
              activeAds++;
            } else {
              inactiveAds++;
            }
          } else {
            // If no date info, assume active for recently scraped ads
            activeAds++;
          }
        }
      } catch (e) {
        // If we can't parse content, assume active
        activeAds++;
      }
    });

    // Update brand with real statistics (exclude ads from response)
    const { ads: _, ...brandWithStats } = {
      ...brand,
      activeAds,
      inActiveAds: inactiveAds,
      noOfVideoAds: videoAds,
      noOfImageAds: imageAds,
      noOfGifAds: carouselAds, // Using carousel count for "gif" ads
      totalAds: ads.length, // Real count from database
    };

    return createResponse({
      message: messages.SUCCESS,
      payload: { brand: brandWithStats },
    });
  }
); 