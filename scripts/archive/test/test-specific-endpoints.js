#!/usr/bin/env node

/**
 * Test specific failing endpoints to identify the real issue
 */

const https = require('https');

// Configuration
const BASE_URL = 'https://vssyl-server-235369681725.us-central1.run.app';
const BUSINESS_ID = 'a3c13e53-9e98-4595-94b6-47cecd993611';

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
            data: parsedData,
            rawData: data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            rawData: data
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

// Test specific failing endpoints
async function testFailingEndpoints() {
  console.log('🔍 Testing Specific Failing Endpoints...');
  console.log('Business ID:', BUSINESS_ID);
  console.log('');
  
  const endpoints = [
    {
      path: `/api/org-chart/structure/${BUSINESS_ID}`,
      method: 'GET',
      name: 'Org Chart Structure',
      requiresAuth: true
    },
    {
      path: `/api/business-ai/${BUSINESS_ID}/employee-access`,
      method: 'GET', 
      name: 'Business AI Employee Access',
      requiresAuth: true
    },
    {
      path: `/api/org-chart/employees/${BUSINESS_ID}`,
      method: 'GET',
      name: 'Org Chart Employees', 
      requiresAuth: true
    }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📝 Testing ${endpoint.name}...`);
      
      const options = {
        hostname: 'vssyl-server-235369681725.us-central1.run.app',
        port: 443,
        path: endpoint.path,
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      // Test without authentication first
      const response = await makeRequest(options);
      
      console.log(`   Status: ${response.statusCode}`);
      
      if (response.statusCode === 500) {
        console.log(`   ❌ 500 Error Details:`);
        console.log(`   Response:`, JSON.stringify(response.data, null, 2));
        console.log(`   Raw Response:`, response.rawData);
      } else if (response.statusCode === 401) {
        console.log(`   ✅ Correctly requires authentication (401)`);
      } else if (response.statusCode === 200) {
        console.log(`   ✅ Working (200)`);
      } else {
        console.log(`   ⚠️  Unexpected status: ${response.statusCode}`);
        console.log(`   Response:`, response.data);
      }
      
    } catch (error) {
      console.log(`   ❌ Request failed:`, error.message);
    }
    
    console.log('');
  }
}

// Test if the business exists by checking a simpler endpoint
async function testBusinessExistence() {
  console.log('🔍 Testing Business Existence...');
  
  try {
    // Try to access a simpler endpoint that might not require complex data
    const options = {
      hostname: 'vssyl-server-235369681725.us-central1.run.app',
      port: 443,
      path: `/api/org-chart/validate/${BUSINESS_ID}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    console.log(`   Validation endpoint status: ${response.statusCode}`);
    
    if (response.statusCode === 500) {
      console.log(`   ❌ 500 Error in validation:`);
      console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.log(`   ❌ Validation request failed:`, error.message);
  }
  
  console.log('');
}

// Test authentication endpoints
async function testAuthEndpoints() {
  console.log('🔍 Testing Authentication Endpoints...');
  
  try {
    // Test if authentication is working at all
    const options = {
      hostname: 'vssyl-server-235369681725.us-central1.run.app',
      port: 443,
      path: '/api/ai/autonomy/settings',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      }
    };
    
    const response = await makeRequest(options);
    console.log(`   Auth test status: ${response.statusCode}`);
    
    if (response.statusCode === 401) {
      console.log(`   ✅ Authentication middleware working (401 for invalid token)`);
    } else if (response.statusCode === 403) {
      console.log(`   ✅ Authentication middleware working (403 for invalid token)`);
    } else {
      console.log(`   ⚠️  Unexpected auth response: ${response.statusCode}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Auth test failed:`, error.message);
  }
  
  console.log('');
}

// Main test function
async function main() {
  console.log('🚨 Specific Endpoint Debug Script');
  console.log('==================================\n');
  
  await testFailingEndpoints();
  await testBusinessExistence();
  await testAuthEndpoints();
  
  console.log('🏁 Debug complete!');
  console.log('');
  console.log('💡 Analysis:');
  console.log('   - If all endpoints return 500: Database connection issue');
  console.log('   - If some return 401/403: Authentication working, data issue');
  console.log('   - If validation fails with 500: Business data issue');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testFailingEndpoints, testBusinessExistence, testAuthEndpoints };
