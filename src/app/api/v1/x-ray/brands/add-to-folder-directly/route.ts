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

export const POST = authMiddleware(
  async (request: NextRequest, response: NextResponse, user: User) => {
    const { error, value } = validation.post.validate(await request.json());
    if (error) {
      return createError({
        message: messages.VALIDATION_ERROR,
        payload: error.details,
      });
    }

    let { folderId, brandIds } = value;
    let targetFolder = null;

    // Handle default folder when folder id is 0
    if (folderId === "0") {
      // First, try to find an existing "Default" folder for this user
      const { data: existingFolder, error: findError } = await supabase
        .from('folders')
        .select('*')
        .eq('name', 'Default')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (existingFolder && !findError) {
        targetFolder = existingFolder;
        console.log("Using existing Default folder:", targetFolder.id);
      } else {
        // If no default folder exists, create one
        const { data: newFolder, error: createFolderError } = await supabase
          .from('folders')
          .insert({
            name: "Default",
            user_id: user.id,
          })
          .select()
          .single();

        if (createFolderError) {
          return createError({
            message: "Failed to create default folder",
            payload: createFolderError.message,
          });
        }
        targetFolder = newFolder;
        console.log("Created new Default folder for user:", user.id);
      }
    }

    // Fetch folder
    if (folderId !== "0") {
      const { data: folder, error: folderError } = await supabase
        .from('folders')
        .select('*')
        .eq('id', folderId)
        .eq('user_id', user.id)
        .single();

      if (folderError || !folder) {
        return createError({
          message: messages.FOLDER_NOT_FOUND,
        });
      }
      targetFolder = folder;
    }

    // Fetch brands
    const { data: targetBrands, error: brandsError } = await supabase
      .from('brands')
      .select('*')
      .in('id', brandIds);

    if (brandsError || !targetBrands) {
      return createError({
        message: "Failed to fetch brands",
        payload: brandsError?.message,
      });
    }

    // Add brands to folder (many-to-many relation)
    for (const brand of targetBrands) {
      // Check if brand already exists in folder
      const { data: existingConnection, error: checkError } = await supabase
        .from('_BrandToFolder')
        .select('*')
        .eq('A', brand.id)
        .eq('B', targetFolder?.id)
        .single();

      if (!existingConnection || checkError) {
        // Connection doesn't exist, create it
        const { error: insertError } = await supabase
          .from('_BrandToFolder')
          .insert({
            A: brand.id,
            B: targetFolder?.id
          });

        if (insertError && !insertError.message.includes('duplicate')) {
          console.error('Error connecting brand to folder:', insertError);
        }
      }
    }

    return createResponse({
      message: messages.SUCCESS,
      payload: {
        folder: targetFolder,
        brands: targetBrands,
      },
    });
  }
);
