import crypto from "crypto";

export function createInvitationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export interface InvitationEmailData {
  email: string;
  organizationName: string;
  invitationToken: string;
  role: string;
}

export async function sendInvitationEmail(data: InvitationEmailData) {
  const { email, organizationName, invitationToken, role } = data;
  
  // Import email service
  const { sendEmail, createInvitationEmailTemplate } = await import('@/lib/email');
  
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invitation?token=${invitationToken}`;
  
  // Create professional email template
  const emailContent = createInvitationEmailTemplate({
    organizationName,
    role,
    inviteUrl,
  });

  try {
    await sendEmail({
      to: email,
      subject: `Invitation to join ${organizationName}`,
      html: emailContent,
      from: 'PassItOn <noreply@passiton.app>',
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    throw error;
  }
}