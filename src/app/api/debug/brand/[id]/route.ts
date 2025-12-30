import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Force route to be dynamic and prevent static optimization
export const dynamic = "force-dynamic";
export const runtime = "edge";
export const preferredRegion = "auto";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const brandId = params.id;
    
    // Check if brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        ads: {
          take: 5, // Just get first 5 ads for debugging
        },
      },
    });

    if (!brand) {
      return NextResponse.json({
        error: "Brand not found",
        brandId,
      }, { status: 404 });
    }

    // Parse a sample ad content to check structure
    let sampleAdContent = null;
    if (brand.ads.length > 0) {
      try {
        sampleAdContent = JSON.parse(brand.ads[0].content);
      } catch (e) {
        sampleAdContent = { error: "Failed to parse ad content" };
      }
    }

    return NextResponse.json({
      brand: {
        id: brand.id,
        name: brand.name,
        logo: brand.logo,
        pageId: brand.pageId,
        totalAds: brand.ads.length,
      },
      sampleAd: brand.ads[0] || null,
      sampleAdContent,
      adsCount: brand.ads.length,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: "Database error",
      message: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
} 