import { authMiddleware } from "@middleware";
import { createResponse, createError } from "@apiUtils/responseutils";
import { supabase } from "@/lib/supabase";
import { NextRequest } from "next/server";

interface User {
  id: string;
  email: string;
  name?: string;
}

export const dynamic = "force-dynamic";

/** GET - list all DNAs for the logged-in user */
export const GET = authMiddleware(
  async (_request: NextRequest, _context: any, user: User) => {
    try {
      const { data, error } = await supabase
        .from("ai_writer_dnas")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return createResponse({ payload: data ?? [], message: "OK" });
    } catch (e: any) {
      return createError({ message: e.message || "Failed to list DNAs", status: 500 });
    }
  }
);

/** POST - create a new DNA */
export const POST = authMiddleware(
  async (request: NextRequest, _context: any, user: User) => {
    try {
      const body = await request.json();
      const name = (body.name as string)?.trim() || "Untitled DNA";

      const { data, error } = await supabase
        .from("ai_writer_dnas")
        .insert({
          user_id: user.id,
          name,
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;
      return createResponse({ payload: data, message: "Created" });
    } catch (e: any) {
      return createError({ message: e.message || "Failed to create DNA", status: 500 });
    }
  }
);
