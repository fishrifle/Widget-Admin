import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// GET /api/notifications/preferences - Get user's notification preferences
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    let query = supabaseAdmin
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id);

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    const { data: preferences, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, preferences: preferences || [] });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/preferences - Update user's notification preferences
export async function PUT(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { preferences } = body;

    if (!Array.isArray(preferences)) {
      return NextResponse.json(
        { error: "Preferences must be an array" },
        { status: 400 }
      );
    }

    // Update preferences one by one
    const results = [];
    for (const pref of preferences) {
      const { error } = await supabaseAdmin
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          organization_id: pref.organization_id,
          type: pref.type,
          channels: pref.channels,
          enabled: pref.enabled,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id,organization_id,type"
        });

      if (error) {
        console.error("Error updating preference:", error);
        results.push({ type: pref.type, success: false, error: error.message });
      } else {
        results.push({ type: pref.type, success: true });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}