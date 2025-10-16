// Test script for impersonation functionality
const crypto = require('crypto');

// Use the same JWT secret as the server
const JWT_SECRET = 'wH0XTqYXGEeqKWr4BeffQYx2541Y+ls1Njf5s3sHypg=';

// Create a simple JWT token (this is a basic implementation)
function createJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Create a test admin token
const adminUser = {
  sub: '451258c6-5630-4008-8028-edf390036930', // This should match the admin user ID
  email: 'admin@blockonblock.com',
  role: 'ADMIN',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
};

const token = createJWT(adminUser);

console.log('Admin Token:', token);
console.log('\nTest the impersonation endpoint with:');
console.log(`curl -X POST http://localhost:5000/api/admin-portal/users/test-user-id/impersonate \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "Authorization: Bearer ${token}" \\`);
console.log(`  -d '{"reason":"Testing impersonation"}'`);

console.log('\nTest the current impersonation endpoint with:');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:5000/api/admin-portal/impersonation/current`);
