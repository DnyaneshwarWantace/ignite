import { supabaseAdmin } from "@/lib/supabase";

/**
 * Log an API usage event for admin analytics. Call from API routes after successful operations.
 * Safe to fire-and-forget (don't await if you don't need to).
 */
export async function logUsage(params: {
  userId: string;
  feature: string;
  endpoint?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await supabaseAdmin.from("api_usage_log").insert({
      user_id: params.userId,
      feature: params.feature,
      endpoint: params.endpoint ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (_) {
    // Don't fail the request if logging fails
  }
}
