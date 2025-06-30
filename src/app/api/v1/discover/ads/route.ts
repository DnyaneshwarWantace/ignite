import messages from "@apiUtils/messages";
import { createError, createResponse } from "@apiUtils/responseutils";
import { authMiddleware } from "@middleware";
import { User } from "@prisma/client";
import prisma from "@prisma/index";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export const GET = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    console.log('Discover API route called:', request.url);
    console.log('User:', user?.email || 'No user');
    
    try {
      const { searchParams } = new URL(request.url);
      
      // Validate limit parameter - remove the 50 ads limit for filtering
      const rawLimit = searchParams.get('limit');
      if (rawLimit && isNaN(parseInt(rawLimit))) {
        return createError({
          message: "Invalid limit parameter. Must be a number.",
          status: 400,
        });
      }
      // For filtering, allow unlimited results or high limit
      const limit = parseInt(rawLimit || '1000'); // Default to 1000 to show all matching ads

      // Get other parameters
      const search = searchParams.get('search') || '';
      const format = searchParams.get('format') || '';
      const platform = searchParams.get('platform') || '';
      const status = searchParams.get('status') || '';
      const language = searchParams.get('language') || '';
      const niche = searchParams.get('niche') || '';
      
      console.log('Discover API params:', { 
        limit, search, format, platform, status, language, niche
      });

      // Build where clause for search and filters
      const whereClause: any = {};
      const andConditions: any[] = [];
      
      // Search filter (case insensitive)
      if (search) {
        andConditions.push({
          OR: [
            {
              text: {
                contains: search,
                mode: 'insensitive'
              }
            },
            {
              headline: {
                contains: search,
                mode: 'insensitive'
              }
            },
            {
              content: {
                contains: search,
                mode: 'insensitive'
              }
            },
            {
              brand: {
                name: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            }
          ]
        });
      }

      // Format filter (strict matching based on actual data structure)
      if (format) {
        const formats = format.split(',');
        const formatConditions = formats.map(f => {
          if (f === 'Video') {
            return {
              OR: [
                { type: 'video' },
                { content: { contains: '"display_format":"VIDEO"', mode: 'insensitive' } }
              ]
            };
          } else if (f === 'Carousal' || f === 'Carousel') {
            return {
              OR: [
                { type: 'carousel' },
                { content: { contains: '"display_format":"DCO"', mode: 'insensitive' } }
              ]
            };
          } else if (f === 'Image') {
            return {
              OR: [
                { type: 'image' },
                { content: { contains: '"display_format":"IMAGE"', mode: 'insensitive' } }
              ]
            };
          }
          return { type: f.toLowerCase() };
        });
        
        if (formatConditions.length > 0) {
          if (formatConditions.length === 1) {
            // Single format filter
            andConditions.push(formatConditions[0]);
          } else {
            // Multiple format filter (OR condition)
            andConditions.push({ OR: formatConditions });
          }
        }
      }

      // Platform filter (strict matching based on actual data structure)
      if (platform) {
        const platforms = platform.split(',');
        const platformConditions = platforms.map(p => {
          const platformLower = p.toLowerCase();
          if (platformLower === 'facebook') {
            return {
              content: { contains: '"FACEBOOK"', mode: 'insensitive' }
            };
          } else if (platformLower === 'instagram') {
            return {
              content: { contains: '"INSTAGRAM"', mode: 'insensitive' }
            };
          } else if (platformLower === 'tiktok organic' || platformLower === 'tiktok') {
            return {
              content: { contains: '"TIKTOK"', mode: 'insensitive' }
            };
          } else if (platformLower === 'youtube') {
            return {
              content: { contains: '"YOUTUBE"', mode: 'insensitive' }
            };
          } else if (platformLower === 'linkedin') {
            return {
              content: { contains: '"LINKEDIN"', mode: 'insensitive' }
            };
          }
        }).filter(Boolean);
        
        if (platformConditions.length > 0) {
          if (platformConditions.length === 1) {
            // Single platform filter
            andConditions.push(platformConditions[0]);
          } else {
            // Multiple platform filter (OR condition)
            andConditions.push({ OR: platformConditions });
          }
        }
      }

      // Status filter (using correct field names)
      if (status) {
        const statuses = status.split(',');
        const statusConditions = statuses.map(s => {
          if (s === 'Running') {
            return {
              OR: [
                { content: { contains: '"is_active":true' } },
                { content: { contains: '"isActive":true' } }
              ]
            };
          } else if (s === 'Not Running') {
            return {
              OR: [
                { content: { contains: '"is_active":false' } },
                { content: { contains: '"isActive":false' } }
              ]
            };
          }
        }).filter(Boolean);

        if (statusConditions.length > 0) {
          if (statusConditions.length === 1) {
            // Single status filter
            andConditions.push(statusConditions[0]);
          } else {
            // Multiple status filter (OR condition)
            andConditions.push({ OR: statusConditions });
          }
        }
      }

      // Language filter (improved)
      if (language) {
        const languages = language.split(',');
        const languageConditions = languages.map(lang => ({
          OR: [
            { content: { contains: lang, mode: 'insensitive' } },
            { text: { contains: lang, mode: 'insensitive' } },
            { headline: { contains: lang, mode: 'insensitive' } }
          ]
        }));

        if (languageConditions.length > 0) {
          andConditions.push({ OR: languageConditions });
        }
      }

      // Niche filter (improved)
      if (niche) {
        const niches = niche.split(',');
        const nicheConditions = niches.map(n => ({
          OR: [
            { content: { contains: n, mode: 'insensitive' } },
            { text: { contains: n, mode: 'insensitive' } },
            { headline: { contains: n, mode: 'insensitive' } },
            { brand: { name: { contains: n, mode: 'insensitive' } } }
          ]
        }));

        if (nicheConditions.length > 0) {
          andConditions.push({ OR: nicheConditions });
        }
      }

      // Combine all conditions
      if (andConditions.length > 0) {
        whereClause.AND = andConditions;
      }

      console.log('Final where clause:', JSON.stringify(whereClause, null, 2));
      console.log('Filter parameters:', { format, platform, status, language, niche });
      console.log('Total conditions:', andConditions.length);

      // Execute query
      const ads = await prisma.ad.findMany({
        where: whereClause,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
        },
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' }
        ],
        take: limit
      });

      console.log(`Found ${ads.length} ads with filters`);
      
      // Debug: Show actual ad content to understand the data structure
      if (ads.length > 0) {
        console.log('=== DEBUGGING AD CONTENT ===');
        ads.slice(0, 3).forEach((ad, index) => {
          console.log(`\nAd ${index + 1}:`);
          console.log('Type:', ad.type);
          try {
            const content = JSON.parse(ad.content);
            console.log('Display Format:', content.snapshot?.display_format);
            console.log('Publisher Platform:', content.publisher_platform);
            console.log('Is Active:', content.is_active);
            console.log('Has Videos:', !!content.snapshot?.videos?.length);
            console.log('Has Images:', !!content.snapshot?.images?.length);
            console.log('Has Cards:', !!content.snapshot?.cards?.length);
          } catch (e) {
            console.log('Could not parse content');
          }
        });
        console.log('=== END DEBUGGING ===\n');
      }

      return createResponse({
        message: messages.SUCCESS,
        payload: {
          ads: ads,
          pagination: {
            hasMore: ads.length === limit,
            nextCursor: null,
            limit,
            total: ads.length
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