const { StripeService } = require('./server/src/services/stripeService');
const { isStripeConfigured } = require('./server/src/config/stripe');

console.log('🔍 Testing Stripe Connection...\n');

// Check if Stripe is configured
console.log('✅ Stripe Configuration Check:');
console.log(`   - isStripeConfigured(): ${isStripeConfigured()}`);

if (isStripeConfigured()) {
  console.log('✅ Stripe is properly configured!');
  
  // Test creating a test customer
  console.log('\n🧪 Testing Stripe API...');
  
  StripeService.createCustomer({
    email: 'test@example.com',
    name: 'Test User',
    metadata: { test: true }
  })
  .then(customer => {
    console.log('✅ Successfully created test customer:');
    console.log(`   - Customer ID: ${customer.id}`);
    console.log(`   - Email: ${customer.email}`);
    console.log('🎉 Stripe is fully connected and working!');
  })
  .catch(error => {
    console.log('❌ Error testing Stripe API:');
    console.log(`   - Error: ${error.message}`);
  });
} else {
  console.log('❌ Stripe is not configured properly');
  console.log('   - Check your environment variables');
}
