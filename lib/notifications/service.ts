import { supabaseAdmin } from "@/lib/supabase/server";
import { sendEmail, createNotificationEmailTemplate } from "@/lib/email";
import type {
  CreateNotificationRequest,
  CreateSystemAlertRequest,
  NotificationType,
  NotificationChannel,
  SystemAlert,
  NotificationDataMap,
  DonationNotificationData,
  TeamInvitationNotificationData,
  GoalReachedNotificationData,
  PaymentNotificationData
} from "@/types/notifications.types";

export class NotificationService {
  /**
   * Create a new notification for a user
   */
  static async createNotification<T extends NotificationType>(
    request: CreateNotificationRequest & {
      type: T;
      data?: NotificationDataMap[T];
    }
  ) {
    try {
      // Get user's notification preferences
      const { data: preferences } = await supabaseAdmin
        .from("notification_preferences")
        .select("*")
        .eq("user_id", request.user_id)
        .eq("type", request.type)
        .single();

      // If user has disabled this notification type, skip
      if (preferences && !preferences.enabled) {
        console.log(`Notification ${request.type} disabled for user ${request.user_id}`);
        return { success: true, skipped: true };
      }

      // Use user preferences for channels if available, otherwise use request channels
      const channels = preferences?.channels || request.channels || ['email', 'in_app'];

      // Create the notification record
      const { data: notification, error: notificationError } = await supabaseAdmin
        .from("notifications")
        .insert({
          user_id: request.user_id,
          organization_id: request.organization_id,
          type: request.type,
          title: request.title,
          message: request.message,
          data: request.data || {},
          channels,
          expires_at: request.expires_at
        })
        .select()
        .single();

      if (notificationError) {
        throw notificationError;
      }

      // Send through enabled channels
      if (channels.includes('email')) {
        await this.sendEmailNotification(notification, request.data);
      }

      // Mark as sent
      await supabaseAdmin
        .from("notifications")
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq("id", notification.id);

      return { success: true, notification };
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(notification: any, data?: any) {
    try {
      // Get user email
      const { data: user } = await supabaseAdmin
        .from("users")
        .select("email, first_name, last_name")
        .eq("id", notification.user_id)
        .single();

      if (!user?.email) {
        console.warn(`No email found for user ${notification.user_id}`);
        return;
      }

      // Get organization info if available
      let organization = null;
      if (notification.organization_id) {
        const { data: org } = await supabaseAdmin
          .from("organizations")
          .select("name, display_name")
          .eq("id", notification.organization_id)
          .single();
        organization = org;
      }

      // Generate email content based on notification type
      const emailContent = this.generateEmailContent(notification, data, user, organization);

      // Add to email queue
      await supabaseAdmin
        .from("email_queue")
        .insert({
          to_email: user.email,
          subject: emailContent.subject,
          html_content: emailContent.html,
          text_content: emailContent.text,
          notification_id: notification.id
        });

      // Send email immediately (in production, this might be handled by a queue processor)
      await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        from: 'PassItOn <noreply@passiton.app>'
      });

      console.log(`Email notification sent to ${user.email} for ${notification.type}`);
    } catch (error) {
      console.error("Error sending email notification:", error);
      // Don't throw - we don't want email failures to break notification creation
    }
  }

  /**
   * Generate email content based on notification type
   */
  private static generateEmailContent(notification: any, data: any, user: any, organization: any) {
    const userName = user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}`
      : user.email;
    
    const orgName = organization?.display_name || organization?.name || 'your organization';

    switch (notification.type) {
      case 'donation_received':
        const donationData = data as DonationNotificationData;
        return {
          subject: `New donation received: $${(donationData.amount / 100).toFixed(2)}`,
          html: createNotificationEmailTemplate({
            title: '🎉 New Donation Received!',
            greeting: `Hi ${userName},`,
            mainContent: `
              <p>Great news! You've received a new donation through your <strong>${donationData.widget_name}</strong> widget.</p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #2563eb;">Donation Details</h3>
                <p style="margin: 5px 0;"><strong>Amount:</strong> $${(donationData.amount / 100).toFixed(2)}</p>
                ${donationData.donor_name ? `<p style="margin: 5px 0;"><strong>Donor:</strong> ${donationData.donor_name}</p>` : ''}
                ${donationData.cause_name ? `<p style="margin: 5px 0;"><strong>Cause:</strong> ${donationData.cause_name}</p>` : ''}
              </div>
              <p>Thank you for making a difference with PassItOn!</p>
            `,
            ctaText: 'View Dashboard',
            ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            organizationName: orgName
          }),
          text: `New donation received: $${(donationData.amount / 100).toFixed(2)} through ${donationData.widget_name}`
        };

      case 'goal_reached':
        const goalData = data as GoalReachedNotificationData;
        return {
          subject: `🎯 Goal reached for ${goalData.cause_name}!`,
          html: createNotificationEmailTemplate({
            title: '🎯 Congratulations! Goal Reached!',
            greeting: `Hi ${userName},`,
            mainContent: `
              <p>Amazing news! Your cause <strong>${goalData.cause_name}</strong> has reached its funding goal!</p>
              <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                <h3 style="margin: 0 0 10px 0; color: #2563eb;">Goal Achievement</h3>
                <p style="margin: 5px 0;"><strong>Goal Amount:</strong> $${(goalData.goal_amount / 100).toFixed(2)}</p>
                <p style="margin: 5px 0;"><strong>Amount Raised:</strong> $${(goalData.raised_amount / 100).toFixed(2)}</p>
                <p style="margin: 5px 0;"><strong>Widget:</strong> ${goalData.widget_name}</p>
              </div>
              <p>Your supporters have come together to make this goal a reality. Well done!</p>
            `,
            ctaText: 'View Cause Details',
            ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            organizationName: orgName
          }),
          text: `Goal reached for ${goalData.cause_name}! Raised $${(goalData.raised_amount / 100).toFixed(2)}`
        };

      case 'team_member_joined':
        return {
          subject: `New team member joined ${orgName}`,
          html: createNotificationEmailTemplate({
            title: '👋 New Team Member',
            greeting: `Hi ${userName},`,
            mainContent: `
              <p><strong>${data.user_name}</strong> has joined your team at ${orgName} as a <strong>${data.role}</strong>.</p>
              <p>Welcome them to the team and help them get started with PassItOn!</p>
            `,
            ctaText: 'View Team',
            ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/team`,
            organizationName: orgName
          }),
          text: `${data.user_name} joined your team at ${orgName} as ${data.role}`
        };

      case 'payment_failed':
        const paymentData = data as PaymentNotificationData;
        return {
          subject: `Payment failed - Action required`,
          html: createNotificationEmailTemplate({
            title: '⚠️ Payment Failed',
            greeting: `Hi ${userName},`,
            mainContent: `
              <p>We encountered an issue processing a payment for ${orgName}.</p>
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <h3 style="margin: 0 0 10px 0; color: #dc2626;">Payment Details</h3>
                <p style="margin: 5px 0;"><strong>Amount:</strong> $${(paymentData.amount / 100).toFixed(2)}</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> ${paymentData.status}</p>
                ${paymentData.description ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${paymentData.description}</p>` : ''}
              </div>
              <p>Please review your payment settings and try again.</p>
            `,
            ctaText: 'Review Payment Settings',
            ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
            organizationName: orgName
          }),
          text: `Payment failed for ${orgName}. Amount: $${(paymentData.amount / 100).toFixed(2)}`
        };

      default:
        return {
          subject: notification.title,
          html: createNotificationEmailTemplate({
            title: notification.title,
            greeting: `Hi ${userName},`,
            mainContent: `<p>${notification.message}</p>`,
            ctaText: 'View Dashboard',
            ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            organizationName: orgName
          }),
          text: notification.message
        };
    }
  }

  /**
   * Create system alert for admins
   */
  static async createSystemAlert(request: CreateSystemAlertRequest, createdBy: string) {
    try {
      const { data: alert, error } = await supabaseAdmin
        .from("system_alerts")
        .insert({
          title: request.title,
          message: request.message,
          type: request.type || 'info',
          severity: request.severity || 'low',
          target_audience: request.target_audience || 'all',
          target_organization_id: request.target_organization_id,
          data: request.data || {},
          created_by: createdBy,
          expires_at: request.expires_at
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`System alert created: ${alert.title}`);
      return { success: true, alert };
    } catch (error) {
      console.error("Error creating system alert:", error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    try {
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("user_id", userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  /**
   * Get user's notifications
   */
  static async getUserNotifications(userId: string, options: {
    limit?: number;
    unreadOnly?: boolean;
    types?: NotificationType[];
  } = {}) {
    try {
      let query = supabaseAdmin
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (options.unreadOnly) {
        query = query.eq("read", false);
      }

      if (options.types && options.types.length > 0) {
        query = query.in("type", options.types);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: notifications, error } = await query;

      if (error) throw error;

      return { success: true, notifications: notifications || [] };
    } catch (error) {
      console.error("Error getting user notifications:", error);
      throw error;
    }
  }
}