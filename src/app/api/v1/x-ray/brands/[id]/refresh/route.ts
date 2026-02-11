import messages from "@apiUtils/messages";
import { createError, createResponse } from "@apiUtils/responseutils";
import { authMiddleware } from "@middleware";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { scrapeCompanyAds } from "@apiUtils/adScraper";
import { getUserApiKey } from "@/lib/user-api-keys";

// Type definition for User (matching Supabase schema)
interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export const dynamic = "force-dynamic";

export const POST = authMiddleware(
  async (request: NextRequest, response: NextResponse, user: User, { params }: { params: { id: string } }) => {
    const brandId = params.id;

    // Fetch brand
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

    if (!brand.page_id) {
      return createError({
        message: "Brand does not have a pageId. Cannot refresh analytics.",
      });
    }

    try {
      console.log(`Refreshing analytics for brand ${brand.name} (pageId: ${brand.page_id})`);

      // Fetch user's ScrapeCreators key (falls back to env inside scraper)
      const userScrapeKey = await getUserApiKey(user.id, 'scrape_creators');

      // Scrape fresh ads from the page - get up to 3000 ads for comprehensive analytics
      const scrapedAds = await scrapeCompanyAds(brand.page_id, 3000, 0, userScrapeKey || undefined);
      
      if (scrapedAds.length === 0) {
        return createError({
          message: "No ads found for this brand. The page might not have any active ads.",
        });
      }

      console.log(`Found ${scrapedAds.length} ads for ${brand.name}`);

      // Save new ads to database (skip duplicates)
      let newAdsCount = 0;
      for (const scrapedAd of scrapedAds) {
        try {
          // Check if ad already exists
          const { data: existingAd, error: checkError } = await supabase
            .from('ads')
            .select('*')
            .eq('library_id', scrapedAd.id)
            .single();

          if (!existingAd || checkError) {
            const { error: insertError } = await supabase
              .from('ads')
              .insert({
                library_id: scrapedAd.id,
                type: scrapedAd.type,
                content: scrapedAd.content,
                image_url: scrapedAd.imageUrl,
                video_url: scrapedAd.videoUrl,
                text: scrapedAd.text,
                headline: scrapedAd.headline,
                description: scrapedAd.description,
                brand_id: brand.id,
                media_status: 'pending',
              });

            if (!insertError) {
              newAdsCount++;
            } else {
              console.error(`Error inserting ad ${scrapedAd.id}:`, insertError);
            }
          } else {
            // Update existing ad with fresh data
            await supabase
              .from('ads')
              .update({
                content: scrapedAd.content, // Update content to get latest status
                image_url: scrapedAd.imageUrl,
                video_url: scrapedAd.videoUrl,
                text: scrapedAd.text,
                headline: scrapedAd.headline,
                description: scrapedAd.description,
              })
              .eq('library_id', scrapedAd.id);
          }
        } catch (adError) {
          console.error(`Error saving/updating ad ${scrapedAd.id}:`, adError);
          // Continue with other ads even if one fails
        }
      }

      // Update brand's total ads count with actual count from database
      const { count: totalAdsInDb, error: countError } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', brand.id);

      await supabase
        .from('brands')
        .update({ total_ads: totalAdsInDb || 0 })
        .eq('id', brand.id);

      // Trigger media worker so uploads to Supabase Storage start right away (don't wait)
      const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      fetch(`${baseUrl}/api/v1/media/process?batch=15`, { method: 'GET' }).catch(() => {});

      // Calculate fresh statistics
      const { data: allAds, error: adsError } = await supabase
        .from('ads')
        .select('*')
        .eq('brand_id', brand.id);

      if (!allAds || adsError) {
        return createError({
          message: "Failed to fetch ads for statistics",
        });
      }

      const videoAds = allAds.filter((ad: any) => ad.type === 'video').length;
      const imageAds = allAds.filter((ad: any) => ad.type === 'image').length;
      const carouselAds = allAds.filter((ad: any) => ad.type === 'carousel').length;
      
      let activeAds = 0;
      let inactiveAds = 0;
      
      allAds.forEach((ad: any) => {
        try {
          const content = JSON.parse(ad.content);
          if (content.is_active === true) {
            activeAds++;
          } else if (content.is_active === false) {
            inactiveAds++;
          } else {
            // If status is unknown, assume active for recently scraped ads
            activeAds++;
          }
        } catch (e) {
          // If we can't parse content, assume active
          activeAds++;
        }
      });

      return createResponse({
        message: messages.SUCCESS,
        payload: {
          brand: brand.name,
          totalAdsScraped: scrapedAds.length,
          newAdsAdded: newAdsCount,
          totalAdsInDatabase: totalAdsInDb,
          analytics: {
            activeAds,
            inactiveAds,
            videoAds,
            imageAds,
            carouselAds,
          },
        },
      });

    } catch (error: any) {
      console.error("Error refreshing brand analytics:", error);
      return createError({
        message: "Failed to refresh brand analytics. Please try again.",
        payload: { error: error.message },
      });
    }
  }
); 