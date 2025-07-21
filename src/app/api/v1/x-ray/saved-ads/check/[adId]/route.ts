import { NextRequest, NextResponse } from "next/server";
import { User } from "@prisma/client";
import { authMiddleware } from "@middleware";
import { createResponse, createError } from "@apiUtils/responseutils";
import messages from "@apiUtils/messages";
import prisma from "@prisma/index";

export const dynamic = "force-dynamic";

// GET - Check if an ad is saved
export const GET = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      const adId = context.params.adId;

      if (!adId) {
        return createError({
          message: "Ad ID is required"
        });
      }

      // Check if ad is saved
      const savedAd = await prisma.savedAd.findFirst({
        where: {
          adId: adId,
          userId: user.id
        }
      });

      return createResponse({
        message: messages.SUCCESS,
        payload: {
          isSaved: !!savedAd
        }
      });

    } catch (error) {
      console.error('Error checking if ad is saved:', error);
      return createError({
        message: "Failed to check if ad is saved",
        payload: { error: (error as Error).message }
      });
    }
  }
); 