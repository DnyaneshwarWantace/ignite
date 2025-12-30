import messages from "@apiUtils/messages";
import { createError, createResponse } from "@apiUtils/responseutils";
import { authMiddleware } from "@middleware";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// Type definition for User (matching Supabase schema)
interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export const dynamic = "force-dynamic";

export const GET = authMiddleware(
  async (request: NextRequest, context: { params: { id: string } }, user: User) => {
    const brandId = context.params.id;

    // Validate that brand exists
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single();

    if (brandError || !brand) {
      return createError({
        message: "Brand not found",
      });
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Fetch ads with pagination
    const { data: adsData, error: adsError } = await supabase
      .from('ads')
      .select(`
        *,
        brand:brands (*)
      `)
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (adsError) {
      console.error("Error fetching ads:", adsError);
      return createError({
        message: "Failed to fetch ads",
        payload: adsError.message,
      });
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('ads')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId);

    if (countError) {
      console.error("Error counting ads:", countError);
    }

    // Transform snake_case to camelCase for compatibility
    const ads = (adsData || []).map((ad: any) => ({
      ...ad,
      libraryId: ad.library_id,
      imageUrl: ad.image_url,
      videoUrl: ad.video_url,
      createdAt: new Date(ad.created_at),
      updatedAt: new Date(ad.updated_at),
      brandId: ad.brand_id,
      localImageUrl: ad.local_image_url,
      localVideoUrl: ad.local_video_url,
      mediaStatus: ad.media_status,
      mediaDownloadedAt: ad.media_downloaded_at ? new Date(ad.media_downloaded_at) : null,
      brand: ad.brand ? {
        ...ad.brand,
        pageId: ad.brand.page_id,
        totalAds: ad.brand.total_ads
      } : null
    }));

    return createResponse({
      message: messages.SUCCESS,
      payload: {
        ads: ads,
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit),
        },
      },
    });
  }
);