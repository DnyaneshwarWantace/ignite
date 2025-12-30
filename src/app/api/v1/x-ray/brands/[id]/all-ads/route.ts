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

    // Fetch ALL ads for this brand without any filtering or pagination
    const { data: adsData, error: adsError } = await supabase
      .from('ads')
      .select(`
        id,
        library_id,
        type,
        content,
        image_url,
        video_url,
        text,
        headline,
        description,
        created_at,
        updated_at,
        brand_id,
        local_image_url,
        local_video_url,
        media_status,
        media_downloaded_at,
        media_retry_count,
        brand:brands (
          id,
          name,
          logo,
          page_id,
          total_ads
        )
      `)
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (adsError) {
      console.error("Error fetching ads:", adsError);
      return createError({
        message: "Failed to fetch ads",
        payload: adsError.message,
      });
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
      mediaRetryCount: ad.media_retry_count,
      brand: ad.brand ? {
        ...ad.brand,
        pageId: ad.brand.page_id,
        totalAds: ad.brand.total_ads
      } : null
    }));

    // Count active vs inactive ads based on content
    let activeCount = 0;
    let inactiveCount = 0;
    
    ads.forEach((ad: any) => {
      try {
        const content = JSON.parse(ad.content);
        const isActive = content.is_active ?? content.active ?? content.status === 'active';
        if (isActive === true) {
          activeCount++;
        } else if (isActive === false) {
          inactiveCount++;
        } else {
          activeCount++; // Assume active if unknown
        }
      } catch (e) {
        activeCount++; // Assume active if can't parse
      }
    });

    return createResponse({
      message: messages.SUCCESS,
      payload: {
        ads,
        totalCount: ads.length,
        activeCount,
        inactiveCount,
      },
    });
  }
); 