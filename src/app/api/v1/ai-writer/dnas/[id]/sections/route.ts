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

async function ensureDnaOwnership(dnaId: string, userId: string) {
  const { data } = await supabase
    .from("ai_writer_dnas")
    .select("id")
    .eq("id", dnaId)
    .eq("user_id", userId)
    .single();
  return !!data;
}

/** GET - list all sections for a DNA */
export const GET = authMiddleware(
  async (_request: NextRequest, context: any, user: User) => {
    try {
      const dnaId = context.params?.id as string;
      if (!dnaId) return createError({ message: "DNA ID required", status: 400 });
      const allowed = await ensureDnaOwnership(dnaId, user.id);
      if (!allowed) return createError({ message: "DNA not found", status: 404 });

      const { data, error } = await supabase
        .from("ai_writer_dna_sections")
        .select("*")
        .eq("dna_id", dnaId);

      if (error) throw error;
      return createResponse({ payload: data ?? [], message: "OK" });
    } catch (e: any) {
      return createError({ message: e.message || "Failed to list sections", status: 500 });
    }
  }
);

/** PUT - upsert one section (body: { section_id, content?, completed? }) */
export const PUT = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      const dnaId = context.params?.id as string;
      if (!dnaId) return createError({ message: "DNA ID required", status: 400 });
      const allowed = await ensureDnaOwnership(dnaId, user.id);
      if (!allowed) return createError({ message: "DNA not found", status: 404 });

      const body = await request.json();
      const sectionId = body.section_id as string;
      if (!sectionId) return createError({ message: "section_id required", status: 400 });

      const payload = {
        dna_id: dnaId,
        section_id: sectionId,
        content: typeof body.content === "string" ? body.content : "",
        completed: Boolean(body.completed),
        last_edit: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("ai_writer_dna_sections")
        .upsert(payload, { onConflict: "dna_id,section_id" })
        .select()
        .single();

      if (error) throw error;
      return createResponse({ payload: data, message: "Saved" });
    } catch (e: any) {
      return createError({ message: e.message || "Failed to save section", status: 500 });
    }
  }
);
