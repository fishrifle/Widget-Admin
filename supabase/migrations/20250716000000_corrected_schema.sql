-- Corrected schema to match database types and fix inconsistencies
-- This migration updates the schema to be consistent throughout the application

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS public.donations CASCADE;
DROP TABLE IF EXISTS public.causes CASCADE;
DROP TABLE IF EXISTS public.widget_themes CASCADE;
DROP TABLE IF EXISTS public.widgets CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- Create organizations table (matches database.types.ts)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'past_due')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create users table (matches database.types.ts)
CREATE TABLE public.users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('super_admin', 'owner', 'editor')),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted')),
  invited_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  first_name TEXT,
  last_name TEXT,
  invitation_token TEXT
);

-- Create widgets table (matches database.types.ts)
CREATE TABLE public.widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create widget_themes table (matches database.types.ts)
CREATE TABLE public.widget_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES public.widgets(id) ON DELETE CASCADE,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#64748b',
  font_family TEXT DEFAULT 'inter',
  border_radius TEXT DEFAULT '8px',
  custom_css TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create causes table (matches database.types.ts)
CREATE TABLE public.causes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES public.widgets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  goal_amount INTEGER, -- Amount in cents
  raised_amount INTEGER DEFAULT 0, -- Amount in cents
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create donations table (matches database.types.ts)
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES public.widgets(id) ON DELETE CASCADE,
  cause_id UUID REFERENCES public.causes(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  donor_email TEXT,
  donor_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create invoices table (matches database.types.ts)
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Super admins can manage all users" ON public.users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'super_admin'
  )
);

-- RLS Policies for organizations table
CREATE POLICY "Super admins can manage all organizations" ON public.organizations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'super_admin'
  )
);

CREATE POLICY "Users can view their organization" ON public.organizations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.organization_id = organizations.id
  )
);

CREATE POLICY "Organization owners can update their organization" ON public.organizations
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.organization_id = organizations.id
    AND users.role IN ('owner', 'super_admin')
  )
);

-- Allow new organizations to be created during onboarding
CREATE POLICY "Allow organization creation during onboarding" ON public.organizations
FOR INSERT WITH CHECK (true);

-- RLS Policies for widgets table
CREATE POLICY "Super admins can manage all widgets" ON public.widgets
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'super_admin'
  )
);

CREATE POLICY "Organization members can manage their widgets" ON public.widgets
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.organization_id = widgets.organization_id
  )
);

-- Public read access for active widgets (for donation pages)
CREATE POLICY "Public can view active widgets" ON public.widgets
FOR SELECT USING (is_active = true);

-- RLS Policies for widget_themes table
CREATE POLICY "Organization members can manage their widget themes" ON public.widget_themes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.widgets w ON w.organization_id = u.organization_id
    WHERE u.id = auth.uid()::text 
    AND w.id = widget_themes.widget_id
  )
);

-- Public read access for themes of active widgets
CREATE POLICY "Public can view themes for active widgets" ON public.widget_themes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.widgets
    WHERE widgets.id = widget_themes.widget_id
    AND widgets.is_active = true
  )
);

-- RLS Policies for causes table
CREATE POLICY "Organization members can manage their causes" ON public.causes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.widgets w ON w.organization_id = u.organization_id
    WHERE u.id = auth.uid()::text 
    AND w.id = causes.widget_id
  )
);

-- Public read access for causes of active widgets
CREATE POLICY "Public can view causes for active widgets" ON public.causes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.widgets
    WHERE widgets.id = causes.widget_id
    AND widgets.is_active = true
  )
);

-- RLS Policies for donations table
CREATE POLICY "Super admins can view all donations" ON public.donations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'super_admin'
  )
);

CREATE POLICY "Organization members can view their donations" ON public.donations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.widgets w ON w.organization_id = u.organization_id
    WHERE u.id = auth.uid()::text 
    AND w.id = donations.widget_id
  )
);

-- Allow donations to be created (for public donation flow)
CREATE POLICY "Allow donation creation" ON public.donations
FOR INSERT WITH CHECK (true);

-- RLS Policies for invoices table
CREATE POLICY "Super admins can view all invoices" ON public.invoices
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'super_admin'
  )
);

CREATE POLICY "Organization members can view their invoices" ON public.invoices
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.organization_id = invoices.organization_id
  )
);

-- Create indexes for performance
CREATE INDEX idx_users_id ON public.users(id);
CREATE INDEX idx_users_organization_id ON public.users(organization_id);
CREATE INDEX idx_users_invitation_token ON public.users(invitation_token);
CREATE INDEX idx_widgets_organization_id ON public.widgets(organization_id);
CREATE INDEX idx_widgets_slug ON public.widgets(slug);
CREATE INDEX idx_widget_themes_widget_id ON public.widget_themes(widget_id);
CREATE INDEX idx_causes_widget_id ON public.causes(widget_id);
CREATE INDEX idx_donations_widget_id ON public.donations(widget_id);
CREATE INDEX idx_donations_cause_id ON public.donations(cause_id);
CREATE INDEX idx_invoices_organization_id ON public.invoices(organization_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_widgets_updated_at BEFORE UPDATE ON public.widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial super admin user (replace with your Clerk user ID)
-- INSERT INTO public.users (id, email, role) VALUES ('your-clerk-user-id', 'admin@yourcompany.com', 'super_admin');