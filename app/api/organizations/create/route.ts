import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema for organization creation
const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(100),
  display_name: z.string().optional(),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  email: z.string().email("Valid email is required"),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().max(500).optional(),
  industry: z.string().optional(),
  company_size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  user_email: z.string().email().optional(), // For user creation
});

export async function POST(req: Request) {
  try {
    console.log("=== Organization Creation API Called ===");
    const { userId } = await auth();
    console.log("User ID:", userId);
    
    if (!userId) {
      console.log("No user ID - unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin;
    const body = await req.json();
    console.log("Request Body:", body);

    // Validate input
    const validationResult = createOrganizationSchema.safeParse(body);
    if (!validationResult.success) {
      console.log("Validation failed:", validationResult.error.flatten().fieldErrors);
      return NextResponse.json(
        { 
          error: "Invalid input", 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    console.log("Validated data:", data);

    // Check if slug is already taken
    console.log("Checking if slug exists:", data.slug);
    const { data: existingOrg, error: slugCheckError } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", data.slug)
      .single();

    if (slugCheckError && slugCheckError.code !== 'PGRST116') {
      console.log("Error checking slug:", slugCheckError);
      throw slugCheckError;
    }

    if (existingOrg) {
      console.log("Slug already exists");
      return NextResponse.json(
        { error: "Organization slug already exists" },
        { status: 409 }
      );
    }

    // Check if user already belongs to an organization (unless they're a super admin)
    console.log("Checking existing user:", userId);
    const { data: existingUser, error: userCheckError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", userId)
      .single();

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.log("Error checking user:", userCheckError);
      throw userCheckError;
    }

    console.log("Existing user:", existingUser);

    if (existingUser?.organization_id && existingUser.role !== 'super_admin') {
      console.log("User already belongs to an organization");
      return NextResponse.json(
        { error: "User already belongs to an organization" },
        { status: 409 }
      );
    }

    // Create organization
    console.log("Creating organization with data:", {
      name: data.name,
      display_name: data.display_name || data.name,
      slug: data.slug,
      email: data.email,
      website: data.website || null,
      description: data.description || null,
      industry: data.industry || null,
      company_size: data.company_size || null,
      subscription_status: 'trial',
      subscription_plan: 'free',
      onboarding_completed: false,
      onboarding_step: 1,
      status: 'active',
    });
    
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: data.name,
        display_name: data.display_name || data.name,
        slug: data.slug,
        email: data.email,
        website: data.website || null,
        description: data.description || null,
        industry: data.industry || null,
        company_size: data.company_size || null,
        subscription_status: 'trial',
        subscription_plan: 'free',
        onboarding_completed: false,
        onboarding_step: 1,
        status: 'active',
      })
      .select()
      .single();

    if (orgError) {
      console.error("Error creating organization:", orgError);
      console.error("Organization error details:", JSON.stringify(orgError, null, 2));
      return NextResponse.json(
        { error: "Failed to create organization", details: orgError.message },
        { status: 500 }
      );
    }

    console.log("Organization created successfully:", organization);

    // Create or update user record
    console.log("Managing user record for userId:", userId);
    console.log("existingUser state:", existingUser);
    if (existingUser) {
      console.log("Updating existing user");
      // Update existing user to be owner of new organization
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          organization_id: organization.id,
          role: "owner",
          status: "active",
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (userUpdateError) {
        console.error("Error updating user:", userUpdateError);
        console.error("User update error details:", JSON.stringify(userUpdateError, null, 2));
        // Rollback organization creation
        await supabase.from("organizations").delete().eq("id", organization.id);
        return NextResponse.json(
          { error: "Failed to assign user to organization", details: userUpdateError.message },
          { status: 500 }
        );
      }
    } else {
      console.log("Creating new user");
      // Create new user record
      const { error: userCreateError } = await supabase
        .from("users")
        .insert({
          id: userId,
          organization_id: organization.id,
          email: data.user_email || data.email, // Use provided email or org email
          role: "owner",
          status: "active",
          timezone: "UTC",
          language: "en",
          last_activity_at: new Date().toISOString(),
        });

      if (userCreateError) {
        console.error("Error creating user:", userCreateError);
        console.error("User create error details:", JSON.stringify(userCreateError, null, 2));
        // Rollback organization creation
        await supabase.from("organizations").delete().eq("id", organization.id);
        return NextResponse.json(
          { error: "Failed to create user record", details: userCreateError.message },
          { status: 500 }
        );
      }
    }

    console.log("User record created/updated successfully");

    // Create a default widget for the organization
    const { data: widget, error: widgetError } = await supabase
      .from("widgets")
      .insert({
        organization_id: organization.id,
        name: `${organization.name} Donation Widget`,
        slug: "main-widget",
        description: "Primary donation widget",
        config: {
          theme: {
            primaryColor: "#3B82F6",
            secondaryColor: "#10B981",
            fontFamily: "Inter",
            borderRadius: "8px",
            headerText: organization.name,
            headerColor: "#1F2937",
            backgroundColor: "#FFFFFF",
          },
          causes: [],
          settings: {
            showProgressBar: true,
            showDonorList: false,
            allowRecurring: true,
            minimumDonation: 1,
            suggestedAmounts: [10, 30, 60, 100, 200],
            showCoverFees: true,
            defaultFrequency: "one-time",
          },
        },
        is_active: false, // Will be activated during onboarding
      })
      .select()
      .single();

    if (widgetError) {
      console.error("Error creating default widget:", widgetError);
      // Don't rollback - widget creation is optional
    }

    // Create default notification for organization creation
    await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        organization_id: organization.id,
        type: 'organization_created',
        title: 'Welcome to PassItOn!',
        message: `Your organization "${organization.name}" has been created successfully.`,
      });

    // Return the created organization with the default widget
    return NextResponse.json({
      organization: {
        ...organization,
        default_widget: widget,
      },
    });

  } catch (error) {
    console.error("Unexpected error creating organization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get organization creation requirements and validation
export async function GET() {
  return NextResponse.json({
    requirements: {
      name: {
        type: "string",
        required: true,
        minLength: 1,
        maxLength: 100,
        description: "Organization name"
      },
      slug: {
        type: "string",
        required: true,
        pattern: "^[a-z0-9-]+$",
        description: "URL-friendly identifier (lowercase letters, numbers, and hyphens only)"
      },
      email: {
        type: "string",
        required: true,
        format: "email",
        description: "Organization contact email"
      },
      website: {
        type: "string",
        required: false,
        format: "url",
        description: "Organization website URL"
      },
      description: {
        type: "string",
        required: false,
        maxLength: 500,
        description: "Brief description of the organization"
      },
      industry: {
        type: "string",
        required: false,
        description: "Industry or sector"
      },
      company_size: {
        type: "string",
        required: false,
        enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
        description: "Organization size"
      }
    },
    features: {
      default_widget: "A default donation widget will be created automatically",
      onboarding: "Step-by-step onboarding process to get started",
      customization: "Full widget customization and branding options",
      analytics: "Comprehensive donation tracking and analytics",
      team_management: "Invite team members with role-based access"
    }
  });
}