import messages from "@apiUtils/messages";
import { createError, createResponse } from "@apiUtils/responseutils";
import statuscodes from "@apiUtils/statuscodes";
import { authMiddleware } from "@middleware";
import { supabase } from "@/lib/supabase";
import { NextRequest } from "next/server";
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
  async (
    request: NextRequest,
    { params }: { params: { folderId: string } },
    user: User
  ) => {
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', params.folderId)
      .eq('user_id', user.id)
      .single();

    if (folderError || !folder) {
      return createError({
        message: messages.NOT_FOUND,
      });
    }

    return createResponse({
      message: messages.SUCCESS,
      payload: { folder },
    });
  }
);

export const DELETE = authMiddleware(
  async (
    request: NextRequest,
    { params }: { params: { folderId: string } },
    user: User
  ) => {
    const { error: deleteError } = await supabase
      .from('folders')
      .delete()
      .eq('id', params.folderId)
      .eq('user_id', user.id);

    if (deleteError) {
      return createError({
        message: "Failed to delete folder",
        payload: deleteError.message,
      });
    }

    return createResponse({
      message: messages.SUCCESS,
      payload: {},
    });
  }
);

export const PATCH = authMiddleware(
  async (
    request: NextRequest,
    { params }: { params: { folderId: string } },
    user: User
  ) => {
    const { error, value } = validation.patch.validate(await request.json());
    if (error) {
      return createError({
        message: messages.VALIDATION_ERROR,
        payload: error.details,
      });
    }

    let { name } = value;

    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', params.folderId)
      .single();

    if (folderError || !folder) {
      return createError({
        message: messages.NOT_FOUND,
        status: statuscodes.NOT_FOUND,
      });
    }

    let updatedFolder = folder;
    if (name && name !== "") {
      const { data, error: updateError } = await supabase
        .from('folders')
        .update({ name })
        .eq('id', params.folderId)
        .select()
        .single();

      if (updateError) {
        return createError({
          message: "Failed to update folder",
          payload: updateError.message,
        });
      }
      updatedFolder = data;
    }

    return createResponse({
      message: messages.SUCCESS,
      payload: {
        folder: updatedFolder,
      },
    });
  }
);
