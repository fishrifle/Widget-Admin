#!/usr/bin/env node

/**
 * Test Runner Script
 * Orchestrates test execution with proper setup and teardown
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const testConfig = {
  // Test suites to run
  suites: [
    'auth.test.js',
    'widgets.test.js', 
    'team.test.js',
    'notifications.test.js',
    'admin.test.js',
    'database.test.js'
  ],
  
  // Test environments
  environments: {
    unit: {
      command: 'npm test',
      description: 'Run unit tests'
    },
    integration: {
      command: 'playwright test',
      description: 'Run integration tests'
    },
    e2e: {
      command: 'playwright test --config=playwright.config.e2e.js',
      description: 'Run end-to-end tests'
    }
  },

  // Test priorities
  priorities: {
    P0: ['auth.test.js'], // Critical - must pass
    P1: ['widgets.test.js', 'team.test.js'], // High priority
    P2: ['notifications.test.js', 'admin.test.js'], // Medium priority  
    P3: ['database.test.js'] // Nice to have
  }
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
      } else {
        resolve(stdout);
      }
    });
  });
}

async function setupTestEnvironment() {
  log('🚀 Setting up test environment...', 'cyan');
  
  try {
    // Check if required dependencies are installed
    await executeCommand('npm list @playwright/test');
    log('✅ Playwright is installed', 'green');
  } catch (e) {
    log('❌ Playwright not found. Installing...', 'yellow');
    await executeCommand('npm install @playwright/test');
    await executeCommand('npx playwright install');
  }

  // Check environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY', 
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    log(`⚠️ Missing environment variables: ${missingVars.join(', ')}`, 'yellow');
    log('Using test defaults...', 'yellow');
  }

  log('✅ Test environment ready', 'green');
}

async function runTestSuite(suite, environment = 'integration') {
  log(`\n🧪 Running ${suite} (${environment})...`, 'blue');
  
  const startTime = Date.now();
  
  try {
    const command = testConfig.environments[environment].command + ` tests/${suite}`;
    const output = await executeCommand(command);
    
    const duration = Date.now() - startTime;
    log(`✅ ${suite} passed (${duration}ms)`, 'green');
    
    return { suite, passed: true, duration, output };
  } catch (e) {
    const duration = Date.now() - startTime;
    log(`❌ ${suite} failed (${duration}ms)`, 'red');
    log(e.stderr || e.error.message, 'red');
    
    return { suite, passed: false, duration, error: e.stderr || e.error.message };
  }
}

async function runTestsByPriority(priority = 'P0') {
  const suites = testConfig.priorities[priority] || [];
  log(`\n🎯 Running ${priority} tests (${suites.length} suites)...`, 'magenta');
  
  const results = [];
  
  for (const suite of suites) {
    const result = await runTestSuite(suite);
    results.push(result);
    
    // Stop on P0 failures
    if (priority === 'P0' && !result.passed) {
      log(`💥 Critical test failed! Stopping execution.`, 'red');
      break;
    }
  }
  
  return results;
}

async function runAllTests() {
  log('🏃 Running all test suites...', 'cyan');
  
  const allResults = [];
  
  // Run by priority order
  for (const priority of ['P0', 'P1', 'P2', 'P3']) {
    const results = await runTestsByPriority(priority);
    allResults.push(...results);
    
    // Stop if critical tests fail
    if (priority === 'P0' && results.some(r => !r.passed)) {
      break;
    }
  }
  
  return allResults;
}

function generateTestReport(results) {
  log('\n📊 Test Report', 'bright');
  log('='.repeat(50), 'cyan');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
  
  log(`Total Tests: ${results.length}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Total Time: ${totalTime}ms`, 'blue');
  log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`, 'blue');
  
  if (failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        log(`  • ${r.suite}: ${r.error.split('\n')[0]}`, 'red');
      });
  }
  
  log('\n✅ Passed Tests:', 'green');
  results
    .filter(r => r.passed)
    .forEach(r => {
      log(`  • ${r.suite} (${r.duration}ms)`, 'green');
    });
}

async function checkKnownIssues() {
  log('\n🔍 Checking for known issues...', 'yellow');
  
  const knownIssues = [
    {
      file: 'app/sign-in/[[...sign-in]]/page.tsx',
      issue: 'Manual "Go to Dashboard" button instead of auto-redirect',
      status: 'FIXED'
    },
    {
      file: 'app/(dashboard)/dashboard/widget/analytics/page.tsx', 
      issue: 'Empty file causing build failures',
      status: 'STASHED_FOR_FIX'
    },
    {
      file: 'app/(dashboard)/admin/widgets/page.tsx',
      issue: 'React Hook dependency warnings',
      status: 'STASHED_FOR_FIX'
    }
  ];

  knownIssues.forEach(issue => {
    const statusColor = issue.status === 'FIXED' ? 'green' : 
                       issue.status === 'STASHED_FOR_FIX' ? 'yellow' : 'red';
    log(`  ${issue.status}: ${issue.issue}`, statusColor);
  });
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    await setupTestEnvironment();
    
    switch (command) {
      case 'auth':
        await runTestSuite('auth.test.js');
        break;
        
      case 'widgets':
        await runTestSuite('widgets.test.js');
        break;
        
      case 'priority':
        const priority = args[1] || 'P0';
        const results = await runTestsByPriority(priority);
        generateTestReport(results);
        break;
        
      case 'all':
      default:
        const allResults = await runAllTests();
        generateTestReport(allResults);
        break;
    }
    
    await checkKnownIssues();
    
  } catch (error) {
    log(`💥 Test runner failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Help text
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('PassItOn Test Runner', 'bright');
  log('Usage: node tests/run-tests.js [command] [options]', 'blue');
  log('\nCommands:', 'cyan');
  log('  all         Run all tests (default)', 'blue');
  log('  auth        Run authentication tests only', 'blue');
  log('  widgets     Run widget tests only', 'blue');
  log('  priority P0 Run tests by priority (P0, P1, P2, P3)', 'blue');
  log('\nExamples:', 'cyan');
  log('  node tests/run-tests.js', 'blue');
  log('  node tests/run-tests.js auth', 'blue');
  log('  node tests/run-tests.js priority P0', 'blue');
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  setupTestEnvironment,
  runTestSuite,
  runTestsByPriority,
  runAllTests,
  generateTestReport
};