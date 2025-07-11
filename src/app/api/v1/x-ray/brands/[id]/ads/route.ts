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
    // Note: Filtering logic has been removed
    // We're keeping the parameters for UI compatibility but not using them for filtering
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query - REMOVED FILTERING LOGIC
    let whereClause: any = {
      brandId: brandId,
    };

    // Note: All type, status, and search filtering has been removed
    // The UI will still show filter options, but they won't affect the results

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

    // Status filtering logic has been removed
    let filteredAds = ads;
    // Note: We're keeping the variable name for compatibility with the rest of the code
    // but not applying any filtering

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