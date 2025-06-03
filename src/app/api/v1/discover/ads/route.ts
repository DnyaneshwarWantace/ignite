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
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';
      const format = searchParams.get('format') || '';
      const platform = searchParams.get('platform') || '';
      const status = searchParams.get('status') || '';
      const language = searchParams.get('language') || '';
      const niche = searchParams.get('niche') || '';
      
      console.log('Discover API params:', { page, limit, search, format, platform, status, language, niche });
      
      const skip = (page - 1) * limit;

      // Build where clause for search and filters
      const whereClause: any = {};
      const andConditions: any[] = [];
      
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

      // Fetch all ads with their associated brands
      const [ads, totalCount] = await Promise.all([
        prisma.ad.findMany({
          where: whereClause,
          include: {
            brand: {
              select: {
                id: true,
                name: true,
                logo: true,
                pageId: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.ad.count({
          where: whereClause
        })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      console.log('Discover API response:', { 
        adsCount: ads.length, 
        totalCount, 
        totalPages,
        page,
        filtersApplied: { search, format, platform, status, language, niche }
      });

      return createResponse({
        message: messages.SUCCESS,
        payload: {
          ads,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
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