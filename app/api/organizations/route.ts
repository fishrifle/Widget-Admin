import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user's role and organization
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, organization_id")
      .eq("id", userId)
      .single();

    if (userError) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let organizations;

    if (userData?.role === "super_admin") {
      // Super admins can see all organizations
      const { data: allOrgs, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      organizations = allOrgs;
    } else if (userData?.organization_id) {
      // Regular users can only see their own organization
      const { data: userOrg, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", userData.organization_id)
        .single();

      if (error) throw error;
      organizations = [userOrg];
    } else {
      // User has no organization
      organizations = [];
    }

    return NextResponse.json(organizations);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}
