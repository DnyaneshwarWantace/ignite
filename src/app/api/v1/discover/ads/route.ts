import messages from "@apiUtils/messages";
import { createError, createResponse } from "@apiUtils/responseutils";
import { authMiddleware } from "@middleware";
import { User } from "@prisma/client";
import prisma from "@prisma/index";
import { filterAds, createInitialFilterState } from "@/lib/adFiltering";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export const GET = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    console.log('Discover API route called:', request.url);
    console.log('User:', user?.email || 'No user');
    
    try {
      const { searchParams } = new URL(request.url);
      
      // Validate limit parameter
      const rawLimit = searchParams.get('limit');
      if (rawLimit && isNaN(parseInt(rawLimit))) {
        return createError({
          message: "Invalid limit parameter. Must be a number.",
          status: 400,
        });
      }
      const limit = Math.min(parseInt(rawLimit || '20'), 50); // Allow up to 50 ads per request

      // Get other parameters
      const search = searchParams.get('search') || '';
      const format = searchParams.get('format') || '';
      const platform = searchParams.get('platform') || '';
      const status = searchParams.get('status') || '';
      const language = searchParams.get('language') || '';
      const niche = searchParams.get('niche') || '';
      
      // Validate cursor parameters
      const cursorCreatedAt = searchParams.get('cursorCreatedAt');
      const cursorId = searchParams.get('cursorId');
      
      if ((cursorCreatedAt && !cursorId) || (!cursorCreatedAt && cursorId)) {
        return createError({
          message: "Both cursorCreatedAt and cursorId must be provided together.",
          status: 400,
        });
      }

      if (cursorCreatedAt) {
        try {
          new Date(cursorCreatedAt);
        } catch (e) {
          return createError({
            message: "Invalid cursorCreatedAt date format.",
            status: 400,
          });
        }
      }
      
      console.log('Discover API params:', { 
        limit, search, format, platform, status, language, niche,
        cursorCreatedAt, cursorId
      });

      // Build where clause for search and filters - REMOVED FILTERING LOGIC
      const whereClause: any = {};
      const andConditions: any[] = [];
      
      // Keyset pagination condition
      if (cursorCreatedAt && cursorId) {
        andConditions.push({
          OR: [
            {
              createdAt: {
                lt: new Date(cursorCreatedAt)
              }
            },
            {
              AND: [
                {
                  createdAt: new Date(cursorCreatedAt)
                },
                {
                  id: {
                    lt: cursorId
                  }
                }
              ]
            }
          ]
        });
      }
      
            // Add filtering conditions
      if (search) {
        andConditions.push({
          OR: [
            { text: { contains: search, mode: 'insensitive' } },
            { headline: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { brand: { name: { contains: search, mode: 'insensitive' } } },
            { libraryId: { contains: search, mode: 'insensitive' } }
          ]
        });
      }

      // Note: Other filters (format, platform, status, language, niche) will be applied 
      // using the existing filterAds function after database query since they require 
      // complex JSON content parsing that's better handled in application logic
      
      // Combine all conditions
      if (andConditions.length > 0) {
        whereClause.AND = andConditions;
      }

      // Fetch ads with keyset pagination
      const ads = await prisma.ad.findMany({
        where: whereClause,
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
          brand: {
            select: {
              id: true,
              name: true,
              logo: true,
              pageId: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' }
        ],
        take: (format || platform || status || language || niche) ? limit * 3 : limit + 1 // Get more for filtering
      });

      // Apply client-side filters for complex JSON content parsing
      let filteredAds = ads;
      if (format || platform || status || language || niche) {
        const filters = createInitialFilterState();
        if (format) filters.format = [format];
        if (platform) filters.platform = [platform];
        if (status) filters.status = [status];
        if (language) filters.language = [language];
        if (niche) filters.niche = [niche];
        
        filteredAds = filterAds(ads, filters);
      }

      // Check if there are more items after filtering
      const hasMore = filteredAds.length > limit;
      const adsToReturn = hasMore ? filteredAds.slice(0, -1) : filteredAds;
      
      // Get cursor for next page
      let nextCursor = null;
      if (hasMore && adsToReturn.length > 0) {
        const lastAd = adsToReturn[adsToReturn.length - 1];
        nextCursor = {
          createdAt: lastAd.createdAt.toISOString(),
          id: lastAd.id
        };
      }

            console.log('Discover API response:', {
        adsCount: adsToReturn.length,
        hasMore,
        nextCursor,
        filtersApplied: { search, format, platform, status, language, niche },
        totalAdsBeforeFilter: ads.length,
        totalAdsAfterFilter: filteredAds.length
      });

      return createResponse({
        message: messages.SUCCESS,
        payload: {
          ads: adsToReturn,
          pagination: {
            hasMore,
            nextCursor,
            limit
          }
        },
      });
    } catch (error: any) {
      console.error('Error fetching discover ads:', error);
      
      // Handle specific Prisma errors
      if (error.code === 'P2023') {
        return createError({
          message: "Invalid ID format in cursor.",
          status: 400,
        });
      }
      
      if (error.code === 'P2025') {
        return createError({
          message: "Record not found.",
          status: 404,
        });
      }
      
      return createError({
        message: "Failed to fetch ads",
        status: 500,
        payload: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);