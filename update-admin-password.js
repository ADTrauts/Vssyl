#!/usr/bin/env node

const https = require('https');

async function updateAdminPassword(newPassword) {
  const backendUrl = 'https://vssyl-server-235369681725.us-central1.run.app';
  const endpoint = '/api/admin-setup/update-andrew-password';
  
  console.log('🔐 Updating Andrew admin password...');
  console.log(`Backend URL: ${backendUrl}`);
  console.log(`Endpoint: ${endpoint}`);
  
  const postData = JSON.stringify({ password: newPassword });
  
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
          console.log('\n✅ SUCCESS! Admin password updated.');
          console.log('\n🔐 Updated Admin Portal Access:');
          console.log('  URL: https://vssyl.com/admin-portal');
          console.log(`  Email: Andrew.Trautman@Vssyl.con`);
          console.log(`  Password: ${newPassword}`);
        } else {
          console.log('\n❌ Failed to update password:', response.error);
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

// Get password from command line argument
const newPassword = process.argv[2];

if (!newPassword) {
  console.log('❌ Please provide a password as an argument');
  console.log('Usage: node update-admin-password.js "your-new-password"');
  process.exit(1);
}

// Run the function
updateAdminPassword(newPassword);
