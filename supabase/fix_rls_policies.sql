-- Fix RLS policies to prevent infinite recursion

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view organization members" ON users;
DROP POLICY IF EXISTS "Users can manage organization widgets" ON widgets;

-- Disable RLS temporarily to fix the policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE widgets DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;

-- Create fixed policies without infinite recursion

-- Organizations policies
CREATE POLICY "authenticated_users_can_select_organizations" ON organizations
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "authenticated_users_can_insert_organizations" ON organizations
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_users_can_update_organizations" ON organizations
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Users policies 
CREATE POLICY "authenticated_users_can_select_users" ON users
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "authenticated_users_can_insert_users" ON users
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_users_can_update_users" ON users
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Widgets policies
CREATE POLICY "authenticated_users_can_manage_widgets" ON widgets
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Causes policies
CREATE POLICY "authenticated_users_can_manage_causes" ON causes
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Donations policies
CREATE POLICY "authenticated_users_can_manage_donations" ON donations
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Notifications policies
CREATE POLICY "authenticated_users_can_manage_notifications" ON notifications
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Notification preferences policies
CREATE POLICY "authenticated_users_can_manage_notification_preferences" ON notification_preferences
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

COMMIT;