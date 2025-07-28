-- Notification system migration
-- Adds comprehensive notification and alert functionality

-- Create notification_types enum
CREATE TYPE notification_type AS ENUM (
  'donation_received',
  'team_invitation',
  'team_member_joined',
  'team_member_left',
  'widget_created',
  'widget_updated',
  'goal_reached',
  'milestone_reached',
  'system_alert',
  'payment_processed',
  'payment_failed'
);

-- Create notification_channels enum
CREATE TYPE notification_channel AS ENUM (
  'email',
  'in_app',
  'push'
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- Additional data specific to notification type
  channels notification_channel[] DEFAULT ARRAY['email', 'in_app'], -- Which channels to send through
  read BOOLEAN DEFAULT false,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE -- Optional expiration for temporary notifications
);

-- Create notification_preferences table
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  channels notification_channel[] DEFAULT ARRAY['email', 'in_app'],
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, organization_id, type)
);

-- Create system_alerts table for platform-wide alerts
CREATE TABLE public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'super_admins', 'owners', 'specific_org')),
  target_organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  acknowledged_by TEXT[], -- Array of user IDs who acknowledged
  created_by TEXT NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create email_queue table for reliable email delivery
CREATE TABLE public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  from_email TEXT DEFAULT 'PassItOn <noreply@passiton.app>',
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all notification tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "System can create notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

CREATE POLICY "Super admins can manage all notifications" ON public.notifications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'super_admin'
  )
);

-- RLS Policies for notification_preferences
CREATE POLICY "Users can manage their own notification preferences" ON public.notification_preferences
FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Super admins can view all notification preferences" ON public.notification_preferences
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'super_admin'
  )
);

-- RLS Policies for system_alerts
CREATE POLICY "Users can view relevant system alerts" ON public.system_alerts
FOR SELECT USING (
  active = true AND (
    target_audience = 'all' OR
    (target_audience = 'super_admins' AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid()::text 
      AND users.role = 'super_admin'
    )) OR
    (target_audience = 'owners' AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid()::text 
      AND users.role IN ('owner', 'super_admin')
    )) OR
    (target_audience = 'specific_org' AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid()::text 
      AND users.organization_id = system_alerts.target_organization_id
    ))
  )
);

CREATE POLICY "Super admins can manage system alerts" ON public.system_alerts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'super_admin'
  )
);

CREATE POLICY "Users can acknowledge system alerts" ON public.system_alerts
FOR UPDATE USING (
  auth.uid()::text = ANY(acknowledged_by) OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'super_admin'
  )
);

-- RLS Policies for email_queue (admin only)
CREATE POLICY "Super admins can view email queue" ON public.email_queue
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'super_admin'
  )
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_organization_id ON public.notifications(organization_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_organization_id ON public.notification_preferences(organization_id);
CREATE INDEX idx_notification_preferences_type ON public.notification_preferences(type);

CREATE INDEX idx_system_alerts_active ON public.system_alerts(active);
CREATE INDEX idx_system_alerts_target_audience ON public.system_alerts(target_audience);
CREATE INDEX idx_system_alerts_created_at ON public.system_alerts(created_at);

CREATE INDEX idx_email_queue_status ON public.email_queue(status);
CREATE INDEX idx_email_queue_scheduled_for ON public.email_queue(scheduled_for);

-- Add updated_at trigger for notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at 
BEFORE UPDATE ON public.notification_preferences 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default notification preferences for common types
-- This will be handled by the application when users are created

-- Function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default preferences for the new user
  INSERT INTO public.notification_preferences (user_id, organization_id, type, channels, enabled)
  VALUES 
    (NEW.id, NEW.organization_id, 'donation_received', ARRAY['email', 'in_app'], true),
    (NEW.id, NEW.organization_id, 'team_invitation', ARRAY['email'], true),
    (NEW.id, NEW.organization_id, 'team_member_joined', ARRAY['in_app'], true),
    (NEW.id, NEW.organization_id, 'goal_reached', ARRAY['email', 'in_app'], true),
    (NEW.id, NEW.organization_id, 'payment_processed', ARRAY['email'], true),
    (NEW.id, NEW.organization_id, 'payment_failed', ARRAY['email'], true)
  ON CONFLICT (user_id, organization_id, type) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create notification preferences for new users
CREATE TRIGGER create_user_notification_preferences
AFTER INSERT ON public.users
FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();