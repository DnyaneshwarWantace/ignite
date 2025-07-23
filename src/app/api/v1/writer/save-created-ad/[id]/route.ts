import { NextRequest, NextResponse } from "next/server";
import { User } from "@prisma/client";
import { authMiddleware } from "@middleware";
import { createResponse, createError } from "@apiUtils/responseutils";
import prisma from "@prisma/index";

export const dynamic = "force-dynamic";

// PATCH - Update a created ad
export const PATCH = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      const { id } = context.params;
      const { headline, description, text, type, brandName, imageUrl } = await request.json();

      if (!id || !headline || !description || !text || !brandName) {
        return createError({
          message: "Missing required fields: id, headline, description, text, or brandName"
        });
      }

      // Verify the ad belongs to the user
      const existingAd = await prisma.createdAd.findFirst({
        where: {
          id: id,
          userId: user.id
        }
      });

      if (!existingAd) {
        return createError({
          message: "Ad not found or access denied"
        });
      }

      // Update the ad
      const updatedAd = await prisma.createdAd.update({
        where: {
          id: id
        },
        data: {
          headline,
          description,
          text,
          type: type || 'image',
          brandName,
          imageUrl: imageUrl || null
        }
      });

      return createResponse({
        message: "Ad updated successfully",
        payload: {
          ad: updatedAd
        }
      });

    } catch (error) {
      console.error('Error updating created ad:', error);
      return createError({
        message: "Failed to update ad",
        payload: { error: (error as Error).message }
      });
    }
  }
);

// DELETE - Delete a created ad
export const DELETE = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      const { id } = context.params;

      if (!id) {
        return createError({
          message: "Ad ID is required"
        });
      }

      // Verify the ad belongs to the user
      const existingAd = await prisma.createdAd.findFirst({
        where: {
          id: id,
          userId: user.id
        }
      });

      if (!existingAd) {
        return createError({
          message: "Ad not found or access denied"
        });
      }

      // Delete the ad
      await prisma.createdAd.delete({
        where: {
          id: id
        }
      });

      return createResponse({
        message: "Ad deleted successfully"
      });

    } catch (error) {
      console.error('Error deleting created ad:', error);
      return createError({
        message: "Failed to delete ad",
        payload: { error: (error as Error).message }
      });
    }
  }
); 