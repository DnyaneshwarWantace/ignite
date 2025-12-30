import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get all brands with basic info
    const brands = await prisma.brand.findMany({
      include: {
        ads: {
          select: {
            id: true,
            type: true,
            createdAt: true,
          },
        },
      },
    });

    const brandsWithStats = brands.map((brand) => {
      const ads = brand.ads || [];
      
      // Count ads by type
      const videoAds = ads.filter((ad: any) => ad.type === 'video').length;
      const imageAds = ads.filter((ad: any) => ad.type === 'image').length;
      const carouselAds = ads.filter((ad: any) => ad.type === 'carousel').length;
      
      return {
        id: brand.id,
        name: brand.name,
        logo: brand.logo,
        pageId: brand.pageId,
        totalAds: ads.length,
        videoAds,
        imageAds,
        carouselAds,
        createdAt: brand.createdAt,
      };
    });

    return NextResponse.json({
      brands: brandsWithStats,
      totalBrands: brands.length,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: "Database error",
      message: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
} 