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

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // video, image, carousel
    const status = searchParams.get('status'); // active, inactive
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query
    let whereClause: any = {
      brandId: brandId,
    };

    if (type) {
      whereClause.type = type;
    }

    if (search) {
      whereClause.OR = [
        { text: { contains: search, mode: 'insensitive' } },
        { headline: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch ads
    const ads = await prisma.ad.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.ad.count({
      where: whereClause,
    });

    console.log(`[DEBUG] Brand ${brandId}: Found ${totalCount} total ads, returning ${ads.length} ads (page ${page}, limit ${limit})`);

    // Filter by status if specified (requires parsing content)
    let filteredAds = ads;
    console.log(`[DEBUG] Status filter: ${status}, Original ads count: ${ads.length}`);
    if (status) {
      filteredAds = ads.filter((ad) => {
        try {
          const content = JSON.parse(ad.content);
          // Try multiple possible field names for active status
          const isActive = content.is_active ?? content.active ?? content.status === 'active' ?? 
                         content.ad_delivery_status === 'active' ?? content.delivery_status === 'active';
          
          if (status === 'active') {
            if (isActive === true) {
              return true;
            } else if (isActive === false) {
              return false;
            } else {
              // Check if ad has end_date to determine if it's inactive
              const endDate = content.end_date || content.end_date_string;
              const startDate = content.start_date || content.start_date_string;
              
              if (endDate) {
                const endDateTime = new Date(endDate).getTime();
                const now = Date.now();
                return endDateTime >= now;
              } else if (startDate) {
                // If no end date but has start date, consider it active if recent
                const startDateTime = new Date(startDate).getTime();
                const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                return startDateTime > thirtyDaysAgo;
              } else {
                // If no date info, assume active for recently scraped ads
                return true;
              }
            }
          } else if (status === 'inactive') {
            if (isActive === false) {
              return true;
            } else if (isActive === true) {
              return false;
            } else {
              // Check if ad has end_date to determine if it's inactive
              const endDate = content.end_date || content.end_date_string;
              const startDate = content.start_date || content.start_date_string;
              
              if (endDate) {
                const endDateTime = new Date(endDate).getTime();
                const now = Date.now();
                return endDateTime < now;
              } else if (startDate) {
                // If no end date but has start date, consider it inactive if old
                const startDateTime = new Date(startDate).getTime();
                const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                return startDateTime <= thirtyDaysAgo;
              } else {
                // If no date info, assume active for recently scraped ads
                return false;
              }
            }
          }
        } catch (e) {
          // If can't parse, assume active
          return status === 'active';
        }
        return true;
      });
      console.log(`[DEBUG] After status filtering: ${filteredAds.length} ads`);
    }

    return createResponse({
      message: messages.SUCCESS,
      payload: {
        ads: filteredAds,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  }
); 