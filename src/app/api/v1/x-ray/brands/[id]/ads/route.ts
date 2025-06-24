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
      include: {
        brand: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.ad.count({
      where: whereClause,
    });

    // Apply status filtering if specified
    let filteredAds = ads;
    if (status) {
      if (status === 'active') {
        filteredAds = ads.filter(ad => {
        try {
          const content = JSON.parse(ad.content);
            return content.is_active === true || content.active === true || content.status === 'active';
          } catch (e) {
            return true; // Assume active if can't parse
              }
        });
          } else if (status === 'inactive') {
        filteredAds = ads.filter(ad => {
          try {
            const content = JSON.parse(ad.content);
            return content.is_active === false || content.active === false || content.status === 'inactive';
          } catch (e) {
            return false; // Assume not inactive if can't parse
          }
        });
      }
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