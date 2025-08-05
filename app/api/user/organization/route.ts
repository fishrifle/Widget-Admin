import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client to bypass RLS issues
    const supabase = supabaseAdmin;

    // Get user data
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", userId)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        // User doesn't exist yet
        return NextResponse.json({ 
          user: null, 
          organization: null,
          role: null 
        });
      }
      
      console.error("Error fetching user:", userError);
      return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    }

    if (!user?.organization_id) {
      return NextResponse.json({ 
        user: user, 
        organization: null,
        role: user?.role || null 
      });
    }

    // Get organization data
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", user.organization_id)
      .single();

    if (orgError) {
      console.error("Error fetching organization:", orgError);
      return NextResponse.json({ error: "Failed to fetch organization" }, { status: 500 });
    }

    return NextResponse.json({
      user: user,
      organization: organization,
      role: user.role
    });

  } catch (error) {
    console.error("Unexpected error in user/organization API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}