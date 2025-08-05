import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { NotificationService } from "@/lib/notifications/service";

// GET /api/system-alerts - Get system alerts for current user
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's role and organization
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build query based on user's permissions
    let query = supabaseAdmin
      .from("system_alerts")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    // Filter by target audience
    if (userData.role === "super_admin") {
      // Super admins see all alerts
    } else if (userData.role === "owner") {
      // Owners see all general alerts and owner-specific alerts
      query = query.in("target_audience", ["all", "owners"]);
    } else {
      // Regular users only see general alerts and org-specific alerts
      query = query.or(
        `target_audience.eq.all,and(target_audience.eq.specific_org,target_organization_id.eq.${userData.organization_id})`
      );
    }

    const { data: alerts, error } = await query;

    if (error) {
      throw error;
    }

    // Filter out acknowledged alerts for non-admin users
    const filteredAlerts = alerts?.filter((alert: any) => {
      if (userData.role === "super_admin") return true;
      return !alert.acknowledged_by.includes(user.id);
    }) || [];

    return NextResponse.json({ success: true, alerts: filteredAlerts });
  } catch (error) {
    console.error("Error fetching system alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch system alerts" },
      { status: 500 }
    );
  }
}

// POST /api/system-alerts - Create a new system alert (super admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is super admin
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = await NotificationService.createSystemAlert(body, user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating system alert:", error);
    return NextResponse.json(
      { error: "Failed to create system alert" },
      { status: 500 }
    );
  }
}