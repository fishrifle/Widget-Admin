-- PassItOn Admin Clean Database Schema
-- Comprehensive schema without problematic test data

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing schema for fresh setup
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
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

-- Create comprehensive indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_widgets_organization_id ON widgets(organization_id);
CREATE INDEX idx_widgets_is_active ON widgets(is_active);
CREATE INDEX idx_causes_organization_id ON causes(organization_id);
CREATE INDEX idx_donations_organization_id ON donations(organization_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

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
CREATE TRIGGER update_widgets_updated_at BEFORE UPDATE ON widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_causes_updated_at BEFORE UPDATE ON causes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id, type, channels, enabled, frequency)
  VALUES 
    (NEW.id, 'donation_received', ARRAY['email'::notification_channel, 'in_app'::notification_channel], true, 'immediate'),
    (NEW.id, 'recurring_donation_processed', ARRAY['email'::notification_channel], true, 'immediate'),
    (NEW.id, 'goal_reached', ARRAY['email'::notification_channel, 'in_app'::notification_channel], true, 'immediate'),
    (NEW.id, 'team_invitation_sent', ARRAY['email'::notification_channel], true, 'immediate'),
    (NEW.id, 'widget_created', ARRAY['in_app'::notification_channel], true, 'immediate')
  ON CONFLICT (user_id, type) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_notification_preferences
AFTER INSERT ON users
FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Users can view their organization" ON organizations
FOR SELECT USING (
  id IN (SELECT organization_id FROM users WHERE id = auth.uid()::text)
  OR auth.uid()::text IN (SELECT id FROM users WHERE role = 'super_admin')
);

CREATE POLICY "Users can view organization members" ON users
FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()::text)
  OR auth.uid()::text IN (SELECT id FROM users WHERE role = 'super_admin')
  OR id = auth.uid()::text
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

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

COMMIT;