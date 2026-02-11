import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@middleware";
import { createResponse, createError } from "@apiUtils/responseutils";
import messages from "@apiUtils/messages";
import { supabase } from "@/lib/supabase";

// Type definition for User (matching Supabase schema)
interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

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

      const { data: savedAd, error: savedAdError } = await supabase
        .from('saved_ads')
        .select('id')
        .eq('ad_id', adId)
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (savedAdError) {
        console.error('Error checking saved ad:', savedAdError);
        return createError({
          message: "Failed to check if ad is saved",
          payload: { error: savedAdError.message }
        });
      }

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