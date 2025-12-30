import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@middleware";
import { createResponse, createError } from "@apiUtils/responseutils";
import messages from "@apiUtils/messages";
import { supabase } from "@/lib/supabase";

// Type definition for User (matching Supabase schema)
interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export const dynamic = "force-dynamic";

// GET - Fetch saved ads
export const GET = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const folderId = searchParams.get('folderId');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      let whereClause: any = {
        userId: user.id
      };

      // If folderId is provided, filter by folder
      if (folderId && folderId !== '0' && folderId !== 'all') {
        whereClause.folderId = folderId;
      } else if (folderId === '0') {
        // Default folder - saved ads not in any specific folder
        whereClause.folderId = null;
      }
      // If folderId is 'all', don't apply any folder filter - show all saved ads

      // Build Supabase query with proper filters
      let query = supabase
        .from('saved_ads')
        .select('*, folder:saved_ad_folders(*)', { count: 'exact' })
        .eq('user_id', user.id);

      // If folderId is provided, filter by folder
      if (folderId && folderId !== '0' && folderId !== 'all') {
        query = query.eq('folder_id', folderId);
      } else if (folderId === '0') {
        // Default folder - saved ads not in any specific folder
        query = query.is('folder_id', null);
      }
      // If folderId is 'all', don't apply any folder filter

      // Execute query with pagination
      const { data: savedAds, error: savedAdsError, count: totalCount } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (savedAdsError) {
        console.error('Error fetching saved ads:', savedAdsError);
        return createError({
          message: "Failed to fetch saved ads",
          payload: { error: savedAdsError.message }
        });
      }

      // Fetch actual ad data for each saved ad to get Supabase URLs
      const savedAdsWithFullData = await Promise.all(
        (savedAds || []).map(async (savedAd: any) => {
          const { data: actualAd, error: adError } = await supabase
            .from('ads')
            .select('id, local_image_url, local_video_url, content, image_url, video_url, type, headline, description, text')
            .eq('id', savedAd.ad_id)
            .single();

          if (adError) {
            console.error(`Error fetching ad ${savedAd.ad_id}:`, adError);
          }

          // Merge saved ad data with actual ad data
          const adData = JSON.parse(savedAd.ad_data || '{}');
          const mergedAdData = {
            ...adData,
            id: savedAd.ad_id,
            localImageUrl: actualAd?.local_image_url,
            localVideoUrl: actualAd?.local_video_url,
            content: actualAd?.content || adData.content,
            imageUrl: actualAd?.image_url || adData.imageUrl,
            videoUrl: actualAd?.video_url || adData.videoUrl,
            type: actualAd?.type || adData.type,
            headline: actualAd?.headline || adData.headline,
            description: actualAd?.description || adData.description,
            text: actualAd?.text || adData.text
          };

          return {
            id: savedAd.id,
            adId: savedAd.ad_id,
            userId: savedAd.user_id,
            folderId: savedAd.folder_id,
            createdAt: new Date(savedAd.created_at),
            folder: savedAd.folder,
            adData: JSON.stringify(mergedAdData)
          };
        })
      );

      return createResponse({
        message: messages.SUCCESS,
        payload: {
          ads: savedAdsWithFullData,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching saved ads:', error);
      return createError({
        message: "Failed to fetch saved ads",
        payload: { error: (error as Error).message }
      });
    }
  }
);

// POST - Save an ad to a folder
export const POST = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      const { adId, folderId, adData } = await request.json();

      if (!adId) {
        return createError({
          message: "Ad ID is required"
        });
      }

      // Check if ad is already saved
      const { data: existingSavedAd, error: checkError } = await supabase
        .from('saved_ads')
        .select('*')
        .eq('ad_id', adId)
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (existingSavedAd && !checkError) {
        return createError({
          message: "Ad is already saved"
        });
      }

      // If folderId is provided and not '0', verify the folder exists
      let folderToUse = null;
      if (folderId && folderId !== '0') {
        const { data: folder, error: folderError } = await supabase
          .from('saved_ad_folders')
          .select('*')
          .eq('id', folderId)
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (folderError || !folder) {
          return createError({
            message: "Folder not found"
          });
        }
        folderToUse = folder;
      }

      // Save the ad
      const { data: savedAd, error: saveError } = await supabase
        .from('saved_ads')
        .insert({
          ad_id: adId,
          ad_data: adData || JSON.stringify({}),
          folder_id: folderToUse?.id || null,
          user_id: user.id
        })
        .select('*, folder:saved_ad_folders(*)')
        .single();

      if (saveError) {
        console.error('Error saving ad:', saveError);
        return createError({
          message: "Failed to save ad",
          payload: { error: saveError.message }
        });
      }

      return createResponse({
        message: "Ad saved successfully",
        payload: {
          savedAd: savedAd,
          folderId: folderToUse?.id || '0'
        }
      });

    } catch (error) {
      console.error('Error saving ad:', error);
      return createError({
        message: "Failed to save ad",
        payload: { error: (error as Error).message }
      });
    }
  }
); 