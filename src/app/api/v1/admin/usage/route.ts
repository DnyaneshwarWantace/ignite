import { createResponse, createError } from "@apiUtils/responseutils";
import { requireAdmin } from "../requireAdmin";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** GET - aggregate usage stats (admin only). Query: from, to (ISO date), feature */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    const feature = searchParams.get("feature") || undefined;

    let query = supabaseAdmin
      .from("api_usage_log")
      .select("id, user_id, feature, endpoint, created_at");

    if (fromDate) query = query.gte("created_at", fromDate);
    if (toDate) query = query.lte("created_at", toDate + "T23:59:59.999Z");
    if (feature) query = query.eq("feature", feature);

    const { data: logs, error } = await query.order("created_at", { ascending: false }).limit(500);

    if (error) throw error;

    const byFeature: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    (logs ?? []).forEach((r: { feature: string; user_id: string }) => {
      byFeature[r.feature] = (byFeature[r.feature] || 0) + 1;
      byUser[r.user_id] = (byUser[r.user_id] || 0) + 1;
    });

    const { count: totalUsers } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true });

    const { count: totalEvents } = await supabaseAdmin
      .from("api_usage_log")
      .select("id", { count: "exact", head: true });

    return createResponse({
      payload: {
        summary: {
          totalUsers: totalUsers ?? 0,
          totalUsageEvents: totalEvents ?? 0,
        },
        byFeature,
        byUser: Object.entries(byUser)
          .map(([userId, count]) => ({ userId, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 50),
        recent: (logs ?? []).slice(0, 100),
      },
      message: "OK",
    });
  } catch (e: any) {
    return createError({ message: e.message || "Failed to get usage", status: 500 });
  }
}
