// Simple Stripe connection test
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

console.log('🔍 Testing Stripe Connection...\n');

// Check environment variables
console.log('✅ Environment Variables:');
console.log(`   - STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not Set'}`);
console.log(`   - STRIPE_PUBLISHABLE_KEY: ${process.env.STRIPE_PUBLISHABLE_KEY ? 'Set' : 'Not Set'}`);

if (process.env.STRIPE_SECRET_KEY) {
  console.log('\n🧪 Testing Stripe API...');
  
  // Test creating a customer
  stripe.customers.create({
    email: 'test@example.com',
    name: 'Test User',
    metadata: { test: true }
  })
  .then(customer => {
    console.log('✅ Successfully created test customer:');
    console.log(`   - Customer ID: ${customer.id}`);
    console.log(`   - Email: ${customer.email}`);
    console.log('🎉 Stripe is fully connected and working!');
    
    // Clean up test customer
    return stripe.customers.del(customer.id);
  })
  .then(() => {
    console.log('🧹 Test customer cleaned up');
  })
  .catch(error => {
    console.log('❌ Error testing Stripe API:');
    console.log(`   - Error: ${error.message}`);
    console.log(`   - Type: ${error.type}`);
  });
} else {
  console.log('❌ STRIPE_SECRET_KEY not found in environment');
}
