# Super Admin Setup Guide

## How to Create Super Admin Users

### Method 1: Database Direct (Recommended)

1. **Sign up a user** through the normal registration flow
2. **Get their user ID** from Clerk dashboard or database
3. **Update their role in Supabase**:

```sql
-- Replace 'user_clerk_id_here' with the actual Clerk user ID
UPDATE users 
SET role = 'super_admin', organization_id = NULL
WHERE id = 'user_clerk_id_here';
```

### Method 2: Admin API Endpoint (Future)

We can create an API endpoint that only existing super admins can use:

```typescript
// /api/admin/promote-user
// POST request with user email/id and new role
// Requires existing super admin authentication
```

### Method 3: Environment Variable Setup

For the first super admin, we can use environment variables:

```env
# Add to .env.local
SUPER_ADMIN_EMAILS=admin@yourcompany.com,support@yourcompany.com
```

## Role Hierarchy

1. **super_admin** - Platform administrators (your company)
   - Can access all organizations
   - Can view all widgets and users
   - Can provide customer support
   - No organization affiliation

2. **owner** - Organization owners (your customers)
   - Full access to their organization
   - Can invite team members
   - Can manage payments and settings

3. **editor** - Team members (organization staff)
   - Limited access to organization features
   - Can customize widgets and view data
   - Cannot manage team or payments

## Testing Role Assignment

1. Create a test account
2. Update their role in database
3. Sign out and sign back in
4. Check if admin section appears in sidebar
5. Test admin page access

## Security Notes

- Super admins should NOT belong to organizations
- Regular users cannot promote themselves
- Role changes require database access or super admin API
- Always verify role before granting admin access