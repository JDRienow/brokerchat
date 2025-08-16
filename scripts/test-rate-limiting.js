#!/usr/bin/env node

/**
 * Rate Limiting Test Script
 *
 * This script tests the rate limiting functionality by making multiple
 * requests to the chat API and verifying that rate limits are enforced.
 *
 * Usage:
 *   node scripts/test-rate-limiting.js
 */

const https = require('node:https');
const http = require('node:http');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER_ID = `test-user-${Date.now()}`;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

// Test scenarios
const testScenarios = [
  {
    name: 'Chat Rate Limiting',
    endpoint: '/api/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: 'test-chat-id',
      message: {
        id: 'test-message',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello, this is a test message' }],
      },
      selectedChatModel: 'chat-model',
    }),
    expectedLimit: 20, // Based on current chat rate limiter for guests
  },
  {
    name: 'Upload Rate Limiting',
    endpoint: '/api/process-document',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileUrl: 'https://example.com/test.pdf',
      fileName: 'test.pdf',
      fileSize: 1024,
      fileType: 'application/pdf',
    }),
    expectedLimit: 5, // Based on current upload rate limiter
  },
];

// Helper function to make HTTP requests
function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Test rate limiting for a specific endpoint
async function testRateLimiting(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📍 Endpoint: ${scenario.endpoint}`);
  console.log(
    `📊 Expected Limit: ${scenario.expectedLimit} requests per minute`,
  );
  console.log('─'.repeat(60));

  const results = [];
  const startTime = Date.now();

  // Make requests until we hit the rate limit
  for (let i = 1; i <= scenario.expectedLimit + 5; i++) {
    try {
      const response = await makeRequest(`${BASE_URL}${scenario.endpoint}`, {
        method: scenario.method,
        headers: scenario.headers,
        body: scenario.body,
      });

      const result = {
        requestNumber: i,
        statusCode: response.statusCode,
        remaining: response.headers['x-ratelimit-remaining'],
        limit: response.headers['x-ratelimit-limit'],
        resetTime: response.headers['x-ratelimit-reset'],
        retryAfter: response.headers['retry-after'],
        isRateLimited: response.statusCode === 429,
      };

      results.push(result);

      console.log(
        `Request ${i.toString().padStart(2)}: ${response.statusCode} ${
          result.isRateLimited ? '🚫 RATE LIMITED' : '✅ OK'
        } (Remaining: ${result.remaining || 'N/A'})`,
      );

      // Stop if we hit the rate limit
      if (result.isRateLimited) {
        console.log(`\n🎯 Rate limit hit after ${i} requests`);
        break;
      }

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Request ${i} failed:`, error.message);
      results.push({
        requestNumber: i,
        error: error.message,
      });
    }
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Analyze results
  const successfulRequests = results.filter(
    (r) => r.statusCode === 200 || r.statusCode === 201,
  ).length;
  const rateLimitedRequests = results.filter((r) => r.isRateLimited).length;
  const failedRequests = results.filter((r) => r.error).length;

  console.log('\n📊 Test Results:');
  console.log(`   Total Requests: ${results.length}`);
  console.log(`   Successful: ${successfulRequests}`);
  console.log(`   Rate Limited: ${rateLimitedRequests}`);
  console.log(`   Failed: ${failedRequests}`);
  console.log(`   Duration: ${duration}ms`);

  // Check if rate limiting worked as expected
  if (rateLimitedRequests > 0) {
    console.log('✅ Rate limiting is working correctly');

    const lastSuccessful = results.findLast((r) => !r.isRateLimited);
    if (
      lastSuccessful &&
      lastSuccessful.requestNumber <= scenario.expectedLimit
    ) {
      console.log(
        `✅ Rate limit enforced at expected threshold (${lastSuccessful.requestNumber} requests)`,
      );
    } else {
      console.log(
        `⚠️  Rate limit enforced at unexpected threshold (${lastSuccessful?.requestNumber || 'unknown'} requests)`,
      );
    }
  } else {
    console.log('❌ Rate limiting not working - no 429 responses received');
  }

  return results;
}

// Test daily message limits
async function testDailyMessageLimits() {
  console.log('\n🧪 Testing: Daily Message Limits');
  console.log('─'.repeat(60));

  // This would require authentication, so we'll just test the endpoint structure
  try {
    const response = await makeRequest(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'test-chat-id',
        message: {
          id: 'test-message',
          role: 'user',
          parts: [{ type: 'text', text: 'Test daily limit' }],
        },
        selectedChatModel: 'chat-model',
      }),
    });

    console.log(`Status: ${response.statusCode}`);
    if (response.statusCode === 429) {
      const body = JSON.parse(response.body);
      if (body.error === 'Daily message limit exceeded') {
        console.log('✅ Daily message limit check is working');
      } else {
        console.log('⚠️  Rate limited but not daily limit specific');
      }
    } else {
      console.log('ℹ️  Daily limit not reached or not authenticated');
    }
  } catch (error) {
    console.error('❌ Daily limit test failed:', error.message);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Rate Limiting Tests');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`⏰ Test Time: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  const allResults = {};

  // Run each test scenario
  for (const scenario of testScenarios) {
    allResults[scenario.name] = await testRateLimiting(scenario);

    // Wait between tests to avoid interference
    console.log('\n⏳ Waiting 2 seconds before next test...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Test daily message limits
  await testDailyMessageLimits();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 Test Summary');
  console.log('='.repeat(60));

  let totalTests = 0;
  let passedTests = 0;

  for (const [testName, results] of Object.entries(allResults)) {
    const rateLimited = results.filter((r) => r.isRateLimited).length;
    const hasRateLimiting = rateLimited > 0;

    console.log(`${testName}: ${hasRateLimiting ? '✅ PASS' : '❌ FAIL'}`);
    totalTests++;
    if (hasRateLimiting) passedTests++;
  }

  console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All rate limiting tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check the implementation.');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Rate Limiting Test Script

Usage:
  node scripts/test-rate-limiting.js [options]

Options:
  --base-url <url>    Base URL for the application (default: http://localhost:3000)
  --help, -h          Show this help message

Environment Variables:
  BASE_URL            Base URL for the application

Examples:
  node scripts/test-rate-limiting.js
  node scripts/test-rate-limiting.js --base-url https://myapp.vercel.app
  BASE_URL=https://staging.myapp.com node scripts/test-rate-limiting.js
  `);
  process.exit(0);
}

// Parse command line arguments
const baseUrlIndex = process.argv.indexOf('--base-url');
if (baseUrlIndex !== -1 && process.argv[baseUrlIndex + 1]) {
  process.env.BASE_URL = process.argv[baseUrlIndex + 1];
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
