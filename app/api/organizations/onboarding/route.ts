import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const onboardingStepSchema = z.object({
  step: z.number().min(1).max(5),
  data: z.record(z.any()).optional(),
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const body = await req.json();

    const validationResult = onboardingStepSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { step, data } = validationResult.data;

    // Get user's organization
    const { data: user } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", userId)
      .single();

    if (!user?.organization_id) {
      return NextResponse.json(
        { error: "User not associated with an organization" },
        { status: 400 }
      );
    }

    if (!['owner', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Update organization onboarding step
    const updateData: any = {
      onboarding_step: step,
      updated_at: new Date().toISOString(),
    };

    // Handle step-specific data
    switch (step) {
      case 2: // Organization details completed
        if (data?.stripe_connect) {
          updateData.stripe_connect_account_id = data.stripe_connect.account_id;
          updateData.stripe_connect_status = data.stripe_connect.status;
        }
        break;
      case 3: // Widget configuration completed
        if (data?.widget_activated) {
          // Activate the default widget
          await supabase
            .from("widgets")
            .update({ is_active: true, is_published: true })
            .eq("organization_id", user.organization_id)
            .eq("slug", "main-widget");
        }
        break;
      case 4: // Team setup completed
        // No specific action needed
        break;
      case 5: // Onboarding completed
        updateData.onboarding_completed = true;
        break;
    }

    const { data: organization, error: updateError } = await supabase
      .from("organizations")
      .update(updateData)
      .eq("id", user.organization_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating organization onboarding:", updateError);
      return NextResponse.json(
        { error: "Failed to update onboarding progress" },
        { status: 500 }
      );
    }

    // Create notification for step completion
    const stepMessages = {
      1: "Organization created successfully!",
      2: "Payment setup completed!",
      3: "Widget configured and activated!",
      4: "Team setup completed!",
      5: "Onboarding completed! You're ready to start accepting donations.",
    };

    await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        organization_id: user.organization_id,
        type: step === 5 ? 'widget_created' : 'system_alert',
        title: `Onboarding Step ${step} Complete`,
        message: stepMessages[step as keyof typeof stepMessages],
        data: { onboarding_step: step, ...data },
      });

    return NextResponse.json({
      organization,
      message: `Onboarding step ${step} completed successfully`,
    });

  } catch (error) {
    console.error("Error updating onboarding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user's organization_id
    const { data: user } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", userId)
      .single();

    if (!user?.organization_id) {
      return NextResponse.json(
        { error: "User not associated with an organization" },
        { status: 400 }
      );
    }

    // Get organization details
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name, onboarding_step, onboarding_completed, stripe_connect_status, created_at")
      .eq("id", user.organization_id)
      .single();

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get default widget status
    const { data: widget } = await supabase
      .from("widgets")
      .select("id, name, is_active, is_published")
      .eq("organization_id", user.organization_id)
      .eq("slug", "main-widget")
      .single();

    // Get user count
    const { count: userCount } = await supabase
      .from("users")
      .select("*", { count: "exact" })
      .eq("organization_id", user.organization_id)
      .eq("status", "active");

    const onboardingSteps = [
      {
        step: 1,
        title: "Create Organization",
        description: "Set up your organization profile",
        completed: org.onboarding_step >= 1,
        required: true,
      },
      {
        step: 2,
        title: "Connect Payment Processing",
        description: "Set up Stripe Connect for donations",
        completed: org.onboarding_step >= 2 && org.stripe_connect_status === 'connected',
        required: true,
      },
      {
        step: 3,
        title: "Configure Your Widget",
        description: "Customize and activate your donation widget",
        completed: org.onboarding_step >= 3 && widget?.is_active,
        required: true,
      },
      {
        step: 4,
        title: "Invite Team Members",
        description: "Add team members to help manage donations",
        completed: org.onboarding_step >= 4 || (userCount && userCount > 1),
        required: false,
      },
      {
        step: 5,
        title: "Go Live",
        description: "Complete onboarding and start accepting donations",
        completed: org.onboarding_completed,
        required: true,
      },
    ];

    return NextResponse.json({
      organization: org,
      current_step: org.onboarding_step,
      completed: org.onboarding_completed,
      steps: onboardingSteps,
      widget: widget,
      user_count: userCount || 1,
    });

  } catch (error) {
    console.error("Error getting onboarding status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}