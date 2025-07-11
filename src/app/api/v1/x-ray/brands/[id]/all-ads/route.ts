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
        brandId,
      },
      select: {
        id: true,
        libraryId: true,
        type: true,
        content: true,
        imageUrl: true,
        videoUrl: true,
        text: true,
        headline: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        brandId: true,
        // Cloudinary media fields
        localImageUrl: true,
        localVideoUrl: true,
        mediaStatus: true,
        mediaDownloadedAt: true,
        mediaRetryCount: true,
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
            pageId: true,
            totalAds: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Count active vs inactive ads based on content
    let activeCount = 0;
    let inactiveCount = 0;
    
    ads.forEach((ad: any) => {
      try {
        const content = JSON.parse(ad.content);
        const isActive = content.is_active ?? content.active ?? content.status === 'active';
        if (isActive === true) {
          activeCount++;
        } else if (isActive === false) {
          inactiveCount++;
        } else {
          activeCount++; // Assume active if unknown
        }
      } catch (e) {
        activeCount++; // Assume active if can't parse
      }
    });

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