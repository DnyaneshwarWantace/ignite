import { convertURLSearchParamsToObject } from "@apiUtils/helpers";
import messages from "@apiUtils/messages";
import { createError, createResponse } from "@apiUtils/responseutils";
import { authMiddleware } from "@middleware";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import validation from "./validation";

// Type definition for User (matching Supabase schema)
interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export const dynamic = "force-dynamic";

export const GET = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    // Validate
    const searchParams = request.nextUrl.searchParams;
    const { error, value } = validation.get.validate(
      convertURLSearchParamsToObject(searchParams)
    );
    if (error) {
      return createError({
        message: messages.VALIDATION_ERROR,
        payload: error.details,
      });
    }
    const { search } = value;

    // Fetch all folders with brands and ads
    let supabaseQuery = supabase
      .from('folders')
      .select(`
        *,
        brands (
          *,
          ads (*)
        )
      `)
      .eq('user_id', user.id);

    if (search && search !== "") {
      supabaseQuery = supabaseQuery.ilike('name', `%${search}%`);
    }

    let { data: allFolders, error: fetchError } = await supabaseQuery;

    if (fetchError) {
      console.error("Error fetching folders:", fetchError);
      return createError({
        message: "Failed to fetch folders",
        payload: fetchError.message,
      });
    }

    // In development mode, if no folders found for mock user, get all folders
    if (process.env.NODE_ENV === "development" && user.id === "dev-user" && (!allFolders || allFolders.length === 0)) {
      console.log("Development mode: No folders for mock user, fetching all folders");
      const { data, error: devError } = await supabase
        .from('folders')
        .select(`
          *,
          brands (
            *,
            ads (*)
          )
        `);

      if (!devError) {
        allFolders = data;
      }
    }

    if (!allFolders) {
      allFolders = [];
    }

    // Calculate real statistics for each brand
    allFolders.map((folder: any) => {
      folder.brands = folder.brands.map((brand: any) => {
        const ads = brand.ads || [];
        
        // Extract brand logo from first ad before removing ads array
        if (!brand.logo || brand.logo.includes('placeholder') || brand.logo.includes('freepik')) {
          if (ads.length > 0) {
            const firstAd = ads[0];
            if (firstAd.content) {
              try {
                const content = JSON.parse(firstAd.content);
                const snapshot = content.snapshot || {};
                const brandedContent = snapshot.branded_content || {};
                
                const profilePicture = snapshot.page_profile_picture_url || 
                                     brandedContent.page_profile_pic_url ||
                                     snapshot.profile_picture_url ||
                                     content.page_profile_picture_url;
                
                if (profilePicture) {
                  brand.logo = profilePicture;
                }
              } catch (e) {
                console.error('Error parsing ad content for brand logo:', e);
              }
            }
          }
        }
        
        // Count ads by type
        const videoAds = ads.filter((ad: any) => ad.type === 'video').length;
        const imageAds = ads.filter((ad: any) => ad.type === 'image').length;
        const carouselAds = ads.filter((ad: any) => ad.type === 'carousel').length;
        
        // Calculate active/inactive ads based on ad data
        let activeAds = 0;
        let inactiveAds = 0;
        
        ads.forEach((ad: any) => {
          try {
            const content = JSON.parse(ad.content);
            // Check if ad is active based on ScrapeCreators API format
            // Try multiple possible field names for active status
            const isActive = content.is_active ?? content.active ?? content.status === 'active' ?? 
                           content.ad_delivery_status === 'active' ?? content.delivery_status === 'active';
            
            if (isActive === true) {
              activeAds++;
            } else if (isActive === false) {
              inactiveAds++;
            } else {
              // Check if ad has end_date to determine if it's inactive
              const endDate = content.end_date || content.end_date_string;
              const startDate = content.start_date || content.start_date_string;
              
              if (endDate) {
                const endDateTime = new Date(endDate).getTime();
                const now = Date.now();
                if (endDateTime < now) {
                  inactiveAds++;
                } else {
                  activeAds++;
                }
              } else if (startDate) {
                // If no end date but has start date, consider it active if recent
                const startDateTime = new Date(startDate).getTime();
                const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                if (startDateTime > thirtyDaysAgo) {
                  activeAds++;
                } else {
                  inactiveAds++;
                }
              } else {
                // If no date info, assume active for recently scraped ads
                activeAds++;
              }
            }
          } catch (e) {
            // If we can't parse content, assume active
            activeAds++;
          }
        });
        
        // Update brand with real statistics
        brand["activeAds"] = activeAds;
        brand["inActiveAds"] = inactiveAds;
        brand["noOfVideoAds"] = videoAds;
        brand["noOfImageAds"] = imageAds;
        brand["noOfGifAds"] = carouselAds; // Using carousel count for "gif" ads
        
        // Remove ads from response to keep it clean
        delete brand.ads;
        
        return brand;
      });
      return folder;
    });

    return createResponse({
      message: messages.SUCCESS,
      payload: { folders: allFolders },
    });
  }
);

export const POST = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    const { error, value } = validation.post.validate(await request.json());
    if (error) {
      return createError({
        message: messages.VALIDATION_ERROR,
        payload: error.details,
      });
    }

    let { name } = value;

    // Create new folder
    const { data: newFolder, error: insertError } = await supabase
      .from('folders')
      .insert({
        name,
        user_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating folder:", insertError);
      return createError({
        message: "Failed to create folder",
        payload: insertError.message,
      });
    }

    return createResponse({
      message: messages.SUCCESS,
      payload: {
        folder: newFolder,
      },
    });
  }
);
