import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default-user";

    // Get all campaigns for this user
    const { data, error } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to load campaigns" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("List campaigns error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load campaigns" },
      { status: 500 }
    );
  }
}
