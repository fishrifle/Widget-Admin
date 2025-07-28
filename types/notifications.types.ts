// Notification system types

export type NotificationType = 
  | 'donation_received'
  | 'team_invitation'
  | 'team_member_joined'
  | 'team_member_left'
  | 'widget_created'
  | 'widget_updated'
  | 'goal_reached'
  | 'milestone_reached'
  | 'system_alert'
  | 'payment_processed'
  | 'payment_failed';

export type NotificationChannel = 'email' | 'in_app' | 'push';

export type SystemAlertType = 'info' | 'warning' | 'error' | 'success';
export type SystemAlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type SystemAlertAudience = 'all' | 'super_admins' | 'owners' | 'specific_org';

export interface Notification {
  id: string;
  user_id: string;
  organization_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  channels: NotificationChannel[];
  read: boolean;
  sent: boolean;
  sent_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  organization_id: string | null;
  type: NotificationType;
  channels: NotificationChannel[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  type: SystemAlertType;
  severity: SystemAlertSeverity;
  target_audience: SystemAlertAudience;
  target_organization_id: string | null;
  data: Record<string, any>;
  active: boolean;
  acknowledged_by: string[];
  created_by: string;
  created_at: string;
  expires_at: string | null;
}

export interface EmailQueueItem {
  id: string;
  to_email: string;
  from_email: string;
  subject: string;
  html_content: string;
  text_content: string | null;
  notification_id: string | null;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  scheduled_for: string;
  sent_at: string | null;
  created_at: string;
}

// Notification creation interfaces
export interface CreateNotificationRequest {
  user_id: string;
  organization_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels?: NotificationChannel[];
  expires_at?: string;
}

export interface CreateSystemAlertRequest {
  title: string;
  message: string;
  type?: SystemAlertType;
  severity?: SystemAlertSeverity;
  target_audience?: SystemAlertAudience;
  target_organization_id?: string;
  data?: Record<string, any>;
  expires_at?: string;
}

// Notification template interfaces
export interface DonationNotificationData {
  donation_id: string;
  amount: number;
  currency: string;
  donor_name?: string;
  donor_email?: string;
  widget_name: string;
  cause_name?: string;
}

export interface TeamInvitationNotificationData {
  invited_email: string;
  invited_role: string;
  invited_by: string;
  organization_name: string;
  invitation_token: string;
}

export interface GoalReachedNotificationData {
  cause_id: string;
  cause_name: string;
  goal_amount: number;
  raised_amount: number;
  widget_name: string;
}

export interface PaymentNotificationData {
  payment_id: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
}

// Utility types for notification templates
export type NotificationDataMap = {
  'donation_received': DonationNotificationData;
  'team_invitation': TeamInvitationNotificationData;
  'team_member_joined': { user_name: string; user_email: string; role: string };
  'team_member_left': { user_name: string; user_email: string; role: string };
  'widget_created': { widget_name: string; widget_slug: string };
  'widget_updated': { widget_name: string; widget_slug: string; changes: string[] };
  'goal_reached': GoalReachedNotificationData;
  'milestone_reached': { milestone: string; amount: number; cause_name: string };
  'system_alert': Record<string, any>;
  'payment_processed': PaymentNotificationData;
  'payment_failed': PaymentNotificationData;
};

// Hook interfaces
export interface UseNotificationsOptions {
  limit?: number;
  unreadOnly?: boolean;
  types?: NotificationType[];
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}