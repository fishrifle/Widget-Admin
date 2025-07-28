-- Initial schema setup for PassItOn Admin

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('super_admin', 'owner', 'editor')),
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  terms_of_service_url TEXT,
  logo_url TEXT,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create initiatives table (renamed from causes)
CREATE TABLE IF NOT EXISTS public.initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  goal_amount INTEGER, -- Amount in cents
  current_amount INTEGER DEFAULT 0, -- Amount in cents
  image_url TEXT,
  suggested_amounts INTEGER[] DEFAULT '{}', -- Array of amounts in cents
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create donations table
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID REFERENCES public.initiatives(id) NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  donor_email TEXT,
  donor_name TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
FOR SELECT USING (auth.uid()::text = clerk_id);

CREATE POLICY "Super admins can manage all users" ON public.users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.clerk_id = auth.uid()::text 
    AND users.role = 'super_admin'
  )
);

-- RLS Policies for organizations table
CREATE POLICY "Super admins can manage all organizations" ON public.organizations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.clerk_id = auth.uid()::text 
    AND users.role = 'super_admin'
  )
);

CREATE POLICY "Users can view their organization" ON public.organizations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.clerk_id = auth.uid()::text 
    AND users.organization_id = organizations.id
  )
);

CREATE POLICY "Organization owners can update their organization" ON public.organizations
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.clerk_id = auth.uid()::text 
    AND users.organization_id = organizations.id
    AND users.role IN ('owner', 'super_admin')
  )
);

-- Allow new organizations to be created during onboarding
CREATE POLICY "Allow organization creation during onboarding" ON public.organizations
FOR INSERT WITH CHECK (true);

-- RLS Policies for initiatives table
CREATE POLICY "Super admins can manage all initiatives" ON public.initiatives
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.clerk_id = auth.uid()::text 
    AND users.role = 'super_admin'
  )
);

CREATE POLICY "Organization members can manage their initiatives" ON public.initiatives
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.clerk_id = auth.uid()::text 
    AND users.organization_id = initiatives.organization_id
  )
);

-- RLS Policies for donations table
CREATE POLICY "Super admins can view all donations" ON public.donations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.clerk_id = auth.uid()::text 
    AND users.role = 'super_admin'
  )
);

CREATE POLICY "Organization members can view their donations" ON public.donations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.clerk_id = auth.uid()::text 
    AND users.organization_id = donations.organization_id
  )
);

-- Allow donations to be created (for public donation flow)
CREATE POLICY "Allow donation creation" ON public.donations
FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON public.users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_organization_id ON public.initiatives(organization_id);
CREATE INDEX IF NOT EXISTS idx_donations_initiative_id ON public.donations(initiative_id);
CREATE INDEX IF NOT EXISTS idx_donations_organization_id ON public.donations(organization_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_initiatives_updated_at BEFORE UPDATE ON public.initiatives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON public.donations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();