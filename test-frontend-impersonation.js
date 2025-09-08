// Test script to simulate frontend impersonation flow

async function testFrontendImpersonation() {
  console.log('Testing frontend impersonation flow...\n');

  // Step 1: Test the admin authentication endpoint
  console.log('1. Testing admin authentication...');
  try {
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@blockonblock.com',
        password: 'admin123' // This should match the admin user's password
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful, got token');
    
    const token = loginData.token;
    console.log('Token length:', token.length);

    // Step 2: Test the current impersonation endpoint
    console.log('\n2. Testing current impersonation endpoint...');
    const currentResponse = await fetch('http://localhost:5000/api/admin-portal/impersonation/current', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!currentResponse.ok) {
      console.log('❌ Current impersonation failed:', await currentResponse.text());
      return;
    }

    const currentData = await currentResponse.json();
    console.log('✅ Current impersonation response:', currentData);

    // Step 3: Test starting impersonation
    console.log('\n3. Testing start impersonation...');
    const startResponse = await fetch('http://localhost:5000/api/admin-portal/users/af4d32fc-6ef7-4ce8-a8ba-e5ad6369f0ae/impersonate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reason: 'Testing frontend impersonation' })
    });

    if (!startResponse.ok) {
      console.log('❌ Start impersonation failed:', await startResponse.text());
      return;
    }

    const startData = await startResponse.json();
    console.log('✅ Start impersonation successful:', startData);

    // Step 4: Test current impersonation again
    console.log('\n4. Testing current impersonation after start...');
    const currentAfterResponse = await fetch('http://localhost:5000/api/admin-portal/impersonation/current', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!currentAfterResponse.ok) {
      console.log('❌ Current impersonation after start failed:', await currentAfterResponse.text());
      return;
    }

    const currentAfterData = await currentAfterResponse.json();
    console.log('✅ Current impersonation after start:', currentAfterData);

    // Step 5: Test ending impersonation
    console.log('\n5. Testing end impersonation...');
    const endResponse = await fetch('http://localhost:5000/api/admin-portal/impersonation/end', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!endResponse.ok) {
      console.log('❌ End impersonation failed:', await endResponse.text());
      return;
    }

    const endData = await endResponse.json();
    console.log('✅ End impersonation successful:', endData);

    console.log('\n🎉 All impersonation tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFrontendImpersonation();
