import { Resend } from 'resend';

// Initialize Resend client only if API key exists
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  try {
    // In development mode or when no API key is configured, log to console
    if (!process.env.RESEND_API_KEY || process.env.NODE_ENV === 'development') {
      console.log("=== EMAIL SERVICE (DEV MODE) ===");
      console.log("To:", to);
      console.log("Subject:", subject);
      console.log("From:", from || 'PassItOn <noreply@passiton.app>');
      console.log("HTML Content (preview):", html.substring(0, 500) + '...');
      console.log("===============================");
      return { success: true, id: 'dev-mode-email' };
    }

    // In production with API key configured, send real email
    if (!resend) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const response = await resend.emails.send({
      from: from || 'PassItOn <noreply@passiton.app>',
      to: [to],
      subject,
      html,
    });

    if (response.error) {
      throw new Error(`Email service error: ${response.error.message}`);
    }

    console.log("Email sent successfully:", response.data?.id);
    return { success: true, id: response.data?.id };

  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
}

// Template for notification emails
export function createNotificationEmailTemplate({
  title,
  greeting,
  mainContent,
  ctaText,
  ctaUrl,
  organizationName,
}: {
  title: string;
  greeting: string;
  mainContent: string;
  ctaText?: string;
  ctaUrl?: string;
  organizationName?: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 0 auto; max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); border-radius: 8px 8px 0 0;">
              <h1 style="color: white; font-size: 24px; margin: 0; font-weight: 600;">${title}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #1f2937; font-size: 16px; margin: 0 0 20px; font-weight: 500;">${greeting}</p>
              
              ${mainContent}
              
              ${ctaText && ctaUrl ? `
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${ctaUrl}" 
                   style="display: inline-block; background-color: #2563eb; color: white; 
                          padding: 14px 28px; text-decoration: none; border-radius: 6px; 
                          font-weight: 600; font-size: 16px;">
                  ${ctaText}
                </a>
              </div>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                Best regards,<br>
                <strong style="color: #1f2937;">The PassItOn Team</strong>
                ${organizationName ? `<br><small>for ${organizationName}</small>` : ''}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Template for invitation emails
export function createInvitationEmailTemplate({
  organizationName,
  role,
  inviteUrl,
}: {
  organizationName: string;
  role: string;
  inviteUrl: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to join ${organizationName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 0 auto; max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); border-radius: 8px 8px 0 0;">
              <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">You're Invited!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 20px; font-weight: 600;">
                Join ${organizationName}
              </h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hello! You've been invited to join <strong style="color: #1f2937;">${organizationName}</strong> 
                as a <strong style="color: #2563eb;">${role}</strong> on PassItOn.
              </p>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                PassItOn helps organizations manage their donation campaigns and team collaboration. 
                Click the button below to accept your invitation and get started.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${inviteUrl}" 
                   style="display: inline-block; background-color: #2563eb; color: white; 
                          padding: 16px 32px; text-decoration: none; border-radius: 6px; 
                          font-weight: 600; font-size: 16px; transition: background-color 0.2s;">
                  Accept Invitation
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 30px 0 0;">
                <strong>Note:</strong> This invitation will expire in 7 days. If you didn't expect this invitation, 
                you can safely ignore this email.
              </p>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 20px 0 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${inviteUrl}" style="color: #2563eb; word-break: break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                Best regards,<br>
                <strong style="color: #1f2937;">The PassItOn Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}