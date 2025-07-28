-- Updated PassItOn Widget Schema
-- Reflects all new changes for enhanced widget functionality
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table - Enhanced with display name and subscription details
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_org_id TEXT UNIQUE,
  name TEXT NOT NULL,
  display_name TEXT, -- Added for better branding
  email TEXT,
  website TEXT,
  description TEXT,
  logo_url TEXT,
  stripe_customer_id TEXT,
  stripe_connect_account_id TEXT, -- Added for Stripe Connect
  subscription_status TEXT DEFAULT 'trial',
  subscription_plan TEXT DEFAULT 'free',
  settings JSONB DEFAULT '{}', -- Added for organization-wide settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users/Members table - Enhanced with invitation tokens
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'member', -- 'super_admin', 'owner', 'admin', 'member'
  avatar_url TEXT,
  invitation_token TEXT UNIQUE, -- Added for invitation system
  invitation_expires_at TIMESTAMPTZ, -- Added for invitation expiry
  status TEXT DEFAULT 'active', -- 'active', 'pending', 'suspended'
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Widgets table - Enhanced with better metadata and analytics
CREATE TABLE widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  config JSONB DEFAULT '{}', -- Enhanced widget configuration
  is_active BOOLEAN DEFAULT false,
  embed_code TEXT, -- Pre-generated embed code
  total_raised DECIMAL(12,2) DEFAULT 0, -- Total amount raised
  total_donations INTEGER DEFAULT 0, -- Total number of donations
  last_donation_at TIMESTAMPTZ, -- Last donation timestamp
  analytics_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

-- Enhanced Causes table with better goal tracking
CREATE TABLE causes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Changed from title to name for consistency
  description TEXT,
  goal_amount DECIMAL(12,2), -- Increased precision
  raised_amount DECIMAL(12,2) DEFAULT 0, -- Current amount raised
  donor_count INTEGER DEFAULT 0, -- Number of donors
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0, -- For custom ordering
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Donations table with recurring payments and additional fields
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
  cause_id UUID REFERENCES causes(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- Added for better reporting
  
  -- Donor information
  donor_email TEXT,
  donor_name TEXT,
  donor_phone TEXT, -- Added phone field
  is_anonymous BOOLEAN DEFAULT false,
  
  -- Payment details
  amount DECIMAL(12,2) NOT NULL,
  fee_amount DECIMAL(10,2) DEFAULT 0, -- Processing fees
  net_amount DECIMAL(12,2) NOT NULL, -- Amount after fees
  currency TEXT DEFAULT 'USD',
  
  -- Frequency and recurring
  frequency TEXT DEFAULT 'one-time' CHECK (frequency IN ('one-time', 'monthly', 'yearly')), -- Added yearly
  is_recurring BOOLEAN DEFAULT false,
  recurring_subscription_id TEXT, -- For tracking recurring payments
  parent_donation_id UUID REFERENCES donations(id), -- For linking recurring payments
  
  -- Payment processing
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  payment_method TEXT, -- 'card', 'bank', 'paypal', etc.
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
  
  -- Additional fields from new widget
  message TEXT, -- Donor message/note
  dedication TEXT, -- In honor/memory of
  dedication_type TEXT CHECK (dedication_type IN ('honor', 'memory')), -- Type of dedication
  cover_fees BOOLEAN DEFAULT false, -- Whether donor chose to cover fees
  
  -- Metadata
  ip_address INET, -- For fraud prevention
  user_agent TEXT, -- Browser information
  referrer TEXT, -- Where the donation came from
  utm_source TEXT, -- Marketing attribution
  utm_medium TEXT,
  utm_campaign TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table - Enhanced for better accounting
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE,
  invoice_number TEXT UNIQUE, -- Human-readable invoice number
  amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  description TEXT,
  pdf_url TEXT,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Analytics table with more detailed metrics
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- Added for org-level analytics
  date DATE NOT NULL,
  
  -- Traffic metrics
  views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  
  -- Donation metrics
  donations_count INTEGER DEFAULT 0,
  donations_amount DECIMAL(12,2) DEFAULT 0,
  unique_donors INTEGER DEFAULT 0,
  
  -- Conversion metrics
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  average_donation DECIMAL(10,2) DEFAULT 0,
  
  -- Frequency breakdown
  one_time_donations INTEGER DEFAULT 0,
  monthly_donations INTEGER DEFAULT 0,
  yearly_donations INTEGER DEFAULT 0, -- Added yearly tracking
  
  -- Payment method breakdown
  card_donations INTEGER DEFAULT 0,
  bank_donations INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(widget_id, date)
);

-- Widget Sessions table - For tracking widget interactions
CREATE TABLE widget_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL, -- Unique session identifier
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  pages_viewed INTEGER DEFAULT 1,
  donated BOOLEAN DEFAULT false,
  donation_id UUID REFERENCES donations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Methods table - For storing donor payment preferences
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_email TEXT NOT NULL,
  stripe_payment_method_id TEXT UNIQUE,
  last_four TEXT,
  brand TEXT,
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription table - For managing recurring donations
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
  cause_id UUID REFERENCES causes(id) ON DELETE SET NULL,
  donor_email TEXT NOT NULL,
  donor_name TEXT,
  amount DECIMAL(12,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'yearly')),
  stripe_subscription_id TEXT UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'past_due', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Notification Types
CREATE TYPE notification_type AS ENUM (
  'donation_received',
  'recurring_donation_processed',
  'recurring_donation_failed',
  'goal_reached',
  'milestone_reached',
  'team_invitation',
  'team_member_joined',
  'team_member_left',
  'widget_created',
  'widget_updated',
  'widget_deactivated',
  'subscription_cancelled',
  'payment_method_expired',
  'system_alert',
  'security_alert'
);

-- Enhanced Notification Channels
CREATE TYPE notification_channel AS ENUM (
  'email',
  'in_app',
  'push',
  'webhook',
  'sms'
);

-- Notifications table (from migration)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  channels notification_channel[] DEFAULT ARRAY['email'::notification_channel, 'in_app'::notification_channel],
  read BOOLEAN DEFAULT false,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Notification Preferences table (from migration)
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  channels notification_channel[] DEFAULT ARRAY['email'::notification_channel, 'in_app'::notification_channel],
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id, type)
);

-- System Alerts table (from migration)
CREATE TABLE system_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'super_admins', 'owners', 'specific_org')),
  target_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  acknowledged_by TEXT[],
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Email Queue table (from migration)
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email TEXT NOT NULL,
  from_email TEXT DEFAULT 'PassItOn <noreply@passiton.app>',
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comprehensive indexes for better performance
CREATE INDEX idx_organizations_clerk_org_id ON organizations(clerk_org_id);
CREATE INDEX idx_organizations_stripe_customer_id ON organizations(stripe_customer_id);

CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_invitation_token ON users(invitation_token);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_widgets_organization_id ON widgets(organization_id);
CREATE INDEX idx_widgets_slug ON widgets(slug);
CREATE INDEX idx_widgets_is_active ON widgets(is_active);

CREATE INDEX idx_causes_organization_id ON causes(organization_id);
CREATE INDEX idx_causes_widget_id ON causes(widget_id);
CREATE INDEX idx_causes_is_active ON causes(is_active);

CREATE INDEX idx_donations_widget_id ON donations(widget_id);
CREATE INDEX idx_donations_cause_id ON donations(cause_id);
CREATE INDEX idx_donations_organization_id ON donations(organization_id);
CREATE INDEX idx_donations_donor_email ON donations(donor_email);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_frequency ON donations(frequency);
CREATE INDEX idx_donations_is_recurring ON donations(is_recurring);
CREATE INDEX idx_donations_created_at ON donations(created_at);
CREATE INDEX idx_donations_amount ON donations(amount);

CREATE INDEX idx_analytics_widget_id ON analytics(widget_id);
CREATE INDEX idx_analytics_organization_id ON analytics(organization_id);
CREATE INDEX idx_analytics_date ON analytics(date);

CREATE INDEX idx_widget_sessions_widget_id ON widget_sessions(widget_id);
CREATE INDEX idx_widget_sessions_session_id ON widget_sessions(session_id);
CREATE INDEX idx_widget_sessions_started_at ON widget_sessions(started_at);

CREATE INDEX idx_subscriptions_widget_id ON subscriptions(widget_id);
CREATE INDEX idx_subscriptions_donor_email ON subscriptions(donor_email);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_organization_id ON notification_preferences(organization_id);

CREATE INDEX idx_system_alerts_active ON system_alerts(active);
CREATE INDEX idx_system_alerts_target_audience ON system_alerts(target_audience);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled_for ON email_queue(scheduled_for);

-- Functions and triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_widgets_updated_at BEFORE UPDATE ON widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_causes_updated_at BEFORE UPDATE ON causes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update widget totals when donations change
CREATE OR REPLACE FUNCTION update_widget_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update widget totals for completed donations
  IF (TG_OP = 'INSERT' AND NEW.status = 'completed') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed') THEN
    
    UPDATE widgets 
    SET 
      total_raised = total_raised + NEW.amount,
      total_donations = total_donations + 1,
      last_donation_at = NEW.created_at
    WHERE id = NEW.widget_id;
    
    -- Update cause totals if cause is specified
    IF NEW.cause_id IS NOT NULL THEN
      UPDATE causes 
      SET 
        raised_amount = raised_amount + NEW.amount,
        donor_count = donor_count + 1
      WHERE id = NEW.cause_id;
    END IF;
    
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status != 'completed') THEN
    
    -- Reverse the totals if donation is no longer completed
    UPDATE widgets 
    SET 
      total_raised = total_raised - OLD.amount,
      total_donations = total_donations - 1
    WHERE id = OLD.widget_id;
    
    IF OLD.cause_id IS NOT NULL THEN
      UPDATE causes 
      SET 
        raised_amount = raised_amount - OLD.amount,
        donor_count = donor_count - 1
      WHERE id = OLD.cause_id;
    END IF;
    
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_widget_totals_trigger
AFTER INSERT OR UPDATE ON donations
FOR EACH ROW EXECUTE FUNCTION update_widget_totals();

-- Function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id, organization_id, type, channels, enabled)
  VALUES 
    (NEW.id, NEW.organization_id, 'donation_received', ARRAY['email'::notification_channel, 'in_app'::notification_channel], true),
    (NEW.id, NEW.organization_id, 'recurring_donation_processed', ARRAY['email'::notification_channel], true),
    (NEW.id, NEW.organization_id, 'recurring_donation_failed', ARRAY['email'::notification_channel], true),
    (NEW.id, NEW.organization_id, 'goal_reached', ARRAY['email'::notification_channel, 'in_app'::notification_channel], true),
    (NEW.id, NEW.organization_id, 'milestone_reached', ARRAY['in_app'::notification_channel], true),
    (NEW.id, NEW.organization_id, 'team_invitation', ARRAY['email'::notification_channel], true),
    (NEW.id, NEW.organization_id, 'widget_created', ARRAY['in_app'::notification_channel], true),
    (NEW.id, NEW.organization_id, 'subscription_cancelled', ARRAY['email'::notification_channel], true)
  ON CONFLICT (user_id, organization_id, type) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_notification_preferences
AFTER INSERT ON users
FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();

-- Views for common queries
CREATE VIEW widget_stats AS
SELECT 
  w.id,
  w.name,
  w.organization_id,
  w.total_raised,
  w.total_donations,
  w.last_donation_at,
  COUNT(DISTINCT d.donor_email) as unique_donors,
  AVG(d.amount) as average_donation,
  COUNT(CASE WHEN d.frequency = 'monthly' THEN 1 END) as monthly_donations,
  COUNT(CASE WHEN d.frequency = 'yearly' THEN 1 END) as yearly_donations,
  COUNT(CASE WHEN d.frequency = 'one-time' THEN 1 END) as one_time_donations
FROM widgets w
LEFT JOIN donations d ON w.id = d.widget_id AND d.status = 'completed'
GROUP BY w.id, w.name, w.organization_id, w.total_raised, w.total_donations, w.last_donation_at;

-- View for donation analytics
CREATE VIEW donation_analytics AS
SELECT 
  d.widget_id,
  d.organization_id,
  DATE(d.created_at) as donation_date,
  COUNT(*) as donations_count,
  SUM(d.amount) as total_amount,
  AVG(d.amount) as average_amount,
  COUNT(DISTINCT d.donor_email) as unique_donors,
  COUNT(CASE WHEN d.frequency = 'monthly' THEN 1 END) as monthly_count,
  COUNT(CASE WHEN d.frequency = 'yearly' THEN 1 END) as yearly_count,
  COUNT(CASE WHEN d.cover_fees = true THEN 1 END) as covered_fees_count
FROM donations d
WHERE d.status = 'completed'
GROUP BY d.widget_id, d.organization_id, DATE(d.created_at);

-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (simplified - expand based on security requirements)
-- Organizations
CREATE POLICY "Users can view their organization" ON organizations
FOR SELECT USING (
  id IN (SELECT organization_id FROM users WHERE id = auth.uid()::text)
);

-- Users
CREATE POLICY "Users can view organization members" ON users
FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()::text)
);

-- Widgets
CREATE POLICY "Users can view organization widgets" ON widgets
FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()::text)
);

-- Donations
CREATE POLICY "Users can view organization donations" ON donations
FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()::text)
);

-- Super admin policies
CREATE POLICY "Super admins can view all" ON organizations
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'super_admin')
);

CREATE POLICY "Super admins can manage all users" ON users
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'super_admin')
);

CREATE POLICY "Super admins can manage all widgets" ON widgets
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'super_admin')
);