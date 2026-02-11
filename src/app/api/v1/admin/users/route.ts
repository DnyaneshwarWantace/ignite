import { createResponse, createError } from "@apiUtils/responseutils";
import { requireAdmin } from "../requireAdmin";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** GET - list all users (admin only). Query: page, limit, search */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = (searchParams.get("search") || "").trim().replace(/'/g, "''");

    let query = supabaseAdmin
      .from("users")
      .select("id, name, email, image, is_admin, created_at, updated_at", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const { data: users, error, count } = await query.range(from, from + limit - 1);

    if (error) throw error;

    return createResponse({
      payload: users ?? [],
      pagination: { page, limit, total: count ?? 0 },
      message: "OK",
    });
  } catch (e: any) {
    return createError({ message: e.message || "Failed to list users", status: 500 });
  }
}
