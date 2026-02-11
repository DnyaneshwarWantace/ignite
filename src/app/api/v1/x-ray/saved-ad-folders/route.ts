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

// GET - Fetch saved ad folders
export const GET = authMiddleware(
  async (request: NextRequest, _context: any, user: User) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const search = searchParams.get('search') || '';

      let query = supabase
        .from('saved_ad_folders')
        .select('*, saved_ads(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (search && search !== "") {
        query = query.ilike('name', `%${search}%`);
      }

      const { data: folders, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching saved ad folders:', fetchError);
        return createError({
          message: "Failed to fetch saved ad folders",
          payload: fetchError.message
        });
      }

      // Enrich each folder's saved ads with full ad data from ads table
      const enrichedFolders = await Promise.all(
        (folders || []).map(async (folder: any) => {
          if (folder.saved_ads && folder.saved_ads.length > 0) {
            const enrichedSavedAds = await Promise.all(
              folder.saved_ads.map(async (savedAd: any) => {
                const { data: actualAd, error: adError } = await supabase
                  .from('ads')
                  .select('id, local_image_url, local_video_url, content, image_url, video_url, type, headline, description, text, media_status, created_at, brand_id, brands(id, name, logo)')
                  .eq('id', savedAd.ad_id)
                  .single();

                if (adError) {
                  console.error(`Error fetching ad ${savedAd.ad_id}:`, adError);
                }

                let adData: Record<string, unknown> = {};
                try {
                  adData = JSON.parse(savedAd.ad_data || '{}');
                } catch {
                  // ignore invalid stored JSON
                }

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
                  text: actualAd?.text || adData.text,
                  mediaStatus: actualAd?.media_status || adData.mediaStatus || 'pending',
                  createdAt: actualAd?.created_at || adData.createdAt || savedAd.created_at,
                  brand: actualAd?.brands || adData.brand || null
                };

                return {
                  ...savedAd,
                  adData: JSON.stringify(mergedAdData)
                };
              })
            );

            return {
              ...folder,
              savedAds: enrichedSavedAds
            };
          }
          return folder;
        })
      );

      return createResponse({
        message: messages.SUCCESS,
        payload: {
          folders: enrichedFolders || []
        }
      });

    } catch (error) {
      console.error('Error fetching saved ad folders:', error);
      return createError({
        message: "Failed to fetch saved ad folders",
        payload: { error: (error as Error).message }
      });
    }
  }
);

// POST - Create a new saved ad folder
export const POST = authMiddleware(
  async (request: NextRequest, _context: any, user: User) => {
    try {
      let body;
      try {
        body = await request.json();
        console.log('Creating folder with body:', body);
      } catch (parseError) {
        console.error('Failed to parse request body:', parseError);
        return createError({
          message: "Invalid request body",
          status: 400
        });
      }
      
      const { name } = body;

      if (!name || name.trim() === '') {
        console.log('Folder name validation failed:', { name, body });
        return createError({
          message: "Folder name is required",
          status: 400
        });
      }

      // Check if folder with same name already exists for this user
      const { data: existingFolder, error: checkError } = await supabase
        .from('saved_ad_folders')
        .select('*')
        .eq('name', name.trim())
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (existingFolder && !checkError) {
        console.log('Folder already exists:', { name: name.trim(), userId: user.id });
        return createError({
          message: "A folder with this name already exists",
          status: 400
        });
      }

      const { data: folder, error: createFolderError } = await supabase
        .from('saved_ad_folders')
        .insert({
          name: name.trim(),
          user_id: user.id
        })
        .select()
        .single();

      if (createFolderError) {
        console.error('Error creating folder:', createFolderError);
        return createError({
          message: "Failed to create folder",
          payload: createFolderError.message
        });
      }

      console.log('Folder created successfully:', folder);

      return createResponse({
        message: "success",
        payload: {
          folder: folder
        }
      });

    } catch (error) {
      console.error('Error creating saved ad folder:', error);
      return createError({
        message: "Failed to create folder",
        payload: { error: (error as Error).message }
      });
    }
  }
); 