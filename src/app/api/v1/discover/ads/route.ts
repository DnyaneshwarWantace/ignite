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

      // Check if we need to apply complex filters
      const hasComplexFilters = format || platform || status || language || niche;
      
      let ads: any[] = [];
      let totalAdsCount = 0;
      let filteredAds: any[] = [];
      let startIndex = 0;
      
      if (hasComplexFilters) {
        // For complex filters, we need to fetch ALL ads and apply client-side filtering
        console.log('🔍 Complex filters detected, fetching ALL ads for filtering...');
        
        // First, get total count for logging
        totalAdsCount = await prisma.ad.count({ where: whereClause });
        console.log('🔍 Total ads in database:', totalAdsCount);
        
        // Optimize: If we have a large dataset, fetch in chunks to avoid memory issues
        const CHUNK_SIZE = 2000; // Increased chunk size for better performance
        let allAds: any[] = [];
        
        if (totalAdsCount > CHUNK_SIZE) {
          console.log(`🔍 Large dataset detected (${totalAdsCount} ads), fetching in chunks...`);
          
          let offset = 0;
          const startTime = Date.now();
          
          while (offset < totalAdsCount) {
            const chunk = await prisma.ad.findMany({
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
              skip: offset,
              take: CHUNK_SIZE
            });
            
            allAds.push(...chunk);
            offset += CHUNK_SIZE;
            console.log(`🔍 Fetched chunk: ${Math.min(offset, totalAdsCount)}/${totalAdsCount} ads`);
          }
          
          const fetchTime = Date.now() - startTime;
          console.log(`⏱️  Total fetch time: ${fetchTime}ms (${Math.round(allAds.length / (fetchTime / 1000))} ads/second)`);
        } else {
          // For smaller datasets, fetch all at once
          const startTime = Date.now();
          allAds = await prisma.ad.findMany({
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
            ]
          });
          
          const fetchTime = Date.now() - startTime;
          console.log(`⏱️  Fetch time: ${fetchTime}ms (${Math.round(allAds.length / (fetchTime / 1000))} ads/second)`);
        }
        
        console.log('🔍 Fetched all ads:', allAds.length);
        
        // Apply client-side filters
        console.log('🔍 Applying server-side filters:', { format, platform, status, language, niche });
        
        const filters = createInitialFilterState();
        if (format) filters.format = [format];
        if (platform) filters.platform = [platform];
        if (status) filters.status = [status];
        if (language) filters.language = [language];
        if (niche) filters.niche = [niche];
        
        filteredAds = filterAds(allAds, filters);
        console.log('🔍 Total ads after filtering:', filteredAds.length);
        
        // Apply pagination to filtered results
        if (cursorCreatedAt && cursorId) {
          // Find the position of the cursor in the filtered results
          startIndex = filteredAds.findIndex(ad => 
            ad.createdAt < new Date(cursorCreatedAt) || 
            (ad.createdAt.getTime() === new Date(cursorCreatedAt).getTime() && ad.id < cursorId)
          );
          
          // If cursor not found, start from beginning
          if (startIndex === -1) {
            startIndex = 0;
          }
        }
        
        const endIndex = startIndex + limit;
        ads = filteredAds.slice(startIndex, endIndex);
        
        console.log(`🔍 Pagination: showing ads ${startIndex + 1}-${Math.min(endIndex, filteredAds.length)} of ${filteredAds.length} filtered ads`);
        
      } else {
        // For simple search or no filters, use efficient database pagination
        ads = await prisma.ad.findMany({
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
          take: limit + 1 // Get one extra to check if there are more
        });
      }

      // Handle pagination and cursor logic
      let hasMore = false;
      let adsToReturn = ads;
      let nextCursor = null;
      
      if (hasComplexFilters) {
        // For complex filters, check if there are more filtered results after the current page
        const totalFilteredCount = filteredAds.length;
        const currentPageEnd = startIndex + limit;
        hasMore = currentPageEnd < totalFilteredCount;
        adsToReturn = ads; // No need to slice, we already sliced in the filtering logic
      } else {
        // For simple queries, check if we got more than requested
        hasMore = ads.length > limit;
        adsToReturn = hasMore ? ads.slice(0, -1) : ads;
      }
      
      // Get cursor for next page
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
        totalAdsBeforeFilter: hasComplexFilters ? totalAdsCount : ads.length,
        totalAdsAfterFilter: adsToReturn.length
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