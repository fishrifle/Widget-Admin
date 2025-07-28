/**
 * Test Setup Configuration
 * Run before all tests to set up the testing environment
 */

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_role_key';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_clerk_key';
process.env.CLERK_SECRET_KEY = 'sk_test_clerk_key';
process.env.STRIPE_SECRET_KEY = 'sk_test_stripe_key';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_webhook_secret';

// Global test utilities
global.testConfig = {
  // Test user credentials
  testUsers: {
    superAdmin: {
      email: 'superadmin@test.com',
      password: 'TestPass123!',
      role: 'super_admin'
    },
    orgOwner: {
      email: 'owner@test.com', 
      password: 'TestPass123!',
      role: 'owner'
    },
    editor: {
      email: 'editor@test.com',
      password: 'TestPass123!', 
      role: 'editor'
    }
  },

  // Test organization data
  testOrg: {
    name: 'Test Organization',
    display_name: 'Test Org Display',
    email: 'contact@testorg.com',
    subscription_status: 'active'
  },

  // Test widget data
  testWidget: {
    name: 'Test Widget',
    slug: 'test-widget',
    is_active: true,
    config: {
      theme: 'blue',
      title: 'Support Our Cause',
      description: 'Help us make a difference'
    }
  },

  // API endpoints
  apiEndpoints: {
    auth: '/api/auth',
    widgets: '/api/widgets',
    organizations: '/api/organizations',
    team: '/api/team',
    notifications: '/api/notifications',
    donations: '/api/donations'
  },

  // Database tables to test
  dbTables: [
    'users',
    'organizations', 
    'widgets',
    'donations',
    'organization_memberships',
    'notifications',
    'notification_preferences',
    'causes',
    'widget_themes'
  ]
};

// Test database helpers
global.testHelpers = {
  // Clean test data
  async cleanDatabase() {
    console.log('🧹 Cleaning test database...');
    // Implementation would clean test tables
  },

  // Seed test data
  async seedTestData() {
    console.log('🌱 Seeding test data...');
    // Implementation would create test records
  },

  // Create test user session
  async createTestSession(userType = 'orgOwner') {
    console.log(`👤 Creating test session for ${userType}...`);
    // Implementation would create authenticated session
  },

  // Wait for element helper
  async waitFor(condition, timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        const result = await condition();
        if (result) return result;
      } catch (e) {
        // Continue waiting
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  }
};

// Console styling for test output
global.testLogger = {
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`), 
  warning: (msg) => console.log(`⚠️ ${msg}`),
  info: (msg) => console.log(`ℹ️ ${msg}`),
  test: (msg) => console.log(`🧪 ${msg}`)
};

console.log('🚀 Test environment initialized');