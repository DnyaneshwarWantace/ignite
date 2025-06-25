import { NextRequest, NextResponse } from "next/server";
import prisma from "@prisma/index";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Debug brand API called with ID:', params.id);
    
    const brandId = params.id;
    
    // Validate brandId
    if (!brandId) {
      console.error('No brand ID provided');
      return NextResponse.json({
        error: "Brand ID is required",
      }, { status: 400 });
    }

    console.log('Attempting to fetch brand with ID:', brandId);
    
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
      console.log('Brand not found:', brandId);
      return NextResponse.json({
        error: "Brand not found",
        brandId,
      }, { status: 404 });
    }

    console.log('Brand found:', brand.name);

    // Parse a sample ad content to check structure
    let sampleAdContent = null;
    if (brand.ads.length > 0) {
      try {
        sampleAdContent = JSON.parse(brand.ads[0].content);
        console.log('Successfully parsed sample ad content');
      } catch (e) {
        console.error('Failed to parse ad content:', e);
        sampleAdContent = { error: "Failed to parse ad content" };
      }
    }

    const response = {
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
    };

    console.log('Successfully prepared response');
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in debug brand API:', error);
    return NextResponse.json({
      error: "Database error",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
} 