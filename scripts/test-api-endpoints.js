const fetch = require('node-fetch');

async function testAPIEndpoints() {
  console.log('🧪 Testing Centralized AI API Endpoints...\n');

  const baseURL = 'http://localhost:5000';
  const testToken = 'test_token'; // This should work for testing

  const endpoints = [
    '/api/ai/centralized/health',
    '/api/ai/centralized/patterns',
    '/api/ai/centralized/insights',
    '/api/ai/centralized/privacy/settings',
    '/api/ai/centralized/analytics/summary'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing: ${endpoint}`);
      
      const response = await fetch(`${baseURL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success: ${data.message || 'Data received'}`);
        if (data.data) {
          console.log(`   📊 Data count: ${Array.isArray(data.data) ? data.data.length : 'Object'}`);
        }
      } else {
        const errorData = await response.text();
        console.log(`   ❌ Error: ${errorData}`);
      }
      
      console.log('');
    } catch (error) {
      console.log(`   💥 Network Error: ${error.message}`);
      console.log('');
    }
  }

  console.log('🏁 API testing completed!');
}

testAPIEndpoints();
