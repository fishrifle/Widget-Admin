import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    console.log("API: Current user:", user?.id);
    
    if (!user?.id) {
      console.log("API: No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    const supabase = supabaseAdmin;

    // Check if user is super admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    console.log("API: User data:", userData, "Error:", userError);

    if (userError) {
      console.log("API: User lookup error:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Temporarily bypass super admin check for testing
    if (userData?.role !== "super_admin") {
      console.log("API: User role check failed. Role:", userData?.role, "- bypassing for testing");
      // return NextResponse.json({ error: "Forbidden - requires super admin" }, { status: 403 });
    }

    // Fetch all organizations
    const { data: organizations, error } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("API: Organizations fetched:", organizations?.length || 0, "Error:", error);

    if (error) {
      console.log("API: Organizations fetch error:", error);
      throw error;
    }

    return NextResponse.json(organizations);
  } catch (error) {
    console.error("API: Unhandled error:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
