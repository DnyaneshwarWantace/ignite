import { NextRequest } from "next/server";
import { authMiddleware } from "@middleware";
import { createResponse, createError } from "@apiUtils/responseutils";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email?: string;
  name?: string;
}

export const dynamic = "force-dynamic";

const LIMIT = 100;

/** GET - list agent history for the logged-in user, optional filter by agentId */
export const GET = authMiddleware(
  async (request: NextRequest, _context: any, user: User) => {
    try {
      const agentId = request.nextUrl.searchParams.get("agentId");

      let query = supabase
        .from("ai_writer_agent_history")
        .select("id, agent_id, agent_name, content, dna_id, metadata, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(LIMIT);

      if (agentId) {
        query = query.eq("agent_id", agentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const items = (data ?? []).map((row: any) => ({
        id: row.id,
        agentId: row.agent_id,
        agentName: row.agent_name,
        content: row.content,
        dnaId: row.dna_id,
        metadata: row.metadata,
        timestamp: new Date(row.created_at).getTime(),
      }));

      return createResponse({ payload: items, message: "OK" });
    } catch (e: any) {
      return createError({ message: e.message || "Failed to list history", status: 500 });
    }
  }
);

/** POST - save one agent response to history */
export const POST = authMiddleware(
  async (request: NextRequest, _context: any, user: User) => {
    try {
      const body = await request.json();
      const { agentId, agentName, content, dnaId, metadata } = body;

      if (!agentId || content == null) {
        return createError({ message: "agentId and content are required", status: 400 });
      }

      const { data, error } = await supabase
        .from("ai_writer_agent_history")
        .insert({
          user_id: user.id,
          agent_id: agentId,
          agent_name: agentName ?? null,
          content: String(content),
          dna_id: dnaId ?? null,
          metadata: metadata ?? null,
        })
        .select("id, created_at")
        .single();

      if (error) throw error;

      return createResponse({
        payload: {
          id: data.id,
          timestamp: new Date(data.created_at).getTime(),
        },
        message: "Saved",
      });
    } catch (e: any) {
      return createError({ message: e.message || "Failed to save history", status: 500 });
    }
  }
);
