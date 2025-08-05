-- Complete PassItOn Admin Schema with Organization Creation
-- This schema includes full organization management, user roles, and webhook support

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for fresh setup)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;

-- Enhanced Organizations table with onboarding support
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_org_id TEXT UNIQUE,
  name TEXT NOT NULL,
  display_name TEXT,
  slug TEXT UNIQUE, -- URL-friendly identifier
  email TEXT,
  website TEXT,
  description TEXT,
  logo_url TEXT,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '500+')),
  
  -- Stripe integration
  stripe_customer_id TEXT UNIQUE,
  stripe_connect_account_id TEXT UNIQUE,
  stripe_connect_status TEXT DEFAULT 'not_connected' CHECK (stripe_connect_status IN ('not_connected', 'pending', 'connected', 'restricted')),
  
  -- Subscription and billing
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled', 'incomplete')),
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'professional', 'enterprise')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  
  -- Settings and preferences
  settings JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 1,
  
  -- Status and metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Users table with detailed role management
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  
  -- Role and permissions
  role TEXT DEFAULT 'member' CHECK (role IN ('super_admin', 'owner', 'admin', 'editor', 'viewer', 'member')),
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[], -- Additional granular permissions
  
  -- Invitation system
  invitation_token TEXT UNIQUE,
  invitation_expires_at TIMESTAMPTZ,
  invited_by TEXT REFERENCES users(id),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  -- Status and activity tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'inactive')),
  last_login_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  login_count INTEGER DEFAULT 0,
  
  -- Preferences
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  notification_preferences JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure email uniqueness within organizations
  UNIQUE(email, organization_id)
);

-- Organization Invitations table (separate from users for better tracking)
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer', 'member')),
  invited_by TEXT NOT NULL REFERENCES users(id),
  invitation_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64url'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, email)
);

-- Widgets table with enhanced configuration
CREATE TABLE widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  
  -- Widget configuration and customization
  config JSONB DEFAULT '{}',
  theme JSONB DEFAULT '{}',
  
  -- Widget state and analytics
  is_active BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  embed_code TEXT,
  domain_whitelist TEXT[] DEFAULT ARRAY[]::TEXT[], -- Allowed domains for embedding
  
  -- Performance metrics
  total_raised DECIMAL(12,2) DEFAULT 0,
  total_donations INTEGER DEFAULT 0,
  unique_donors_count INTEGER DEFAULT 0,
  last_donation_at TIMESTAMPTZ,
  
  -- Widget settings
  analytics_enabled BOOLEAN DEFAULT true,
  allow_anonymous_donations BOOLEAN DEFAULT true,
  require_donor_info BOOLEAN DEFAULT false,
  custom_css TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, slug)
);

-- Widget Themes table (for reusable themes)
CREATE TABLE widget_themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Default Theme',
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#10B981',
  background_color TEXT DEFAULT '#FFFFFF',
  text_color TEXT DEFAULT '#1F2937',
  button_color TEXT DEFAULT '#3B82F6',
  font_family TEXT DEFAULT 'Inter',
  border_radius INTEGER DEFAULT 8,
  custom_css TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Causes/Initiatives table
CREATE TABLE causes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  
  -- Financial tracking
  goal_amount DECIMAL(12,2),
  raised_amount DECIMAL(12,2) DEFAULT 0,
  donor_count INTEGER DEFAULT 0,
  
  -- Configuration
  suggested_amounts INTEGER[] DEFAULT ARRAY[1000, 2500, 5000, 10000], -- in cents
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  -- Metadata
  slug TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  start_date DATE,
  end_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, slug)
);

-- Donations table with comprehensive tracking
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  cause_id UUID REFERENCES causes(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Donor information
  donor_email TEXT,
  donor_name TEXT,
  donor_phone TEXT,
  donor_address JSONB, -- Structured address data
  is_anonymous BOOLEAN DEFAULT false,
  
  -- Payment details
  amount DECIMAL(12,2) NOT NULL, -- Original amount
  fee_amount DECIMAL(10,2) DEFAULT 0, -- Processing fees
  tip_amount DECIMAL(10,2) DEFAULT 0, -- Optional tip/cover fees
  net_amount DECIMAL(12,2) NOT NULL, -- Amount after fees
  currency TEXT DEFAULT 'USD',
  
  -- Frequency and recurring
  frequency TEXT DEFAULT 'one-time' CHECK (frequency IN ('one-time', 'monthly', 'quarterly', 'yearly')),
  is_recurring BOOLEAN DEFAULT false,
  recurring_subscription_id TEXT,
  parent_donation_id UUID REFERENCES donations(id),
  
  -- Payment processing
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_customer_id TEXT,
  payment_method_type TEXT, -- 'card', 'bank_transfer', 'paypal', etc.
  payment_method_details JSONB DEFAULT '{}',
  
  -- Transaction status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed', 'cancelled')),
  failure_reason TEXT,
  refund_reason TEXT,
  refunded_amount DECIMAL(10,2) DEFAULT 0,
  refunded_at TIMESTAMPTZ,
  
  -- Donor engagement
  message TEXT, -- Personal message from donor
  dedication TEXT, -- In honor/memory of
  dedication_type TEXT CHECK (dedication_type IN ('honor', 'memory')),
  cover_fees BOOLEAN DEFAULT false,
  share_contact_info BOOLEAN DEFAULT false,
  newsletter_opt_in BOOLEAN DEFAULT false,
  
  -- Attribution and analytics
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  cause_id UUID REFERENCES causes(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Subscription details
  donor_email TEXT NOT NULL,
  donor_name TEXT,
  amount DECIMAL(12,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
  
  -- Stripe integration
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_payment_method_id TEXT,
  
  -- Status and lifecycle
  status TEXT DEFAULT 'active' CHECK (status IN ('incomplete', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  
  -- Cancellation and changes
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  pause_collection_behavior TEXT, -- 'keep_as_draft', 'mark_uncollectible', 'void'
  
  -- Payment tracking
  total_payments INTEGER DEFAULT 0,
  total_amount_paid DECIMAL(12,2) DEFAULT 0,
  failed_payment_count INTEGER DEFAULT 0,
  last_payment_at TIMESTAMPTZ,
  next_payment_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Methods table (for storing customer payment methods)
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  
  -- Card details (if applicable)
  type TEXT NOT NULL, -- 'card', 'sepa_debit', 'bank_transfer', etc.
  card_brand TEXT,
  card_last_four TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  card_country TEXT,
  
  -- Bank details (if applicable)
  bank_name TEXT,
  bank_account_last_four TEXT,
  
  -- Status and metadata
  is_default BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table for billing and accounting
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Invoice identification
  invoice_number TEXT UNIQUE NOT NULL,
  stripe_invoice_id TEXT UNIQUE,
  
  -- Amounts
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  amount_due DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Status and dates
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'past_due', 'canceled', 'uncollectible')),
  created_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  
  -- Content and attachments
  description TEXT,
  line_items JSONB DEFAULT '[]',
  pdf_url TEXT,
  hosted_invoice_url TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics and reporting tables
CREATE TABLE widget_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Traffic metrics
  views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  
  -- Donation metrics
  donations_count INTEGER DEFAULT 0,
  donations_amount DECIMAL(12,2) DEFAULT 0,
  unique_donors INTEGER DEFAULT 0,
  
  -- Conversion metrics
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  average_donation DECIMAL(10,2) DEFAULT 0,
  bounce_rate DECIMAL(5,4) DEFAULT 0,
  
  -- Frequency breakdown
  one_time_donations INTEGER DEFAULT 0,
  monthly_donations INTEGER DEFAULT 0,
  quarterly_donations INTEGER DEFAULT 0,
  yearly_donations INTEGER DEFAULT 0,
  
  -- Payment method breakdown
  card_donations INTEGER DEFAULT 0,
  bank_donations INTEGER DEFAULT 0,
  other_payment_donations INTEGER DEFAULT 0,
  
  -- Geographic and demographic data
  top_countries JSONB DEFAULT '{}',
  top_referrers JSONB DEFAULT '{}',
  device_breakdown JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(widget_id, date)
);

-- Organization Analytics
CREATE TABLE organization_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Overall metrics
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_donations INTEGER DEFAULT 0,
  unique_donors INTEGER DEFAULT 0,
  active_widgets INTEGER DEFAULT 0,
  
  -- Growth metrics
  new_donors INTEGER DEFAULT 0,
  returning_donors INTEGER DEFAULT 0,
  donor_retention_rate DECIMAL(5,4) DEFAULT 0,
  
  -- Performance metrics
  average_donation_amount DECIMAL(10,2) DEFAULT 0,
  largest_donation DECIMAL(10,2) DEFAULT 0,
  recurring_revenue DECIMAL(12,2) DEFAULT 0,
  recurring_donors INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, date)
);

-- Widget Sessions for detailed analytics
CREATE TABLE widget_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  
  -- User information
  ip_address INET,
  user_agent TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  
  -- Session details
  referrer TEXT,
  landing_page TEXT,
  pages_viewed INTEGER DEFAULT 1,
  session_duration INTEGER, -- in seconds
  
  -- Conversion tracking
  donated BOOLEAN DEFAULT false,
  donation_id UUID REFERENCES donations(id),
  donation_amount DECIMAL(10,2),
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications system
CREATE TYPE notification_type AS ENUM (
  'donation_received',
  'recurring_donation_processed',
  'recurring_donation_failed',
  'subscription_cancelled',
  'goal_reached',
  'milestone_reached',
  'team_invitation_sent',
  'team_invitation_accepted',
  'team_member_joined',
  'team_member_left',
  'widget_created',
  'widget_published',
  'widget_deactivated',
  'payment_method_expired',
  'subscription_expiring',
  'trial_expiring',
  'invoice_payment_succeeded',
  'invoice_payment_failed',
  'payout_paid',
  'payout_failed',
  'system_alert',
  'security_alert',
  'account_suspended',
  'account_reactivated'
);

CREATE TYPE notification_channel AS ENUM (
  'email',
  'in_app',
  'push',
  'webhook',
  'sms',
  'slack'
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Notification content
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  
  -- Delivery
  channels notification_channel[] DEFAULT ARRAY['email'::notification_channel, 'in_app'::notification_channel],
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Status tracking
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  failed BOOLEAN DEFAULT false,
  failure_reason TEXT,
  
  -- Rich data and metadata
  data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Lifecycle
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  type notification_type NOT NULL,
  channels notification_channel[] DEFAULT ARRAY['email'::notification_channel, 'in_app'::notification_channel],
  enabled BOOLEAN DEFAULT true,
  
  -- Frequency settings
  frequency TEXT DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'hourly', 'daily', 'weekly', 'never')),
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, type)
);

-- System Alerts
CREATE TABLE system_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success', 'maintenance')),
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Targeting
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'super_admins', 'owners', 'specific_org', 'specific_users')),
  target_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  target_user_ids TEXT[],
  
  -- Content and actions
  action_text TEXT,
  action_url TEXT,
  dismissible BOOLEAN DEFAULT true,
  
  -- Lifecycle
  active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  acknowledged_by TEXT[],
  
  -- Metadata
  data JSONB DEFAULT '{}',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Queue for reliable email delivery
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Email details
  to_email TEXT NOT NULL,
  from_email TEXT DEFAULT 'PassItOn <noreply@passitonapp.com>',
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  
  -- Attachments and metadata
  attachments JSONB DEFAULT '[]',
  headers JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Delivery tracking
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  provider TEXT DEFAULT 'resend', -- 'resend', 'sendgrid', 'mailgun', etc.
  
  -- Retry logic
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Endpoints for organization integrations
CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  url TEXT NOT NULL,
  description TEXT,
  events TEXT[] NOT NULL, -- Array of event types to listen for
  is_active BOOLEAN DEFAULT true,
  
  -- Security
  secret_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Status and reliability
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Deliveries for tracking webhook attempts
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  
  -- Delivery attempt tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  response_status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  
  -- Timing
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  next_attempt_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Log for audit trail
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Actor (who performed the action)
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Action details
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'widget', 'donation', 'user', etc.
  resource_id TEXT,
  
  -- Change tracking
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- File Uploads (for logos, images, etc.)
CREATE TABLE file_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  
  -- File details
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  
  -- Storage
  storage_provider TEXT DEFAULT 'supabase' CHECK (storage_provider IN ('supabase', 's3', 'cloudinary')),
  storage_path TEXT NOT NULL,
  public_url TEXT,
  
  -- Usage tracking
  usage_type TEXT, -- 'logo', 'cause_image', 'avatar', etc.
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys for programmatic access
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL, -- First few characters for identification
  key_hash TEXT NOT NULL, -- Hashed version of the full key
  
  -- Permissions and scoping
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read'], -- 'read', 'write', 'admin'
  
  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  
  -- Lifecycle
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comprehensive indexes
CREATE INDEX idx_organizations_clerk_org_id ON organizations(clerk_org_id);
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_stripe_customer_id ON organizations(stripe_customer_id);
CREATE INDEX idx_organizations_subscription_status ON organizations(subscription_status);
CREATE INDEX idx_organizations_status ON organizations(status);

CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_invitation_token ON users(invitation_token);

CREATE INDEX idx_organization_invitations_organization_id ON organization_invitations(organization_id);
CREATE INDEX idx_organization_invitations_email ON organization_invitations(email);
CREATE INDEX idx_organization_invitations_token ON organization_invitations(invitation_token);
CREATE INDEX idx_organization_invitations_status ON organization_invitations(status);

CREATE INDEX idx_widgets_organization_id ON widgets(organization_id);
CREATE INDEX idx_widgets_slug ON widgets(slug);
CREATE INDEX idx_widgets_is_active ON widgets(is_active);
CREATE INDEX idx_widgets_is_published ON widgets(is_published);

CREATE INDEX idx_causes_organization_id ON causes(organization_id);
CREATE INDEX idx_causes_widget_id ON causes(widget_id);
CREATE INDEX idx_causes_slug ON causes(slug);
CREATE INDEX idx_causes_is_active ON causes(is_active);

CREATE INDEX idx_donations_widget_id ON donations(widget_id);
CREATE INDEX idx_donations_cause_id ON donations(cause_id);
CREATE INDEX idx_donations_organization_id ON donations(organization_id);
CREATE INDEX idx_donations_donor_email ON donations(donor_email);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_frequency ON donations(frequency);
CREATE INDEX idx_donations_is_recurring ON donations(is_recurring);
CREATE INDEX idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX idx_donations_amount ON donations(amount);
CREATE INDEX idx_donations_stripe_payment_intent_id ON donations(stripe_payment_intent_id);

CREATE INDEX idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_widget_id ON subscriptions(widget_id);
CREATE INDEX idx_subscriptions_donor_email ON subscriptions(donor_email);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_next_payment_at ON subscriptions(next_payment_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX idx_webhook_endpoints_organization_id ON webhook_endpoints(organization_id);
CREATE INDEX idx_webhook_deliveries_webhook_endpoint_id ON webhook_deliveries(webhook_endpoint_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_next_attempt_at ON webhook_deliveries(next_attempt_at);

CREATE INDEX idx_activity_logs_organization_id ON activity_logs(organization_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_resource_type ON activity_logs(resource_type);

-- Function for setting user context (used in activity logging)
CREATE OR REPLACE FUNCTION set_current_user_id(user_id TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Functions and triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organization_invitations_updated_at BEFORE UPDATE ON organization_invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_widgets_updated_at BEFORE UPDATE ON widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_widget_themes_updated_at BEFORE UPDATE ON widget_themes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_causes_updated_at BEFORE UPDATE ON causes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_alerts_updated_at BEFORE UPDATE ON system_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhook_endpoints_updated_at BEFORE UPDATE ON webhook_endpoints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update widget and cause totals when donations change
CREATE OR REPLACE FUNCTION update_donation_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle completed donations
  IF (TG_OP = 'INSERT' AND NEW.status = 'completed') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed') THEN
    
    -- Update widget totals
    UPDATE widgets 
    SET 
      total_raised = total_raised + NEW.net_amount,
      total_donations = total_donations + 1,
      last_donation_at = NEW.created_at
    WHERE id = NEW.widget_id;
    
    -- Update cause totals if specified
    IF NEW.cause_id IS NOT NULL THEN
      UPDATE causes 
      SET 
        raised_amount = raised_amount + NEW.net_amount,
        donor_count = donor_count + 1
      WHERE id = NEW.cause_id;
    END IF;
    
    -- Update unique donors count for widget
    UPDATE widgets 
    SET unique_donors_count = (
      SELECT COUNT(DISTINCT donor_email) 
      FROM donations 
      WHERE widget_id = NEW.widget_id 
        AND status = 'completed' 
        AND donor_email IS NOT NULL
    )
    WHERE id = NEW.widget_id;
    
  -- Handle donations no longer completed (refunds, etc.)
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status != 'completed') THEN
    
    -- Reverse widget totals
    UPDATE widgets 
    SET 
      total_raised = GREATEST(0, total_raised - OLD.net_amount),
      total_donations = GREATEST(0, total_donations - 1)
    WHERE id = OLD.widget_id;
    
    -- Reverse cause totals
    IF OLD.cause_id IS NOT NULL THEN
      UPDATE causes 
      SET 
        raised_amount = GREATEST(0, raised_amount - OLD.net_amount),
        donor_count = GREATEST(0, donor_count - 1)
      WHERE id = OLD.cause_id;
    END IF;
    
    -- Update unique donors count
    UPDATE widgets 
    SET unique_donors_count = (
      SELECT COUNT(DISTINCT donor_email) 
      FROM donations 
      WHERE widget_id = OLD.widget_id 
        AND status = 'completed' 
        AND donor_email IS NOT NULL
    )
    WHERE id = OLD.widget_id;
    
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_donation_totals_trigger
AFTER INSERT OR UPDATE ON donations
FOR EACH ROW EXECUTE FUNCTION update_donation_totals();

-- Function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id, type, channels, enabled, frequency)
  VALUES 
    (NEW.id, 'donation_received', ARRAY['email'::notification_channel, 'in_app'::notification_channel], true, 'immediate'),
    (NEW.id, 'recurring_donation_processed', ARRAY['email'::notification_channel], true, 'immediate'),
    (NEW.id, 'recurring_donation_failed', ARRAY['email'::notification_channel], true, 'immediate'),
    (NEW.id, 'goal_reached', ARRAY['email'::notification_channel, 'in_app'::notification_channel], true, 'immediate'),
    (NEW.id, 'milestone_reached', ARRAY['in_app'::notification_channel], true, 'immediate'),
    (NEW.id, 'team_invitation_sent', ARRAY['email'::notification_channel], true, 'immediate'),
    (NEW.id, 'team_member_joined', ARRAY['in_app'::notification_channel], true, 'immediate'),
    (NEW.id, 'widget_created', ARRAY['in_app'::notification_channel], true, 'immediate'),
    (NEW.id, 'subscription_cancelled', ARRAY['email'::notification_channel], true, 'immediate'),
    (NEW.id, 'trial_expiring', ARRAY['email'::notification_channel, 'in_app'::notification_channel], true, 'immediate')
  ON CONFLICT (user_id, type) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_notification_preferences
AFTER INSERT ON users
FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();

-- Function to log activities
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
  user_id_val TEXT;
  org_id_val UUID;
  action_val TEXT;
  resource_type_val TEXT;
  resource_id_val TEXT;
BEGIN
  -- Extract user and org from context or record
  user_id_val := current_setting('app.current_user_id', true);
  
  -- Determine action based on trigger operation
  action_val := CASE TG_OP
    WHEN 'INSERT' THEN 'created'
    WHEN 'UPDATE' THEN 'updated'
    WHEN 'DELETE' THEN 'deleted'
  END;
  
  -- Determine resource type and ID based on table
  resource_type_val := TG_TABLE_NAME;
  
  IF TG_OP = 'DELETE' THEN
    resource_id_val := OLD.id::TEXT;
    org_id_val := COALESCE(OLD.organization_id, (SELECT organization_id FROM users WHERE id = user_id_val));
  ELSE
    resource_id_val := NEW.id::TEXT;
    org_id_val := COALESCE(NEW.organization_id, (SELECT organization_id FROM users WHERE id = user_id_val));
  END IF;
  
  -- Insert activity log (only if we have a user context)
  IF user_id_val IS NOT NULL AND user_id_val != '' THEN
    INSERT INTO activity_logs (
      user_id, 
      organization_id, 
      action, 
      resource_type, 
      resource_id,
      old_values,
      new_values
    ) VALUES (
      user_id_val,
      org_id_val,
      action_val,
      resource_type_val,
      resource_id_val,
      CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply activity logging to key tables
CREATE TRIGGER log_organizations_activity AFTER INSERT OR UPDATE OR DELETE ON organizations FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER log_users_activity AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER log_widgets_activity AFTER INSERT OR UPDATE OR DELETE ON widgets FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER log_donations_activity AFTER INSERT OR UPDATE OR DELETE ON donations FOR EACH ROW EXECUTE FUNCTION log_activity();

-- Useful views for common queries

-- Organization summary view
CREATE VIEW organization_summary AS
SELECT 
  o.id,
  o.name,
  o.display_name,
  o.slug,
  o.subscription_status,
  o.subscription_plan,
  o.stripe_connect_status,
  o.created_at,
  
  -- Counts
  (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id AND u.status = 'active') as active_users,
  (SELECT COUNT(*) FROM widgets w WHERE w.organization_id = o.id AND w.is_active = true) as active_widgets,
  (SELECT COUNT(*) FROM donations d WHERE d.organization_id = o.id AND d.status = 'completed') as total_donations,
  
  -- Financial metrics
  (SELECT COALESCE(SUM(d.net_amount), 0) FROM donations d WHERE d.organization_id = o.id AND d.status = 'completed') as total_revenue,
  (SELECT COUNT(DISTINCT d.donor_email) FROM donations d WHERE d.organization_id = o.id AND d.status = 'completed' AND d.donor_email IS NOT NULL) as unique_donors,
  
  -- Recent activity
  (SELECT MAX(d.created_at) FROM donations d WHERE d.organization_id = o.id AND d.status = 'completed') as last_donation_at
FROM organizations o;

-- Widget performance view
CREATE VIEW widget_performance AS
SELECT 
  w.id,
  w.name,
  w.organization_id,
  w.is_active,
  w.total_raised,
  w.total_donations,
  w.unique_donors_count,
  w.last_donation_at,
  
  -- Analytics
  COALESCE(AVG(d.amount), 0) as average_donation,
  COUNT(CASE WHEN d.frequency = 'monthly' THEN 1 END) as monthly_donors,
  COUNT(CASE WHEN d.is_recurring = true THEN 1 END) as recurring_donors,
  
  -- Conversion metrics (from last 30 days)
  (SELECT COALESCE(SUM(views), 0) 
   FROM widget_analytics 
   WHERE widget_id = w.id 
     AND date >= CURRENT_DATE - INTERVAL '30 days') as views_30d,
     
  (SELECT COALESCE(SUM(donations_count), 0) 
   FROM widget_analytics 
   WHERE widget_id = w.id 
     AND date >= CURRENT_DATE - INTERVAL '30 days') as donations_30d

FROM widgets w
LEFT JOIN donations d ON w.id = d.widget_id AND d.status = 'completed'
GROUP BY w.id, w.name, w.organization_id, w.is_active, w.total_raised, w.total_donations, w.unique_donors_count, w.last_donation_at;

-- Donor insights view
CREATE VIEW donor_insights AS
SELECT 
  d.donor_email,
  d.donor_name,
  d.organization_id,
  COUNT(*) as donation_count,
  SUM(d.net_amount) as total_donated,
  AVG(d.net_amount) as average_donation,
  MIN(d.created_at) as first_donation_at,
  MAX(d.created_at) as last_donation_at,
  COUNT(CASE WHEN d.frequency != 'one-time' THEN 1 END) as recurring_donations,
  BOOL_OR(d.is_recurring) as has_recurring_subscription,
  ARRAY_AGG(DISTINCT w.name) as supported_widgets
FROM donations d
JOIN widgets w ON d.widget_id = w.id
WHERE d.status = 'completed' 
  AND d.donor_email IS NOT NULL
GROUP BY d.donor_email, d.donor_name, d.organization_id;

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view their organization" ON organizations
FOR SELECT USING (
  id IN (SELECT organization_id FROM users WHERE id = auth.uid()::text)
  OR auth.uid()::text IN (SELECT id FROM users WHERE role = 'super_admin')
);

CREATE POLICY "Organization owners can update their organization" ON organizations
FOR UPDATE USING (
  id IN (SELECT organization_id FROM users WHERE id = auth.uid()::text AND role IN ('owner', 'admin'))
  OR auth.uid()::text IN (SELECT id FROM users WHERE role = 'super_admin')
);

-- Super admins can create and manage all organizations
CREATE POLICY "Super admins can manage all organizations" ON organizations
FOR ALL USING (
  auth.uid()::text IN (SELECT id FROM users WHERE role = 'super_admin')
);

-- Users: Organization members can see other members
CREATE POLICY "Users can view organization members" ON users
FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()::text)
  OR auth.uid()::text IN (SELECT id FROM users WHERE role = 'super_admin')
  OR id = auth.uid()::text
);

CREATE POLICY "Users can update their own profile" ON users
FOR UPDATE USING (id = auth.uid()::text);

CREATE POLICY "Organization admins can manage users" ON users
FOR ALL USING (
  organization_id IN (
    SELECT organization_id 
    FROM users 
    WHERE id = auth.uid()::text 
      AND role IN ('owner', 'admin')
  )
  OR auth.uid()::text IN (SELECT id FROM users WHERE role = 'super_admin')
);

-- Widgets: Organization members can see organization widgets
CREATE POLICY "Users can view organization widgets" ON widgets
FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()::text)
  OR auth.uid()::text IN (SELECT id FROM users WHERE role = 'super_admin')
);

CREATE POLICY "Users can manage organization widgets" ON widgets
FOR ALL USING (
  organization_id IN (
    SELECT organization_id 
    FROM users 
    WHERE id = auth.uid()::text 
      AND role IN ('owner', 'admin', 'editor')
  )
  OR auth.uid()::text IN (SELECT id FROM users WHERE role = 'super_admin')
);

-- Donations: Organization members can see organization donations
CREATE POLICY "Users can view organization donations" ON donations
FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()::text)
  OR auth.uid()::text IN (SELECT id FROM users WHERE role = 'super_admin')
);

-- Public widget access (for embedding)
CREATE POLICY "Public widget access" ON widgets
FOR SELECT USING (is_published = true AND is_active = true);

CREATE POLICY "Public widget donations" ON donations
FOR INSERT WITH CHECK (
  widget_id IN (SELECT id FROM widgets WHERE is_published = true AND is_active = true)
);

-- Grant appropriate permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant full access to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Insert some initial data for testing

-- Create a super admin user (you'll need to replace with actual Clerk user ID)
-- INSERT INTO users (id, email, first_name, last_name, role, status) 
-- VALUES ('user_xxxxxxxxxxxxxxxxxxxxxxxx', 'admin@passitonapp.com', 'Super', 'Admin', 'super_admin', 'active')
-- ON CONFLICT (id) DO UPDATE SET role = 'super_admin', status = 'active';

-- Create some notification types data
INSERT INTO notification_preferences (user_id, type, channels, enabled) 
SELECT 'temp_user', unnest(enum_range(NULL::notification_type)), ARRAY['email'::notification_channel], true
ON CONFLICT DO NOTHING;

-- Clean up temp data
DELETE FROM notification_preferences WHERE user_id = 'temp_user';

COMMIT;