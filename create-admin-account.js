#!/usr/bin/env node

const https = require('https');

async function createAdminAccount() {
  const backendUrl = 'https://vssyl-server-235369681725.us-central1.run.app';
  const endpoint = '/api/admin-setup/create-andrew-admin';
  
  console.log('🚀 Creating Andrew admin account in production...');
  console.log(`Backend URL: ${backendUrl}`);
  console.log(`Endpoint: ${endpoint}`);
  
  const postData = JSON.stringify({});
  
  const options = {
    hostname: 'vssyl-server-235369681725.us-central1.run.app',
    port: 443,
    path: endpoint,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('\n📋 Response:');
        console.log(JSON.stringify(response, null, 2));
        
        if (response.success) {
          console.log('\n✅ SUCCESS! Admin account setup completed.');
          console.log('\n🔐 Admin Portal Access:');
          console.log('  URL: https://vssyl.com/admin-portal');
          console.log(`  Email: ${response.user?.email || 'Andrew.Trautman@Vssyl.con'}`);
          if (response.credentials?.password) {
            console.log(`  Password: ${response.credentials.password}`);
            console.log('\n⚠️  Please change your password after first login!');
          }
        } else {
          console.log('\n❌ Failed to create admin account:', response.error);
        }
      } catch (error) {
        console.log('\n❌ Error parsing response:', error.message);
        console.log('Raw response:', data);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });
  
  req.write(postData);
  req.end();
}

// Run the function
createAdminAccount();
