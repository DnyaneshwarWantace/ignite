import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@middleware";
import { createResponse, createError } from "@apiUtils/responseutils";
import { supabase } from "@/lib/supabase";

// Type definition for User (matching Supabase schema)
interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

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
      const { data: existingAd, error: checkError } = await supabase
        .from('created_ads')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (checkError || !existingAd) {
        return createError({
          message: "Ad not found or access denied"
        });
      }

      // Update the ad
      const { data: updatedAd, error: updateError } = await supabase
        .from('created_ads')
        .update({
          headline,
          description,
          text,
          type: type || 'image',
          brand_name: brandName,
          image_url: imageUrl || null
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating created ad:', updateError);
        return createError({
          message: "Failed to update ad",
          payload: { error: updateError.message }
        });
      }

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
      const { data: existingAd, error: checkError } = await supabase
        .from('created_ads')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (checkError || !existingAd) {
        return createError({
          message: "Ad not found or access denied"
        });
      }

      // Delete the ad
      const { error: deleteError } = await supabase
        .from('created_ads')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting created ad:', deleteError);
        return createError({
          message: "Failed to delete ad",
          payload: { error: deleteError.message }
        });
      }

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