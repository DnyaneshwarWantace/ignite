import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Conditionally import Prisma to avoid build issues
let prisma: any = null;
if (process.env.DATABASE_URL) {
  try {
    prisma = require("@prisma/index").default;
  } catch (error) {
    console.warn("Failed to load Prisma in debug route:", error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const brandId = params.id;
    
    // Skip database operations if Prisma is not available
    if (!prisma) {
      return NextResponse.json({
        error: "Database not available during build",
        brandId,
      }, { status: 503 });
    }
    
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