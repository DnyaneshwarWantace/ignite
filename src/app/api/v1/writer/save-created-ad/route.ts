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
      const { data: createdAd, error: insertError } = await supabase
        .from('created_ads')
        .insert({
          headline,
          description,
          text,
          type: type || 'image',
          brand_name: brandName,
          image_url: imageUrl || null,
          user_id: user.id,
          is_generated: true
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error saving created ad:', insertError);
        return createError({
          message: "Failed to save ad",
          payload: { error: insertError.message }
        });
      }

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

      // Fetch created ads with count
      const { data: createdAdsData, error: fetchError, count: totalCount } = await supabase
        .from('created_ads')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (fetchError) {
        console.error('Error fetching created ads:', fetchError);
        return createError({
          message: "Failed to fetch created ads",
          payload: { error: fetchError.message }
        });
      }

      // Transform snake_case to camelCase for compatibility
      const createdAds = (createdAdsData || []).map((ad: any) => ({
        ...ad,
        brandName: ad.brand_name,
        imageUrl: ad.image_url,
        userId: ad.user_id,
        isGenerated: ad.is_generated,
        createdAt: new Date(ad.created_at),
        updatedAt: new Date(ad.updated_at)
      }));

      return createResponse({
        message: messages.SUCCESS,
        payload: {
          ads: createdAds,
          pagination: {
            page,
            limit,
            total: totalCount || 0,
            totalPages: Math.ceil((totalCount || 0) / limit)
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