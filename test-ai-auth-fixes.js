#!/usr/bin/env node

/**
 * Test script to verify AI authentication fixes
 * This script tests the AI endpoints that were having authentication issues
 */

const https = require('https');
const fs = require('fs');

// Configuration
const BASE_URL = 'https://vssyl-server-235369681725.us-central1.run.app';
const TEST_USER_EMAIL = 'test@example.com'; // Replace with actual test user
const TEST_USER_PASSWORD = 'testpassword'; // Replace with actual test password

// Helper function to make HTTPS requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Test authentication endpoints
async function testAuthentication() {
  console.log('🔐 Testing Authentication...');
  
  try {
    // Test login
    const loginOptions = {
      hostname: 'vssyl-server-235369681725.us-central1.run.app',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const loginData = JSON.stringify({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    console.log('  📝 Testing login...');
    const loginResponse = await makeRequest(loginOptions, loginData);
    
    if (loginResponse.statusCode === 200 && loginResponse.data.accessToken) {
      console.log('  ✅ Login successful');
      return loginResponse.data.accessToken;
    } else {
      console.log('  ❌ Login failed:', loginResponse.statusCode, loginResponse.data);
      return null;
    }
  } catch (error) {
    console.log('  ❌ Login error:', error.message);
    return null;
  }
}

// Test AI endpoints with authentication
async function testAIEndpoints(accessToken) {
  if (!accessToken) {
    console.log('❌ No access token available, skipping AI endpoint tests');
    return;
  }
  
  console.log('🤖 Testing AI Endpoints...');
  
  const endpoints = [
    { path: '/api/ai/autonomy/settings', method: 'GET', name: 'AI Autonomy Settings' },
    { path: '/api/ai/autonomy/recommendations', method: 'GET', name: 'AI Autonomy Recommendations' },
    { path: '/api/ai-stats/stats', method: 'GET', name: 'AI Stats' },
    { path: '/api/ai/personality/profile', method: 'GET', name: 'AI Personality Profile' },
    { path: '/api/ai/twin', method: 'POST', name: 'AI Twin', body: { query: 'Hello, test query', context: { currentModule: 'test' } } }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`  📝 Testing ${endpoint.name}...`);
      
      const options = {
        hostname: 'vssyl-server-235369681725.us-central1.run.app',
        port: 443,
        path: endpoint.path,
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await makeRequest(options, endpoint.body ? JSON.stringify(endpoint.body) : null);
      
      if (response.statusCode === 200) {
        console.log(`  ✅ ${endpoint.name} - SUCCESS`);
      } else if (response.statusCode === 401) {
        console.log(`  ❌ ${endpoint.name} - AUTHENTICATION FAILED (401)`);
      } else if (response.statusCode === 403) {
        console.log(`  ❌ ${endpoint.name} - FORBIDDEN (403)`);
      } else {
        console.log(`  ⚠️  ${endpoint.name} - Status: ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`  ❌ ${endpoint.name} - ERROR:`, error.message);
    }
  }
}

// Test endpoints without authentication (should fail)
async function testUnauthenticatedEndpoints() {
  console.log('🚫 Testing Unauthenticated Access (should fail)...');
  
  const endpoints = [
    { path: '/api/ai/autonomy/settings', name: 'AI Autonomy Settings' },
    { path: '/api/ai/autonomy/recommendations', name: 'AI Autonomy Recommendations' },
    { path: '/api/ai-stats/stats', name: 'AI Stats' },
    { path: '/api/ai/personality/profile', name: 'AI Personality Profile' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`  📝 Testing ${endpoint.name} without auth...`);
      
      const options = {
        hostname: 'vssyl-server-235369681725.us-central1.run.app',
        port: 443,
        path: endpoint.path,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const response = await makeRequest(options);
      
      if (response.statusCode === 401) {
        console.log(`  ✅ ${endpoint.name} - Correctly rejected (401)`);
      } else if (response.statusCode === 403) {
        console.log(`  ✅ ${endpoint.name} - Correctly rejected (403)`);
      } else {
        console.log(`  ❌ ${endpoint.name} - Should have been rejected, got: ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`  ❌ ${endpoint.name} - ERROR:`, error.message);
    }
  }
}

// Main test function
async function runTests() {
  console.log('🧪 AI Authentication Fix Test Suite');
  console.log('=====================================\n');
  
  // Test authentication
  const accessToken = await testAuthentication();
  console.log('');
  
  // Test AI endpoints with authentication
  await testAIEndpoints(accessToken);
  console.log('');
  
  // Test unauthenticated access
  await testUnauthenticatedEndpoints();
  console.log('');
  
  console.log('🏁 Test suite completed!');
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testAuthentication, testAIEndpoints, testUnauthenticatedEndpoints };
