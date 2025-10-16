// Test Stripe configuration endpoint
const express = require('express');
const { isStripeConfigured, getStripeClient } = require('./src/config/stripe');

const app = express();
const PORT = 5001;

app.get('/test-stripe', async (req, res) => {
  try {
    console.log('🔍 Testing Stripe Configuration...');
    
    const config = {
      isConfigured: isStripeConfigured(),
      hasClient: !!getStripeClient(),
      secretKey: process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not Set',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ? 'Set' : 'Not Set'
    };
    
    console.log('✅ Configuration:', config);
    
    if (config.isConfigured && config.hasClient) {
      // Test creating a customer
      const stripe = getStripeClient();
      const customer = await stripe.customers.create({
        email: 'test@example.com',
        name: 'Test User',
        metadata: { test: true }
      });
      
      console.log('✅ Successfully created test customer:', customer.id);
      
      // Clean up
      await stripe.customers.del(customer.id);
      console.log('🧹 Test customer cleaned up');
      
      res.json({
        status: 'success',
        message: 'Stripe is fully connected and working!',
        config,
        testCustomer: {
          id: customer.id,
          email: customer.email
        }
      });
    } else {
      res.json({
        status: 'error',
        message: 'Stripe is not properly configured',
        config
      });
    }
  } catch (error) {
    console.log('❌ Error testing Stripe:', error.message);
    res.json({
      status: 'error',
      message: 'Error testing Stripe API',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🧪 Test server running on port ${PORT}`);
  console.log(`🔗 Test URL: http://localhost:${PORT}/test-stripe`);
});
