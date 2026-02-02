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

    // Fetch brand with ads
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('*, ads(*)')
      .eq('id', brandId)
      .single();

    if (brandError || !brand) {
      return createError({
        message: "Brand not found",
      });
    }

    const ads = brand.ads || [];
    
    // Calculate real statistics
    const videoAds = ads.filter((ad: any) => ad.type === 'video').length;
    const imageAds = ads.filter((ad: any) => ad.type === 'image').length;
    const carouselAds = ads.filter((ad: any) => ad.type === 'carousel').length;
    
    // Calculate active/inactive ads based on ad data
    let activeAds = 0;
    let inactiveAds = 0;
    
    // Count active/inactive ads based on is_active field
    // Auto-tracker updates this field every 15 days using direct ad ID API
    ads.forEach((ad: any) => {
      try {
        const content = JSON.parse(ad.content);
        if (content.is_active === false) {
          inactiveAds++;
        } else {
          // Default to active (true or undefined means active)
          activeAds++;
        }
      } catch (e) {
        // If we can't parse content, assume active
        activeAds++;
      }
    });

    // Update brand with real statistics (exclude ads from response)
    const { ads: _, ...brandWithStats } = {
      ...brand,
      activeAds,
      inActiveAds: inactiveAds,
      noOfVideoAds: videoAds,
      noOfImageAds: imageAds,
      noOfGifAds: carouselAds, // Using carousel count for "gif" ads
      totalAds: ads.length, // Real count from database
      total_ads: ads.length,
    };

    return createResponse({
      message: messages.SUCCESS,
      payload: { brand: brandWithStats },
    });
  }
); 