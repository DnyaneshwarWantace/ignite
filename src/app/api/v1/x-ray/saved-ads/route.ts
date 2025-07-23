import { NextRequest, NextResponse } from "next/server";
import { User } from "@prisma/client";
import { authMiddleware } from "@middleware";
import { createResponse, createError } from "@apiUtils/responseutils";
import messages from "@apiUtils/messages";
import prisma from "@prisma/index";

export const dynamic = "force-dynamic";

// GET - Fetch saved ads
export const GET = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const folderId = searchParams.get('folderId');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      let whereClause: any = {
        userId: user.id
      };

      // If folderId is provided, filter by folder
      if (folderId && folderId !== '0' && folderId !== 'all') {
        whereClause.folderId = folderId;
      } else if (folderId === '0') {
        // Default folder - saved ads not in any specific folder
        whereClause.folderId = null;
      }
      // If folderId is 'all', don't apply any folder filter - show all saved ads

      // Fetch saved ads with actual ad data
      const savedAds = await prisma.savedAd.findMany({
        where: whereClause,
        include: {
          folder: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      });

      // Fetch actual ad data for each saved ad to get Cloudinary URLs
      const savedAdsWithFullData = await Promise.all(
        savedAds.map(async (savedAd) => {
          const actualAd = await prisma.ad.findUnique({
            where: { id: savedAd.adId },
            select: {
              id: true,
              localImageUrl: true,
              localVideoUrl: true,
              content: true,
              imageUrl: true,
              videoUrl: true,
              type: true,
              headline: true,
              description: true,
              text: true
            }
          });

          // Merge saved ad data with actual ad data
          const adData = JSON.parse(savedAd.adData || '{}');
          const mergedAdData = {
            ...adData,
            id: savedAd.adId,
            localImageUrl: actualAd?.localImageUrl,
            localVideoUrl: actualAd?.localVideoUrl,
            content: actualAd?.content || adData.content,
            imageUrl: actualAd?.imageUrl || adData.imageUrl,
            videoUrl: actualAd?.videoUrl || adData.videoUrl,
            type: actualAd?.type || adData.type,
            headline: actualAd?.headline || adData.headline,
            description: actualAd?.description || adData.description,
            text: actualAd?.text || adData.text
          };

          return {
            ...savedAd,
            adData: JSON.stringify(mergedAdData)
          };
        })
      );

      // Get total count
      const totalCount = await prisma.savedAd.count({
        where: whereClause
      });

      return createResponse({
        message: messages.SUCCESS,
        payload: {
          ads: savedAdsWithFullData,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching saved ads:', error);
      return createError({
        message: "Failed to fetch saved ads",
        payload: { error: (error as Error).message }
      });
    }
  }
);

// POST - Save an ad to a folder
export const POST = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      const { adId, folderId, adData } = await request.json();

      if (!adId) {
        return createError({
          message: "Ad ID is required"
        });
      }

      // Check if ad is already saved
      const existingSavedAd = await prisma.savedAd.findFirst({
        where: {
          adId: adId,
          userId: user.id
        }
      });

      if (existingSavedAd) {
        return createError({
          message: "Ad is already saved"
        });
      }

      // If folderId is provided and not '0', verify the folder exists
      let folderToUse = null;
      if (folderId && folderId !== '0') {
        folderToUse = await prisma.savedAdFolder.findFirst({
          where: {
            id: folderId,
            userId: user.id
          }
        });

        if (!folderToUse) {
          return createError({
            message: "Folder not found"
          });
        }
      }

      // Save the ad
      const savedAd = await prisma.savedAd.create({
        data: {
          adId: adId,
          adData: adData || JSON.stringify({}),
          folderId: folderToUse?.id || null,
          userId: user.id
        },
        include: {
          folder: true
        }
      });

      return createResponse({
        message: "Ad saved successfully",
        payload: {
          savedAd: savedAd,
          folderId: folderToUse?.id || '0'
        }
      });

    } catch (error) {
      console.error('Error saving ad:', error);
      return createError({
        message: "Failed to save ad",
        payload: { error: (error as Error).message }
      });
    }
  }
); 