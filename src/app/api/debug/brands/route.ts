import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Conditionally import Prisma to avoid build issues
let prisma: any = null;
if (process.env.DATABASE_URL) {
  try {
    prisma = require("@prisma/index").default;
  } catch (error) {
    console.warn("Failed to load Prisma in debug brands route:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Skip database operations if Prisma is not available
    if (!prisma) {
      return NextResponse.json({
        error: "Database not available during build",
        brands: [],
        totalBrands: 0,
      }, { status: 503 });
    }

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