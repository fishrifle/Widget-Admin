-- Add invitation_token column if it doesn't exist
-- This fixes the PGRST204 error when sending invitations

-- Add invitation_token column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS invitation_token TEXT;

-- Add any other missing columns for invitations
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted'));

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

-- Update the role constraint to include super_admin if not already present
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'owner', 'editor'));