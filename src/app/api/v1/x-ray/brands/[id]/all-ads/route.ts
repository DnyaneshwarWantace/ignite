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

    // Validate that brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return createError({
        message: "Brand not found",
      });
    }

    // Fetch ALL ads for this brand without any filtering or pagination
    const ads = await prisma.ad.findMany({
      where: {
        brandId: brandId,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`[DEBUG] All Ads Endpoint - Brand ${brandId}: Found ${ads.length} total ads`);

    // Count active vs inactive ads for debugging
    let activeCount = 0;
    let inactiveCount = 0;
    
    ads.forEach((ad) => {
      try {
        const content = JSON.parse(ad.content);
        const isActive = content.is_active ?? content.active ?? content.status === 'active' ?? 
                       content.ad_delivery_status === 'active' ?? content.delivery_status === 'active';
        
        if (isActive === true) {
          activeCount++;
        } else if (isActive === false) {
          inactiveCount++;
        } else {
          // Check if ad has end_date to determine if it's inactive
          const endDate = content.end_date || content.end_date_string;
          if (endDate) {
            const endDateTime = new Date(endDate).getTime();
            const now = Date.now();
            if (endDateTime < now) {
              inactiveCount++;
            } else {
              activeCount++;
            }
          } else {
            // If no clear status, assume active
            activeCount++;
          }
        }
      } catch (e) {
        // If can't parse, assume active
        activeCount++;
      }
    });

    console.log(`[DEBUG] All Ads Endpoint - Active: ${activeCount}, Inactive: ${inactiveCount}`);

    return createResponse({
      message: messages.SUCCESS,
      payload: {
        ads,
        totalCount: ads.length,
        activeCount,
        inactiveCount,
      },
    });
  }
); 