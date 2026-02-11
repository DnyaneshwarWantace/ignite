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

async function getDnaAndCheckUser(id: string, userId: string) {
  const { data, error } = await supabase
    .from("ai_writer_dnas")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (error || !data) return null;
  return data;
}

/** GET - get one DNA */
export const GET = authMiddleware(
  async (_request: NextRequest, context: any, user: User) => {
    try {
      const id = context.params?.id as string;
      if (!id) return createError({ message: "ID required", status: 400 });
      const dna = await getDnaAndCheckUser(id, user.id);
      if (!dna) return createError({ message: "DNA not found", status: 404 });
      return createResponse({ payload: dna, message: "OK" });
    } catch (e: any) {
      return createError({ message: e.message || "Failed to get DNA", status: 500 });
    }
  }
);

/** PATCH - update DNA (name, is_default) */
export const PATCH = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      const id = context.params?.id as string;
      if (!id) return createError({ message: "ID required", status: 400 });
      const dna = await getDnaAndCheckUser(id, user.id);
      if (!dna) return createError({ message: "DNA not found", status: 404 });

      const body = await request.json();
      const updates: Record<string, unknown> = {};
      if (typeof body.name === "string") updates.name = body.name.trim();
      if (typeof body.is_default === "boolean") {
        updates.is_default = body.is_default;
        if (body.is_default) {
          await supabase
            .from("ai_writer_dnas")
            .update({ is_default: false })
            .eq("user_id", user.id)
            .neq("id", id);
        }
      }
      if (Object.keys(updates).length === 0) return createResponse({ payload: dna, message: "OK" });

      const { data, error } = await supabase
        .from("ai_writer_dnas")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      return createResponse({ payload: data, message: "Updated" });
    } catch (e: any) {
      return createError({ message: e.message || "Failed to update DNA", status: 500 });
    }
  }
);

/** DELETE - delete DNA (cascade deletes sections) */
export const DELETE = authMiddleware(
  async (_request: NextRequest, context: any, user: User) => {
    try {
      const id = context.params?.id as string;
      if (!id) return createError({ message: "ID required", status: 400 });
      const dna = await getDnaAndCheckUser(id, user.id);
      if (!dna) return createError({ message: "DNA not found", status: 404 });

      const { error } = await supabase.from("ai_writer_dnas").delete().eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      return createResponse({ payload: { id }, message: "Deleted" });
    } catch (e: any) {
      return createError({ message: e.message || "Failed to delete DNA", status: 500 });
    }
  }
);
