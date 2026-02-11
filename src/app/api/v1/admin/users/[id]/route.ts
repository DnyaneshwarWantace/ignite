import { createResponse, createError } from "@apiUtils/responseutils";
import { requireAdmin } from "../../requireAdmin";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** GET - single user with usage summary (admin only) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id } = await params;
  if (!id) return createError({ message: "User ID required", status: 400 });

  try {
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, name, email, image, is_admin, created_at, updated_at")
      .eq("id", id)
      .single();

    if (userError || !user) {
      return createError({ message: "User not found", status: 404 });
    }

    const { data: usageRows } = await supabaseAdmin
      .from("api_usage_log")
      .select("feature, endpoint, metadata, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: usageByFeature } = await supabaseAdmin
      .from("api_usage_log")
      .select("feature")
      .eq("user_id", id);

    const featureCounts: Record<string, number> = {};
    (usageByFeature ?? []).forEach((r: { feature: string }) => {
      featureCounts[r.feature] = (featureCounts[r.feature] || 0) + 1;
    });

    const { count: dnasCount } = await supabaseAdmin
      .from("ai_writer_dnas")
      .select("id", { count: "exact", head: true })
      .eq("user_id", id);

    const { count: createdAdsCount } = await supabaseAdmin
      .from("created_ads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", id);

    const { count: savedAdsCount } = await supabaseAdmin
      .from("saved_ads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", id);

    const { count: foldersCount } = await supabaseAdmin
      .from("folders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", id);

    return createResponse({
      payload: {
        user,
        usage: {
          recent: usageRows ?? [],
          byFeature: featureCounts,
          totalEvents: usageByFeature?.length ?? 0,
        },
        counts: {
          dnas: dnasCount ?? 0,
          createdAds: createdAdsCount ?? 0,
          savedAds: savedAdsCount ?? 0,
          folders: foldersCount ?? 0,
        },
      },
      message: "OK",
    });
  } catch (e: any) {
    return createError({ message: e.message || "Failed to get user", status: 500 });
  }
}
