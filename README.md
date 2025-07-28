# PassItOn Admin Dashboard

A multi-tenant admin dashboard for managing donation widgets, organizations, and team members built with Next.js 14, Supabase, and Clerk authentication.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Development](#development)
- [Architecture Overview](#architecture-overview)
- [Key Features](#key-features)
- [API Documentation](#api-documentation)
- [Stripe Setup Tutorial](#stripe-setup-tutorial)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd PassItOn-Admin

# Install dependencies
npm install

# Copy environment template
cp  .env.local

# Set up environment variables (see Environment Setup section)
# Start development server
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Prerequisites

Before setting up the project, ensure you have the following installed:

### Required Software
- **Node.js** (v18.17.0 or higher)
- **npm** (v9.6.7 or higher)
- **Git** (latest version)

### Required Services
- **Supabase** account (database & authentication)
- **Clerk** account (user management)
- **Stripe** account (payments)

### Development Tools (Recommended)
- **VS Code** with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd PassItOn-Admin
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:

**Core Dependencies:**
- `next` - React framework
- `react` & `react-dom` - React library
- `typescript` - Type safety
- `@supabase/supabase-js` - Database client
- `@clerk/nextjs` - Authentication
- `stripe` - Payment processing

**UI Dependencies:**
- `@radix-ui/*` - Headless UI components
- `tailwindcss` - CSS framework
- `lucide-react` - Icons
- `class-variance-authority` - Styling utilities

### 3. Environment Configuration

Copy the environment template:

```bash
cp   .env.local
```

## Environment Setup

Create a `.env.local` file in the project root with the following variables:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...
```

### Getting Environment Variables

#### Clerk Setup
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Copy the publishable and secret keys
4. Configure redirect URLs in Clerk dashboard

#### Supabase Setup
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Go to Settings → API
4. Copy the URL and anon key
5. Copy the service role key (for server-side operations)

#### Stripe Setup
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your API keys from Developers → API keys
3. Set up webhooks for `/api/webhooks/stripe`
4. Configure Stripe Connect (see Stripe Setup Tutorial below)

## Database Setup

### 1. Running Migrations

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Generate TypeScript types
npm run db:generate
```

### 2. Database Schema

The application uses the following main tables:

#### Organizations Table
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'trial',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### Users Table  
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('super_admin', 'owner', 'editor')),
  organization_id UUID REFERENCES organizations(id),
  status TEXT DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted')),
  invited_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  invitation_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### Widgets Table
```sql
CREATE TABLE widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### Donations Table
```sql
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID REFERENCES widgets(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  stripe_payment_intent_id TEXT,
  donor_email TEXT,
  donor_name TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Development

### Starting the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Available Scripts

```bash
npm run dev          # Start development server with Turbo
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push database schema
npm run db:generate  # Generate TypeScript types
```

### Development Workflow

1. **Environment Setup**
   - Copy `.env.example` to `.env.local`
   - Fill in all required environment variables
   - Run `npm install` to install dependencies

2. **Database Setup**
   - Create Supabase project
   - Run migrations with `supabase db push`
   - Generate types with `npm run db:generate`

3. **Authentication Setup**
   - Create Clerk application
   - Configure redirect URLs
   - Add API keys to environment

4. **Development Process**
   - Start dev server: `npm run dev`
   - Make changes to code
   - Test in browser (hot reload enabled)
   - Run linting: `npm run lint`
   - Test across different user roles

5. **Testing User Roles**
   - Create test users with different roles in database
   - Test super admin features at `/admin/*` routes
   - Test organization owner features at `/dashboard/*`
   - Test editor permissions and restrictions

### Code Structure Guidelines

#### Components
- Use TypeScript for all components
- Follow naming convention: `ComponentName.tsx`
- Keep components focused and reusable
- Use proper prop typing

#### API Routes
- Follow RESTful conventions
- Use proper HTTP status codes
- Implement error handling
- Add request validation

#### Database Operations
- Use Supabase client for frontend operations
- Use supabaseAdmin for server-side operations
- Implement proper error handling
- Follow Row Level Security (RLS) patterns

## Architecture Overview

### Project Structure

```
PassItOn-Admin/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Authentication routes
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── admin/                # Super admin pages
│   │   ├── dashboard/           # Organization dashboard
│   │   └── widget/              # Widget customization
│   └── api/                     # API routes
├── components/                  # Reusable React components
│   ├── dashboard/              # Dashboard-specific components
│   └── ui/                     # Base UI components
├── lib/                        # Utility functions
├── hooks/                      # Custom React hooks
├── types/                      # TypeScript definitions
└── supabase/                   # Database configuration
```

### Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - PostgreSQL database with real-time features
- **Clerk** - User authentication and management
- **Stripe** - Payment processing and Connect for multi-tenant

## Key Features

### Multi-Tenant Architecture

The application supports multiple organizations with role-based access:

**Roles:**
- **Super Admin** - Platform administration
- **Owner** - Organization management  
- **Editor** - Content management

### Authentication Flow

1. **Sign Up/Sign In** - Handled by Clerk
2. **Organization Assignment** - Users linked to organizations
3. **Role Detection** - Permissions based on user role
4. **Dashboard Routing** - Role-based dashboard access

## API Documentation

### Authentication
All API routes are protected by Clerk middleware. Include authentication headers:

```javascript
const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${await getToken()}`,
    'Content-Type': 'application/json'
  }
});
```

### Organizations API

#### GET `/api/organizations`
Get all organizations (Super Admin only)

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Acme Nonprofit",
    "email": "contact@acme.org",
    "subscription_status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### GET `/api/organizations/[orgId]`
Get specific organization details

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Acme Nonprofit",
  "email": "contact@acme.org",
  "stripe_customer_id": "cus_...",
  "subscription_status": "active",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Team Management API

#### POST `/api/team/invite`
Send team invitation

**Request Body:**
```json
{
  "email": "user@example.com",
  "role": "editor",
  "organizationId": "123e4567-e89b-12d3-a456-426614174000",
  "organizationName": "Acme Nonprofit"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitation sent successfully"
}
```

**Error Response:**
```json
{
  "error": "User already exists in this organization"
}
```

### Widget API

#### GET `/api/widgets`
Get organization's widgets

**Response:**
```json
[
  {
    "id": "widget-id",
    "name": "Main Donation Widget",
    "slug": "main-widget",
    "is_active": true,
    "config": {
      "theme": "light",
      "primaryColor": "#3B82F6"
    },
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Stripe Integration API

#### POST `/api/stripe/connect`
Initialize Stripe Connect onboarding

**Request Body:**
```json
{
  "organizationId": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### GET `/api/stripe/connect/status`
Check Stripe Connect account status

**Response:**
```json
{
  "connected": true,
  "account_id": "acct_...",
  "charges_enabled": true,
  "payouts_enabled": true
}
```

### Webhook Endpoints

#### POST `/api/webhooks/stripe`
Handle Stripe webhook events

**Events Handled:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.dispute.created`

#### POST `/api/webhooks/clerk`
Handle Clerk webhook events

**Events Handled:**
- `user.created`
- `user.updated`
- `user.deleted`

## Stripe Setup Tutorial

### For Customers: How to Connect Your Stripe Account

This tutorial helps customers connect their Stripe accounts to receive donations through their widgets.

#### Step 1: Access Stripe Connect Settings

1. **Log into your dashboard** at your organization's dashboard
2. **Navigate to Settings** → **Payment Settings**
3. **Click "Connect Stripe Account"**

#### Step 2: Stripe Account Setup

If you don't have a Stripe account:

1. **Go to [stripe.com](https://stripe.com)** and click "Start now"
2. **Create your account** with business information
3. **Verify your identity** (required for receiving payments)
4. **Add bank account** for payouts

#### Step 3: Connect to PassItOn

1. **Click "Connect with Stripe"** in your PassItOn dashboard
2. **You'll be redirected to Stripe** - log in if prompted
3. **Review permissions** - PassItOn needs to:
   - Process payments on your behalf
   - Access transaction data
   - Handle refunds and disputes
4. **Click "Connect account"** to authorize

#### Step 4: Verification

1. **Complete Stripe's verification process**:
   - Business details
   - Tax information  
   - Bank account verification
   - Identity documents (if required)

2. **Test your connection**:
   - Return to PassItOn dashboard
   - Status should show "Connected"
   - Make a test donation to verify

#### Step 5: Configure Payout Settings

1. **In your Stripe dashboard**, go to Settings → Payouts
2. **Set payout schedule** (daily, weekly, monthly)
3. **Choose payout method** (bank account, debit card)
4. **Set minimum payout amount** if desired

### Configuration Management

For developers updating the Stripe integration:

#### Key Configuration Files

1. **`/lib/stripe/connect.ts`** - Stripe Connect integration
2. **`/app/api/stripe/connect/route.ts`** - Connect API endpoints
3. **`/components/dashboard/stripe-connect.tsx`** - UI components

#### Environment Variables Required

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_... # or sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... # or pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...
```

#### Webhook Endpoints

Configure these webhooks in your Stripe dashboard:

1. **Account Webhooks** (`/api/webhooks/stripe`):
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.dispute.created`

2. **Connect Webhooks** (`/api/webhooks/stripe/connect`):
   - `account.updated`
   - `account.application.deauthorized`
   - `capability.updated`

#### Testing Stripe Connect

1. **Use Stripe's test mode** for development
2. **Test account creation flow**:
   ```bash
   curl -X POST http://localhost:3000/api/stripe/connect \
     -H "Content-Type: application/json" \
     -d '{"organizationId": "test-org-id"}'
   ```

3. **Test webhook handling**:
   - Use Stripe CLI for local testing
   - Forward events to local server
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

#### Updating Stripe Integration

When modifying the Stripe integration:

1. **Update TypeScript types** in `/types/stripe.ts`
2. **Test in Stripe's test mode** first
3. **Update webhook handlers** for new events
4. **Add error handling** for new scenarios
5. **Update documentation** for customers

#### Common Stripe Issues and Solutions

**Issue: Connect account creation fails**
- Check API keys are correct
- Verify webhook endpoints are configured
- Ensure required business information is provided

**Issue: Payments not processing**
- Check account verification status
- Verify payout methods are configured
- Check for any account restrictions

**Issue: Webhook events not received**
- Verify webhook URL is accessible
- Check webhook secret matches environment variable
- Ensure correct event types are subscribed

## Troubleshooting

### Common Issues

#### 1. Authentication Issues

**Problem: "Unauthorized" errors when accessing API routes**
```bash
# Check environment variables
cat .env.local | grep CLERK

# Verify Clerk configuration
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
echo $CLERK_SECRET_KEY
```

**Solution:**
- Ensure all Clerk environment variables are set
- Check that publishable key starts with `pk_`
- Verify secret key starts with `sk_`
- Confirm redirect URLs match in Clerk dashboard

**Problem: Infinite redirect loops on sign-in**

**Solution:**
```bash
# Check redirect URLs in .env.local
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

#### 2. Database Connection Issues

**Problem: "Failed to connect to database" errors**

**Solution:**
```bash
# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" \
  "https://YOUR_PROJECT.supabase.co/rest/v1/organizations"

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
```

**Problem: "relation does not exist" errors**

**Solution:**
```bash
# Run database migrations
supabase db push

# Reset database if needed
supabase db reset

# Generate fresh TypeScript types
npm run db:generate
```

#### 3. Team Invitation System

**Problem: Invitations showing "pending" but emails not sent**

**Current Status:** The invitation system creates database records but emails are logged to console in development.

**For Production:** Integrate with email service:
```typescript
// In lib/invitations.ts, replace console.log with:
await sendEmail({
  to: email,
  subject: `Invitation to join ${organizationName}`,
  html: emailContent
});
```

**Problem: "invitation_token" column errors**

**Solution:**
```sql
-- Run this migration manually if needed
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'accepted';
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE;
```

#### 4. Role-Based Access Issues

**Problem: Admin section not showing in sidebar**

**Solution:**
```sql
-- Check user role in database
SELECT id, email, role, organization_id FROM users WHERE email = 'your-email@example.com';

-- Update user to super_admin if needed
UPDATE users SET role = 'super_admin', organization_id = NULL WHERE email = 'your-email@example.com';
```

**Problem: Wrong dashboard showing for user role**

**Debug Steps:**
1. Check `components/dashboard/dashboard-header.tsx` logs
2. Verify user role in database matches expected role
3. Clear browser cache and cookies
4. Check Clerk user metadata

#### 5. Widget Customization Issues

**Problem: Widget changes not saving**

**Solution:**
```bash
# Check API routes are working
curl -X POST http://localhost:3000/api/widgets \
  -H "Content-Type: application/json" \
  -d '{"name":"test","config":{}}'

# Verify database permissions
# Check RLS policies in Supabase dashboard
```

#### 6. Stripe Integration Issues

**Problem: "Invalid API key" errors**

**Solution:**
```bash
# Verify Stripe keys format
echo $STRIPE_SECRET_KEY        # Should start with sk_
echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  # Should start with pk_

# Test Stripe connection
curl https://api.stripe.com/v1/payment_intents \
  -u $STRIPE_SECRET_KEY: \
  -d amount=1000 \
  -d currency=usd
```

**Problem: Webhooks not being received**

**Solution:**
1. Use ngrok for local testing:
```bash
ngrok http 3000
# Use the https URL for webhook endpoints
```

2. Verify webhook endpoints in Stripe dashboard:
   - `/api/webhooks/stripe`
   - `/api/webhooks/stripe/connect`

#### 7. Build and Deployment Issues

**Problem: TypeScript errors during build**

**Solution:**
```bash
# Check for type errors
npm run lint
npx tsc --noEmit

# Regenerate types
npm run db:generate

# Clear Next.js cache
rm -rf .next
npm run build
```

**Problem: Environment variables not loading**

**Solution:**
- Ensure `.env.local` exists (not `.env.example`)
- Restart development server after changes
- Check variable names match exactly (case-sensitive)
- For production, set variables in deployment platform

### Debug Mode

Enable detailed logging by adding to `.env.local`:
```env
# Enable detailed logs
NODE_ENV=development
DEBUG=true
NEXT_PUBLIC_DEBUG=true
```

### Performance Issues

**Problem: Slow page loads**

**Solution:**
```bash
# Analyze bundle size
npm run build
npm install -g @next/bundle-analyzer
ANALYZE=true npm run build

# Check database query performance
# Enable slow query logging in Supabase
```

### Getting Help

1. **Check browser console** for JavaScript errors
2. **Check server logs** in terminal running `npm run dev`
3. **Verify database state** in Supabase dashboard
4. **Test API endpoints** with curl or Postman
5. **Check network tab** in browser dev tools

If issues persist:
- Search existing GitHub issues
- Create detailed bug report with:
  - Environment details
  - Steps to reproduce
  - Error messages
  - Screenshots if applicable

## Contributing

### Development Guidelines

1. **Follow TypeScript** - Use proper types for all functions
2. **Component Structure** - Keep components focused and reusable
3. **Error Handling** - Implement proper error boundaries
4. **Testing** - Add tests for new features
5. **Documentation** - Update docs when adding features

### Adding New Features

When adding new features:

1. **Plan the Architecture** - Consider multi-tenant implications
2. **Update Types** - Add TypeScript definitions
3. **Create API Routes** - Follow existing patterns
4. **Add UI Components** - Use existing design system
5. **Test Thoroughly** - Test across different roles
6. **Update Documentation** - Add to this README

---

**Last Updated:** January 2025
**Version:** 1.0.0
