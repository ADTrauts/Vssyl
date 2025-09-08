// Test script to check frontend authentication

async function testFrontendAuth() {
  console.log('Testing frontend authentication...\n');

  try {
    // Step 1: Test the NextAuth login endpoint
    console.log('1. Testing NextAuth login...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@blockonblock.com',
        password: 'admin123',
        redirect: false
      })
    });

    console.log('Login response status:', loginResponse.status);
    console.log('Login response headers:', Object.fromEntries(loginResponse.headers.entries()));

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('❌ Login failed:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful:', loginData);

    // Step 2: Test the admin portal API with the session
    console.log('\n2. Testing admin portal API...');
    const adminResponse = await fetch('http://localhost:3000/api/admin-portal/test', {
      headers: { 'Cookie': loginResponse.headers.get('set-cookie') || '' }
    });

    console.log('Admin response status:', adminResponse.status);
    
    if (!adminResponse.ok) {
      const errorText = await adminResponse.text();
      console.log('❌ Admin API failed:', errorText);
      return;
    }

    const adminData = await adminResponse.json();
    console.log('✅ Admin API successful:', adminData);

    // Step 3: Test impersonation with the session
    console.log('\n3. Testing impersonation with session...');
    const impersonationResponse = await fetch('http://localhost:3000/api/admin-portal/impersonation/current', {
      headers: { 'Cookie': loginResponse.headers.get('set-cookie') || '' }
    });

    console.log('Impersonation response status:', impersonationResponse.status);
    
    if (!impersonationResponse.ok) {
      const errorText = await impersonationResponse.text();
      console.log('❌ Impersonation API failed:', errorText);
      return;
    }

    const impersonationData = await impersonationResponse.json();
    console.log('✅ Impersonation API successful:', impersonationData);

    console.log('\n🎉 Frontend authentication test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFrontendAuth();
