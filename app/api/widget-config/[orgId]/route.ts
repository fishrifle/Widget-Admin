import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Type definitions
interface Cause {
  id: string;
  name: string;
  description: string;
}

interface WidgetTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  headerColor: string;
  fontFamily: string;
  borderRadius: number;
  headerAlignment: string;
}

interface WidgetSettings {
  showProgressBar: boolean;
  showDonorList: boolean;
  allowRecurring: boolean;
  minimumDonation: number;
  suggestedAmounts: number[];
  showCoverFees: boolean;
  defaultFrequency: string;
}

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET(
  req: Request,
  { params }: { params: { orgId: string } }
) {
  console.log("Widget config API called for orgId:", params.orgId);
  
  // Add CORS headers for widget embed requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  const supabase = await createClient();

  try {
    // First, verify the organization exists
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, stripe_customer_id")
      .eq("id", params.orgId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404, headers }
      );
    }

    // Get organization's widget configuration (or any widget if none are active)
    const { data: widgets, error: widgetError } = await supabase
      .from("widgets")
      .select(`
        id,
        name,
        slug,
        config,
        organization_id
      `)
      .eq("organization_id", params.orgId)
      .limit(1)
      .single();

    // If no widget exists, return default configuration
    if (widgetError || !widgets) {
      console.log("No widget found for organization, returning default config");
    }

    // Get causes for this organization's widgets (handle missing table gracefully)
    let causes: Cause[] = [];
    const { data: causesData, error: causesError } = await supabase
      .from("causes")
      .select("id, name, description")
      .eq("widget_id", widgets?.id)
      .eq("is_active", true);

    if (causesError) {
      if (causesError.code === '42P01') {
        console.log("Causes table doesn't exist yet - using empty causes array");
        causes = [];
      } else {
        console.error("Error fetching causes:", causesError);
        causes = [];
      }
    } else {
      causes = (causesData as Cause[]) || [];
    }

    // Prepare widget configuration for consumption
    const widgetConfig = {
      id: widgets?.id || 'default',
      name: widgets?.name || 'Default Widget',
      slug: widgets?.slug || 'default',
      organizationId: params.orgId,
      organizationName: organization.name,
      stripeCustomerId: organization.stripe_customer_id,
      config: {
        // Theme configuration (Persevere brand colors)
        theme: widgets?.config?.theme || {
          primaryColor: "#0891B2", // Cyan-600 (teal/blue)
          secondaryColor: "#0F766E", // Teal-700 (darker teal)
          backgroundColor: "#FFFFFF",
          textColor: "#1F2937",
          headerColor: "#0F172A", // Slate-900 (dark professional)
          fontFamily: "Inter",
          borderRadius: 8,
          headerAlignment: "center"
        },
        // Donation settings
        settings: widgets?.config?.settings || {
          showProgressBar: true,
          showDonorList: true,
          allowRecurring: true,
          minimumDonation: 100, // $1.00 in cents
          suggestedAmounts: [1000, 3000, 6000, 10000, 20000], // In cents
          showCoverFees: true,
          defaultFrequency: "one-time"
        },
        // Available causes
        causes: causes
      },
      // Dashboard webhook endpoint for notifications
      webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/webhooks/donations`
    };

    return NextResponse.json(widgetConfig, { headers });
  } catch (error) {
    console.error("Error fetching widget config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers }
    );
  }
}