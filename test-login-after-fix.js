#!/usr/bin/env node

/**
 * Test script to verify login functionality after database connection fix
 */

const https = require('https');

async function testLogin() {
  console.log('🔧 Testing login functionality after database connection fix...');
  
  // Test with the test user credentials (from seed scripts)
  const testCredentials = {
    email: 'test@example.com',
    password: 'test123'
  };
  
  // Alternative test users if the first one doesn't work:
  // email: 'alice@example.com', password: 'password123'
  // email: 'business@example.com', password: 'business123'
  
  const postData = JSON.stringify(testCredentials);
  
  const options = {
    hostname: 'vssyl-server-235369681725.us-central1.run.app',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Response Status: ${res.statusCode}`);
        console.log(`📋 Response Headers:`, res.headers);
        console.log(`📄 Response Body:`, data);
        
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            console.log('✅ Login successful!');
            console.log('🎫 Token received:', response.token ? 'Yes' : 'No');
            console.log('👤 User:', response.user?.email);
            resolve(true);
          } catch (error) {
            console.log('⚠️  Login successful but response parsing failed:', error.message);
            resolve(true);
          }
        } else if (res.statusCode === 401) {
          console.log('❌ Login failed - Unauthorized');
          try {
            const error = JSON.parse(data);
            console.log('🔍 Error message:', error.message);
          } catch (e) {
            console.log('🔍 Raw error:', data);
          }
          resolve(false);
        } else {
          console.log(`❌ Unexpected status code: ${res.statusCode}`);
          console.log('🔍 Response:', data);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

async function testDatabaseConnection() {
  console.log('\n🔧 Testing database connection...');
  
  const options = {
    hostname: 'vssyl-server-235369681725.us-central1.run.app',
    port: 443,
    path: '/api/health',
    method: 'GET'
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Health Check Status: ${res.statusCode}`);
        console.log(`📄 Health Check Response:`, data);
        
        if (res.statusCode === 200) {
          console.log('✅ Health check passed - database connection working');
          resolve(true);
        } else {
          console.log('❌ Health check failed');
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Health check request error:', error.message);
      reject(error);
    });
    
    req.end();
  });
}

async function main() {
  try {
    console.log('🚀 Starting comprehensive login test...\n');
    
    // First test database connection
    const dbWorking = await testDatabaseConnection();
    
    if (!dbWorking) {
      console.log('\n❌ Database connection not working, skipping login test');
      return;
    }
    
    // Then test login
    const loginWorking = await testLogin();
    
    if (loginWorking) {
      console.log('\n🎉 SUCCESS: Login functionality is working correctly!');
    } else {
      console.log('\n❌ FAILURE: Login functionality still has issues');
    }
    
  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
  }
}

main();
