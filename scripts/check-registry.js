#!/usr/bin/env node

/**
 * Quick script to check if module AI contexts are registered
 * Run with: node scripts/check-registry.js
 */

const https = require('https');

const API_URL = 'https://vssyl-server-235369681725.us-central1.run.app';

// You'll need to pass your auth token
const token = process.argv[2];

if (!token) {
  console.log('Usage: node scripts/check-registry.js YOUR_AUTH_TOKEN');
  console.log('\nTo get your token:');
  console.log('1. Open browser DevTools (F12)');
  console.log('2. Go to Application > Local Storage');
  console.log('3. Find your JWT token');
  process.exit(1);
}

const options = {
  hostname: 'vssyl-server-235369681725.us-central1.run.app',
  path: '/api/admin/modules/ai/registry',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📊 Module AI Context Registry Status:\n');
    
    try {
      const registries = JSON.parse(data);
      
      if (Array.isArray(registries) && registries.length > 0) {
        console.log(`✅ Found ${registries.length} registered modules:\n`);
        registries.forEach(reg => {
          console.log(`  📦 ${reg.moduleName}`);
          console.log(`     Category: ${reg.category}`);
          console.log(`     Keywords: ${reg.keywords.join(', ')}`);
          console.log(`     Last Updated: ${new Date(reg.lastUpdated).toLocaleString()}`);
          console.log('');
        });
      } else if (Array.isArray(registries)) {
        console.log('⚠️  No modules registered yet!');
        console.log('\nThis means the registration script needs to run.');
        console.log('It should happen automatically on next deployment.');
      } else {
        console.log('Response:', data);
      }
    } catch (e) {
      console.error('Error parsing response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.end();

