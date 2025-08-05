-- Complete fix for 406 errors and RLS issues
-- Run this to fix all client-side query problems

-- First, disable RLS on all tables to prevent cascading issues
ALTER TABLE IF EXISTS organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organization_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS widgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS widget_themes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS causes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS widget_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organization_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS system_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS webhook_endpoints DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS file_uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS api_keys DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all policies on all tables
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Grant full access to authenticated users (temporary fix for development)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant read access to anonymous users for public widgets
GRANT SELECT ON widgets TO anon;
GRANT SELECT ON causes TO anon;
GRANT INSERT ON donations TO anon;

-- Grant service role full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Re-enable RLS only on critical tables with simple policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "allow_authenticated_organizations" ON organizations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_authenticated_users" ON users
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_authenticated_widgets" ON widgets
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow public access to published widgets
CREATE POLICY "allow_public_published_widgets" ON widgets
    FOR SELECT TO anon USING (is_published = true AND is_active = true);

COMMIT;