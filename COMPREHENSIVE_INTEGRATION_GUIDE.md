# PassItOn Donation Widget - Complete Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [For Business Users (Non-Technical)](#for-business-users-non-technical)
4. [For Developers](#for-developers)
5. [Dashboard Setup Process](#dashboard-setup-process)
6. [Widget Integration Process](#widget-integration-process)
7. [Embedding on Websites](#embedding-on-websites)
8. [Testing & Verification](#testing--verification)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Overview

PassItOn is a donation widget system that consists of two main parts:
1. **Dashboard** - Where organizations configure their donation widgets
2. **Widget** - The actual donation form that appears on websites

Think of it like this:
- **Dashboard** = The control panel (like your thermostat)
- **Widget** = What people see and use (like the temperature in your room)

---

## System Architecture

### How the Two Systems Connect

```
[Organization's Website] 
         ↓ (embed script)
[Donation Widget] 
         ↓ (gets configuration from)
[Dashboard API] 
         ↓ (stores data in)
[Database]
```

### Key Components
- **Dashboard (Port 3001)**: Admin interface for configuring widgets
- **Widget (Port 3000)**: The donation form that customers see
- **Database**: Stores all configuration and donation data
- **API**: Connects the dashboard and widget together

---

## For Business Users (Non-Technical)

### What You Need to Know

#### 1. **Setting Up Your Organization**
- You'll receive login credentials for the dashboard
- Access the dashboard at your provided URL
- Complete your organization profile with:
  - Organization name
  - Contact information
  - Stripe payment account details

#### 2. **Customizing Your Widget**
The dashboard lets you control:
- **Colors**: Match your brand colors
- **Donation amounts**: Set suggested amounts ($10, $25, $50, etc.)
- **Payment options**: Credit card, bank transfer, recurring donations
- **Appearance**: Fonts, button styles, layout

#### 3. **Getting Your Widget Code**
After customization, you'll receive:
- A simple code snippet (like HTML)
- Your unique organization ID
- Instructions for your web developer

#### 4. **How It Appears on Your Website**
Your widget can appear as:
- **Floating button**: Appears in corner of every page
- **Embedded form**: Built into specific pages
- **Pop-up modal**: Opens when people click "Donate"

### Step-by-Step Process for Business Users

#### Step 1: Access Your Dashboard
1. Go to your provided dashboard URL
2. Sign in with your credentials
3. Navigate to "Widget Customize"

#### Step 2: Brand Your Widget
1. **Choose Colors**:
   - Primary color (main buttons and headers)
   - Secondary color (accents and borders)
   - Background color (usually white)

2. **Set Donation Amounts**:
   - Minimum donation amount
   - Suggested amounts (like $10, $25, $50)
   - Allow custom amounts option

3. **Configure Options**:
   - Show/hide donor list
   - Allow recurring donations
   - Show fee coverage option

#### Step 3: Test Your Widget
1. Use the "Test Widget" page to see your changes
2. Try different donation amounts
3. Test on mobile and desktop
4. **Important**: Refresh the test page after making changes

#### Step 4: Get Integration Code
1. Copy the provided embed code
2. Share with your web developer
3. Provide your organization ID

#### Step 5: Go Live
1. Your developer adds the code to your website
2. Test live donations (small amounts first)
3. Monitor donations through the dashboard

---

## For Developers

### Technical Overview

The PassItOn system uses a microservices architecture with two main applications:

1. **Dashboard Application** (Next.js)
   - Admin interface for widget configuration
   - User authentication via Clerk
   - Database management via Supabase
   - API endpoints for widget configuration

2. **Widget Application** (Next.js + Iframe)
   - Donation form interface
   - Stripe payment processing
   - Responsive design with dynamic sizing
   - Cross-origin messaging for embedding

### Prerequisites

#### Required Software
- Node.js (v18 or higher)
- Docker (for local Supabase)
- Git
- Modern web browser

#### Required Accounts
- Supabase account (database)
- Clerk account (authentication)
- Stripe account (payments)

### Development Environment Setup

#### 1. Dashboard Setup
```bash
# Clone the dashboard repository
git clone [dashboard-repo-url]
cd PassItOn-Admin

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Required environment variables:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret

# Start development server
npm run dev
# Dashboard runs on http://localhost:3001
```

#### 2. Widget Setup
```bash
# Clone the widget repository
git clone [widget-repo-url]
cd Donor-widget/passiton

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Required environment variables:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret

# Start development server
npm run dev
# Widget runs on http://localhost:3000
```

#### 3. Database Setup
```bash
# In dashboard directory
npx supabase start
npx supabase db reset
```

---

## Dashboard Setup Process

### Architecture Components

#### 1. **Database Schema**
```sql
-- Organizations table
organizations (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT,
  stripe_customer_id TEXT,
  subscription_status TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Widgets table
widgets (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT,
  slug TEXT,
  config JSONB,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Users table (Clerk integration)
users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  email TEXT,
  role TEXT,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP
);
```

#### 2. **API Endpoints**

**Widget Configuration API** (`/api/widget-config/[orgId]`)
```typescript
// GET request returns widget configuration
{
  id: string,
  name: string,
  organizationId: string,
  organizationName: string,
  config: {
    theme: {
      primaryColor: string,
      secondaryColor: string,
      backgroundColor: string,
      textColor: string,
      headerColor: string,
      fontFamily: string,
      borderRadius: number,
      headerAlignment: string
    },
    settings: {
      showProgressBar: boolean,
      showDonorList: boolean,
      allowRecurring: boolean,
      minimumDonation: number,
      suggestedAmounts: number[],
      showCoverFees: boolean,
      defaultFrequency: string
    },
    causes: array
  }
}
```

#### 3. **Authentication Flow**
1. User signs in via Clerk
2. Clerk provides JWT token
3. Token validated on protected routes
4. User associated with organization
5. Organization access controls applied

---

## Widget Integration Process

### How Widget Connects to Dashboard

#### 1. **Configuration Loading**
```javascript
// Widget requests configuration from dashboard
const response = await fetch(
  `${DASHBOARD_URL}/api/widget-config/${organizationId}`
);
const config = await response.json();
```

#### 2. **Dynamic Styling**
```javascript
// Widget applies configuration to UI
const theme = config.theme;
document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
```

#### 3. **Cross-Origin Communication**
```javascript
// Widget communicates with parent window
window.parent.postMessage({
  type: 'PASSITON_RESIZE',
  height: newHeight
}, '*');

// Parent window handles messages
window.addEventListener('message', function(event) {
  if (event.data.type === 'PASSITON_RESIZE') {
    iframe.style.height = event.data.height + 'px';
  }
});
```

---

## Embedding on Websites

### Method 1: Simple Embed Script (Recommended)

#### For Business Users:
"Just add this code to your website where you want the donate button to appear"

#### For Developers:
```html
<!-- Add before closing </body> tag -->
<script>
  window.PassItOnConfig = {
    organizationId: 'your-org-id-here',
    defaultAmount: 25,
    color: '#0891B2',
    buttonText: 'Donate Now',
    position: 'bottom-right'
  };
</script>
<script src="https://your-widget-domain.com/embed.js"></script>
```

### Method 2: Inline Integration

#### For Specific Page Placement:
```html
<!-- Create container where you want the widget -->
<div id="donation-widget-container">
  <p>Loading donation form...</p>
</div>

<!-- Configuration -->
<script>
  window.PassItOnConfig = {
    targetElementId: 'donation-widget-container',
    organizationId: 'your-org-id-here',
    defaultAmount: 50,
    color: '#0891B2',
    buttonText: 'Support Our Cause'
  };
</script>
<script src="https://your-widget-domain.com/embed.js"></script>
```

### Method 3: WordPress Integration

#### For WordPress Users:
1. Go to your WordPress admin
2. Navigate to Appearance → Theme Editor
3. Add the embed code to your theme's footer.php file
4. Or use a plugin like "Insert Headers and Footers"

#### WordPress Plugin Method:
```php
// Add to functions.php
function add_passiton_widget() {
    ?>
    <script>
      window.PassItOnConfig = {
        organizationId: '<?php echo get_option('passiton_org_id'); ?>',
        defaultAmount: 25,
        color: '#0891B2',
        buttonText: 'Donate Now',
        position: 'bottom-right'
      };
    </script>
    <script src="https://your-widget-domain.com/embed.js"></script>
    <?php
}
add_action('wp_footer', 'add_passiton_widget');
```

### Configuration Options

#### Available Parameters:
```javascript
window.PassItOnConfig = {
  // Required
  organizationId: 'your-unique-org-id',
  
  // Optional - Appearance
  color: '#0891B2',              // Primary button color
  buttonText: 'Donate Now',      // Button text
  position: 'bottom-right',      // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  
  // Optional - Behavior
  defaultAmount: 25,             // Default donation amount
  targetElementId: 'my-div',     // For inline embedding
  
  // Optional - Advanced
  showPoweredBy: true,           // Show "Powered by PassItOn"
  theme: 'light',                // 'light' or 'dark'
  language: 'en'                 // Language code
};
```

---

## Testing & Verification

### For Business Users

#### 1. **Dashboard Testing**
- [ ] Can log in to dashboard
- [ ] Can change widget colors
- [ ] Can set donation amounts
- [ ] Can save changes successfully

#### 2. **Widget Testing**
- [ ] Widget appears on test page
- [ ] Colors match your brand
- [ ] Donation amounts are correct
- [ ] Test page refreshes show changes

#### 3. **Website Testing**
- [ ] Widget appears on your website
- [ ] Donate button works
- [ ] Payment form opens
- [ ] Can complete test donation

### For Developers

#### 1. **Development Testing**
```bash
# Test dashboard API
curl http://localhost:3001/api/widget-config/your-org-id

# Test widget loading
open http://localhost:3000/test-embed-page.html

# Test integration
open http://localhost:3000/live-widget-test.html
```

#### 2. **Integration Testing**
```javascript
// Test configuration loading
async function testConfig() {
  const response = await fetch('/api/widget-config/test-org-id');
  const config = await response.json();
  console.log('Configuration loaded:', config);
}

// Test widget initialization
window.PassItOnWidget.init({
  organizationId: 'test-org-id',
  targetElementId: 'test-container'
});
```

#### 3. **Cross-Browser Testing**
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers
- [ ] Different screen sizes

### Test Scenarios

#### Essential Tests:
1. **Widget loads correctly**
2. **Configuration applies properly**
3. **Payment form functions**
4. **Cross-origin embedding works**
5. **Responsive design adapts**

#### Edge Cases:
1. **Slow network connections**
2. **JavaScript disabled**
3. **Ad blockers active**
4. **Mobile devices**
5. **Multiple widgets on same page**

---

## Troubleshooting

### Common Issues for Business Users

#### "Widget not showing up"
**Problem**: The donate button doesn't appear on your website
**Solutions**:
1. Check if the code was added correctly
2. Make sure your organization ID is correct
3. Verify the widget is activated in the dashboard
4. Try refreshing the page

#### "Wrong colors showing"
**Problem**: Widget colors don't match what you set in dashboard
**Solutions**:
1. Refresh the test page after making changes
2. Clear your browser cache
3. Check if you saved changes in dashboard
4. Wait a few minutes for changes to propagate

#### "Donation form not working"
**Problem**: People can't complete donations
**Solutions**:
1. Verify Stripe account is connected
2. Check payment methods are enabled
3. Test with small amounts first
4. Contact technical support

### Technical Issues for Developers

#### CORS Errors
**Problem**: Cross-origin requests blocked
```javascript
// Solution: Add CORS headers to API responses
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

#### Database Connection Issues
**Problem**: "relation does not exist" errors
```sql
-- Solution: Run database migrations
npx supabase db reset
-- Or handle missing tables gracefully in code
```

#### Authentication Failures
**Problem**: Users can't access dashboard
```javascript
// Solution: Verify Clerk configuration
console.log('Clerk publishable key:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
```

#### Widget Not Loading
**Problem**: Embed script fails
```javascript
// Solution: Check network requests
console.log('Loading widget for org:', organizationId);
fetch(`/api/widget-config/${organizationId}`)
  .then(response => response.json())
  .then(config => console.log('Config loaded:', config))
  .catch(error => console.error('Config failed:', error));
```

### Debugging Steps

#### For Business Users:
1. **Check browser console** (F12 key → Console tab)
2. **Look for error messages**
3. **Try different browsers**
4. **Contact technical support with screenshots**

#### For Developers:
1. **Check network requests** in browser DevTools
2. **Verify environment variables** are set correctly
3. **Test API endpoints** directly
4. **Check server logs** for errors
5. **Use browser debugging tools**

---

## Best Practices

### For Business Users

#### Configuration Best Practices:
1. **Test thoroughly** before going live
2. **Use brand colors** consistently
3. **Set reasonable donation amounts** (not too high/low)
4. **Monitor performance** regularly
5. **Update payment settings** as needed

#### Content Best Practices:
1. **Clear donation purposes** - Explain what donations support
2. **Transparent fee structure** - Show if fees are added
3. **Thank donors promptly** - Set up automatic thank you messages
4. **Regular updates** - Keep donors informed about impact

### For Developers

#### Security Best Practices:
```javascript
// Validate all inputs
function validateOrgId(orgId) {
  if (!orgId || typeof orgId !== 'string') {
    throw new Error('Invalid organization ID');
  }
  return orgId.replace(/[^a-zA-Z0-9-]/g, '');
}

// Use environment variables for secrets
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  throw new Error('Stripe key not configured');
}
```

#### Performance Best Practices:
```javascript
// Cache configuration responses
const configCache = new Map();
function getCachedConfig(orgId) {
  if (configCache.has(orgId)) {
    return configCache.get(orgId);
  }
  // Fetch and cache...
}

// Optimize embed script loading
script.async = true;
script.defer = true;
```

#### Code Quality Best Practices:
1. **Use TypeScript** for type safety
2. **Implement error boundaries** for React components
3. **Add comprehensive logging** for debugging
4. **Write unit tests** for critical functions
5. **Document API endpoints** thoroughly

### Deployment Best Practices

#### Production Checklist:
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] CDN configured for embed script
- [ ] Monitoring and alerting set up
- [ ] Backup procedures tested
- [ ] Load testing completed

#### Security Checklist:
- [ ] HTTPS enforced everywhere
- [ ] API rate limiting enabled
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] CORS properly configured

---

## Support and Resources

### For Business Users
- **Dashboard Help**: Look for the "?" icons in the dashboard
- **Video Tutorials**: Available in the help section
- **Email Support**: support@passiton.com
- **Phone Support**: Available during business hours

### For Developers
- **API Documentation**: `/docs` endpoint on dashboard
- **GitHub Repository**: [Link to repos]
- **Technical Support**: dev-support@passiton.com
- **Community Forum**: [Link to forum]

### Additional Resources
- **Stripe Documentation**: https://stripe.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **React Documentation**: https://react.dev

---

*This guide covers the complete process of integrating the PassItOn donation widget system. For specific technical questions or custom implementations, please contact our development team.*