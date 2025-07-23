import { NextRequest, NextResponse } from "next/server";
import { User } from "@prisma/client";
import { authMiddleware } from "@middleware";
import { createResponse, createError } from "@apiUtils/responseutils";
import messages from "@apiUtils/messages";
import prisma from "@prisma/index";

export const dynamic = "force-dynamic";

// POST - Save a user-created ad
export const POST = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      const { headline, description, text, type, brandName, imageUrl } = await request.json();

      if (!headline || !description || !text || !brandName) {
        return createError({
          message: "Missing required fields: headline, description, text, or brandName"
        });
      }

      // Save the created ad
      const createdAd = await prisma.createdAd.create({
        data: {
          headline,
          description,
          text,
          type: type || 'image',
          brandName,
          imageUrl: imageUrl || null,
          userId: user.id,
          isGenerated: true
        }
      });

      return createResponse({
        message: "Ad saved successfully",
        payload: {
          ad: createdAd
        }
      });

    } catch (error) {
      console.error('Error saving created ad:', error);
      return createError({
        message: "Failed to save ad",
        payload: { error: (error as Error).message }
      });
    }
  }
);

// GET - Fetch user's created ads
export const GET = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      // Fetch created ads
      const createdAds = await prisma.createdAd.findMany({
        where: {
          userId: user.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      });

      // Get total count
      const totalCount = await prisma.createdAd.count({
        where: {
          userId: user.id
        }
      });

      return createResponse({
        message: messages.SUCCESS,
        payload: {
          ads: createdAds,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching created ads:', error);
      return createError({
        message: "Failed to fetch created ads",
        payload: { error: (error as Error).message }
      });
    }
  }
); 