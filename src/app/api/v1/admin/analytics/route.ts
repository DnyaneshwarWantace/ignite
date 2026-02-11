import { createResponse, createError } from "@apiUtils/responseutils";
import { requireAdmin } from "../requireAdmin";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** GET - API keys + scraping analytics (admin only) */
export async function GET(_request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { data: keys, error: keysError } = await supabaseAdmin
      .from("user_api_keys")
      .select("user_id, provider, metadata");

    if (keysError) throw keysError;

    const rows = (keys ?? []) as { user_id: string; provider: string; metadata?: { model?: string } | null }[];

    const usersWithKeys = new Set(rows.map((r) => r.user_id)).size;
    const byProvider: Record<string, number> = {};
    const modelCounts: Record<string, number> = {};

    rows.forEach((r) => {
      byProvider[r.provider] = (byProvider[r.provider] || 0) + 1;
      if (r.provider === "llm" && r.metadata?.model) {
        const model = String(r.metadata.model).trim() || "unknown";
        modelCounts[model] = (modelCounts[model] || 0) + 1;
      }
    });

    const topModels = Object.entries(modelCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([model, count]) => ({ model, count }));

    const { count: totalAds } = await supabaseAdmin
      .from("ads")
      .select("id", { count: "exact", head: true });

    const { count: totalBrands } = await supabaseAdmin
      .from("brands")
      .select("id", { count: "exact", head: true });

    const { data: folders } = await supabaseAdmin
      .from("folders")
      .select("id, user_id");
    const folderIdsByUser: Record<string, string[]> = {};
    (folders ?? []).forEach((f: { id: string; user_id: string }) => {
      if (!folderIdsByUser[f.user_id]) folderIdsByUser[f.user_id] = [];
      folderIdsByUser[f.user_id].push(f.id);
    });

    const { data: brandFolders } = await supabaseAdmin
      .from("brand_folders")
      .select("folder_id, brand_id");
    const folderToBrands: Record<string, string[]> = {};
    (brandFolders ?? []).forEach((bf: { folder_id: string; brand_id: string }) => {
      if (!folderToBrands[bf.folder_id]) folderToBrands[bf.folder_id] = [];
      folderToBrands[bf.folder_id].push(bf.brand_id);
    });

    const userBrandIds: Record<string, Set<string>> = {};
    Object.entries(folderIdsByUser).forEach(([userId, fIds]) => {
      const set = new Set<string>();
      fIds.forEach((fid) => (folderToBrands[fid] || []).forEach((bid) => set.add(bid)));
      userBrandIds[userId] = set;
    });

    const { data: adsRows } = await supabaseAdmin
      .from("ads")
      .select("brand_id");
    const adsByBrand: Record<string, number> = {};
    (adsRows ?? []).forEach((a: { brand_id: string }) => {
      adsByBrand[a.brand_id] = (adsByBrand[a.brand_id] || 0) + 1;
    });

    const adsPerUser: { userId: string; adsCount: number; brandsCount: number }[] = [];
    Object.entries(userBrandIds).forEach(([userId, brandSet]) => {
      const brandsCount = brandSet.size;
      let adsCount = 0;
      brandSet.forEach((bid) => {
        adsCount += adsByBrand[bid] || 0;
      });
      adsPerUser.push({ userId, adsCount, brandsCount });
    });
    adsPerUser.sort((a, b) => b.adsCount - a.adsCount);

    const providerLabels: Record<string, string> = {
      scrape_creators: "ScrapeCreators",
      llm: "AI Model (LLM)",
      pexels: "Pexels",
    };

    return createResponse({
      payload: {
        apiKeys: {
          usersWithAtLeastOneKey: usersWithKeys,
          byProvider: Object.entries(byProvider).map(([provider, count]) => ({
            provider,
            label: providerLabels[provider] || provider,
            count,
          })),
          topModels,
        },
        scraping: {
          totalAdsInDb: totalAds ?? 0,
          totalBrands: totalBrands ?? 0,
          adsPerUser: adsPerUser.slice(0, 50),
        },
      },
      message: "OK",
    });
  } catch (e: any) {
    return createError({ message: e.message || "Failed to get analytics", status: 500 });
  }
}
