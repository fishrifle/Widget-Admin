import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createInvitationToken, sendInvitationEmail } from "@/lib/invitations";

export async function POST(request: NextRequest) {
  try {
    const { email, role, organizationId, organizationName } = await request.json();

    if (!email || !role || !organizationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("ENHANCED INVITE: Using full schema with invitation tracking");

    // Check if user already exists in this organization
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("organization_id", organizationId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("Error checking existing user:", checkError);
      return NextResponse.json(
        { error: "Database error checking user" },
        { status: 500 }
      );
    }

    if (existingUser) {
      if (existingUser.status === 'accepted') {
        return NextResponse.json(
          { error: "User is already a team member" },
          { status: 409 }
        );
      } else if (existingUser.status === 'pending') {
        // Resend invitation to existing pending user
        const newInvitationToken = createInvitationToken();
        
        const { error: updateError } = await supabaseAdmin
          .from("users")
          .update({
            invited_at: new Date().toISOString(),
            invitation_token: newInvitationToken
          })
          .eq("id", existingUser.id);

        if (updateError) {
          console.error("Error updating invitation:", updateError);
          return NextResponse.json(
            { error: "Failed to resend invitation" },
            { status: 500 }
          );
        }

        // Send email with new token
        try {
          await sendInvitationEmail({
            email,
            organizationName: organizationName || "PassItOn Organization",
            invitationToken: newInvitationToken,
            role,
          });
          console.log("ENHANCED INVITE: Resent invitation email with new token");
        } catch (emailError) {
          console.error("Email error:", emailError);
        }

        return NextResponse.json({
          success: true,
          message: "Invitation resent successfully",
          action: "updated_existing"
        });
      }
    }

    // Generate invitation token
    const invitationToken = createInvitationToken();
    const tempId = `invited_${crypto.randomUUID()}`;

    // Create pending user record with enhanced schema
    const { error: insertError } = await supabaseAdmin.from("users").insert({
      id: tempId,
      email,
      role,
      organization_id: organizationId,
      status: 'pending',
      invited_at: new Date().toISOString(),
      invitation_token: invitationToken,
      created_at: new Date().toISOString()
    });

    if (insertError) {
      console.error("Database error:", insertError);
      return NextResponse.json(
        { error: "Failed to create invitation" },
        { status: 500 }
      );
    }

    // Send invitation email
    try {
      await sendInvitationEmail({
        email,
        organizationName: organizationName || "PassItOn Organization",
        invitationToken,
        role,
      });
      console.log("ENHANCED INVITE: Created new invitation with token and email sent");
    } catch (emailError) {
      console.error("Email error:", emailError);
      // Don't fail the request if email fails, but log it
      console.warn("Failed to send invitation email, but user record created with enhanced tracking");
    }

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully with enhanced tracking",
      features: ["status_tracking", "invitation_tokens", "resend_capability"],
      action: "created_new"
    });
  } catch (error) {
    console.error("Invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}