import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  
  const testOrgId = 'e6d72701-8674-4ac6-b39a-ad24fa0d5c31';
  
  try {
    // First, check if organization already exists
    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("id", testOrgId)
      .single();
    
    if (!existingOrg) {
      // Create test organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          id: testOrgId,
          name: "Test Organization",
          email: "test@example.com",
          subscription_status: "trial"
        })
        .select()
        .single();
      
      if (orgError) {
        console.error("Error creating organization:", orgError);
        return NextResponse.json({ error: "Failed to create organization", details: orgError }, { status: 500 });
      }
      
      console.log("Created organization:", org);
    } else {
      console.log("Organization already exists");
    }
    
    // Check if widget exists
    const { data: existingWidget } = await supabase
      .from("widgets")
      .select("id")
      .eq("organization_id", testOrgId)
      .single();
    
    if (!existingWidget) {
      // Create test widget
      const { data: widget, error: widgetError } = await supabase
        .from("widgets")
        .insert({
          organization_id: testOrgId,
          name: "Test Widget",
          slug: "test-widget",
          is_active: true,
          config: {
            theme: {
              primaryColor: "#3B82F6",
              secondaryColor: "#EF4444",
              backgroundColor: "#FFFFFF",
              textColor: "#1F2937",
              headerColor: "#1F2937",
              fontFamily: "Inter",
              borderRadius: 8,
              headerAlignment: "center"
            },
            settings: {
              showProgressBar: true,
              showDonorList: true,
              allowRecurring: true,
              minimumDonation: 100,
              suggestedAmounts: [1000, 3000, 6000, 10000, 20000],
              showCoverFees: true,
              defaultFrequency: "one-time"
            }
          }
        })
        .select()
        .single();
      
      if (widgetError) {
        console.error("Error creating widget:", widgetError);
        return NextResponse.json({ error: "Failed to create widget", details: widgetError }, { status: 500 });
      }
      
      console.log("Created widget:", widget);
      
      // Create test causes
      const { data: causes, error: causesError } = await supabase
        .from("causes")
        .insert([
          {
            widget_id: widget.id,
            name: "General Fund",
            description: "Support our general operations",
            is_active: true
          },
          {
            widget_id: widget.id,
            name: "Emergency Response",
            description: "Help us respond to emergencies",
            is_active: true
          }
        ])
        .select();
      
      if (causesError) {
        console.error("Error creating causes:", causesError);
      } else {
        console.log("Created causes:", causes);
      }
    } else {
      console.log("Widget already exists");
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Test data setup completed",
      organizationId: testOrgId
    });
    
  } catch (error) {
    console.error("Error setting up test data:", error);
    return NextResponse.json({ error: "Failed to setup test data", details: error }, { status: 500 });
  }
}