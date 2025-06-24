import messages from "@apiUtils/messages";
import { createError, createResponse } from "@apiUtils/responseutils";
import { authMiddleware } from "@middleware";
import { User } from "@prisma/client";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Conditionally import Prisma to avoid build issues
let prisma: any = null;
if (process.env.DATABASE_URL) {
  try {
    prisma = require("@prisma/index").default;
  } catch (error) {
    console.warn("Failed to load Prisma in discover ads route:", error);
  }
}

export const GET = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    console.log('Discover API route called:', request.url);
    console.log('User:', user?.email || 'No user');
    
    try {
      // Skip database operations if Prisma is not available
      if (!prisma) {
        return createResponse({
          message: "Database not available during build",
          payload: {
            ads: [],
            pagination: {
              hasMore: false,
              nextCursor: null,
              limit: 20
            }
          },
        });
      }
      const { searchParams } = new URL(request.url);
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Allow up to 50 ads per request
      const search = searchParams.get('search') || '';
      const format = searchParams.get('format') || '';
      const platform = searchParams.get('platform') || '';
      const status = searchParams.get('status') || '';
      const language = searchParams.get('language') || '';
      const niche = searchParams.get('niche') || '';
      
      // Keyset pagination parameters
      const cursorCreatedAt = searchParams.get('cursorCreatedAt');
      const cursorId = searchParams.get('cursorId');
      
      console.log('Discover API params:', { 
        limit, search, format, platform, status, language, niche,
        cursorCreatedAt, cursorId
      });

      // Build where clause for search and filters
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
      
      // Search filter
      if (search) {
        andConditions.push({
          OR: [
            {
              text: {
                contains: search
              }
            },
            {
              headline: {
                contains: search
              }
            },
            {
              content: {
                contains: search
              }
            },
            {
              brand: {
                name: {
                  contains: search
                }
              }
            }
          ]
        });
      }

      // Format filter (improved implementation)
      if (format) {
        const formats = format.split(',');
        const formatConditions = formats.map(f => {
          if (f === 'Video') {
            return {
              OR: [
                { type: { contains: 'video' } },
                { content: { contains: '"videos":[{' } },
                { content: { contains: '"video_hd_url"' } },
                { content: { contains: '"video_sd_url"' } }
              ]
            };
          } else if (f === 'Carousal' || f === 'Carousel') {
            return {
              OR: [
                { type: { contains: 'carousel' } },
                { content: { contains: '"cards":[{' } },
                { content: { contains: '"display_format":"carousel"' } }
              ]
            };
          } else if (f === 'Image') {
            return {
              OR: [
                { type: { contains: 'image' } },
                { content: { contains: '"images":[{' } },
                { content: { contains: '"original_image_url"' } }
              ]
            };
          }
          return { type: { contains: f.toLowerCase() } };
        });
        
        if (formatConditions.length > 0) {
          andConditions.push({ OR: formatConditions });
        }
      }

      // Platform filter (improved implementation)
      if (platform) {
        const platforms = platform.split(',');
        const platformConditions = platforms.map(p => {
          const platformLower = p.toLowerCase();
          if (platformLower === 'facebook') {
            return {
              OR: [
                { content: { contains: '"publisher_platform":["facebook"' } },
                { content: { contains: '"publisher_platform":["Facebook"' } },
                { content: { contains: 'facebook' } }
              ]
            };
          } else if (platformLower === 'instagram') {
            return {
              OR: [
                { content: { contains: '"publisher_platform":["instagram"' } },
                { content: { contains: '"publisher_platform":["Instagram"' } },
                { content: { contains: 'instagram' } }
              ]
            };
          } else if (platformLower === 'tiktok organic' || platformLower === 'tiktok') {
            return {
              OR: [
                { content: { contains: 'tiktok' } },
                { content: { contains: 'TikTok' } }
              ]
            };
          } else if (platformLower === 'youtube') {
            return {
              OR: [
                { content: { contains: 'youtube' } },
                { content: { contains: 'YouTube' } }
              ]
            };
          } else if (platformLower === 'linkedin') {
            return {
              OR: [
                { content: { contains: 'linkedin' } },
                { content: { contains: 'LinkedIn' } }
              ]
            };
          }
          return { content: { contains: platformLower } };
        });
        
        if (platformConditions.length > 0) {
          andConditions.push({ OR: platformConditions });
        }
      }

      // Status filter (basic implementation)
      if (status) {
        const statuses = status.split(',');
        const statusConditions = statuses.map(s => {
          if (s === 'Running') {
            return {
              OR: [
                { content: { contains: '"is_active":true' } },
                { content: { contains: '"active":true' } }
              ]
            };
          } else if (s === 'Not Running') {
            return {
              OR: [
                { content: { contains: '"is_active":false' } },
                { content: { contains: '"active":false' } }
              ]
            };
          }
          return { content: { contains: s.toLowerCase() } };
        });
        
        if (statusConditions.length > 0) {
          andConditions.push({ OR: statusConditions });
        }
      }

      // Language and niche filters (basic keyword-based implementation)
      if (language) {
        const languages = language.split(',');
        const languageConditions = languages.map(l => ({
          OR: [
            { content: { contains: l.toLowerCase() } },
            { text: { contains: l.toLowerCase() } },
            { headline: { contains: l.toLowerCase() } }
          ]
        }));
        
        if (languageConditions.length > 0) {
          andConditions.push({ OR: languageConditions });
        }
      }

      if (niche) {
        const niches = niche.split(',');
        const nicheConditions = niches.map(n => ({
          OR: [
            { content: { contains: n.toLowerCase() } },
            { text: { contains: n.toLowerCase() } },
            { headline: { contains: n.toLowerCase() } },
            { brand: { name: { contains: n.toLowerCase() } } }
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
        take: limit + 1 // Get one extra to know if there are more
      });

      // Check if there are more items
      const hasMore = ads.length > limit;
      const adsToReturn = hasMore ? ads.slice(0, -1) : ads;
      
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
        filtersApplied: { search, format, platform, status, language, niche }
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
    } catch (error) {
      console.error('Error fetching discover ads:', error);
      return createError({
        message: "Failed to fetch ads",
      });
    }
  }
); 