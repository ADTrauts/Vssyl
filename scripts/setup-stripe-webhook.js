#!/usr/bin/env node

/**
 * Stripe Webhook Setup Script for Vssyl
 * 
 * This script creates a webhook endpoint in your Stripe account
 * to handle payment and subscription events.
 * 
 * Usage:
 *   node scripts/setup-stripe-webhook.js [production|test]
 * 
 * Requirements:
 *   - Set STRIPE_SECRET_KEY environment variable
 *   - npm install stripe
 */

const Stripe = require('stripe');

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY environment variable is required');
  console.log('Set it with: export STRIPE_SECRET_KEY=sk_test_your_key_here');
  process.exit(1);
}

// Get environment from command line argument
const environment = process.argv[2] || 'test';
const isProduction = environment === 'production';

// Webhook endpoint URLs
const WEBHOOK_URLS = {
  production: 'https://vssyl-server-235369681725.us-central1.run.app/api/payment/webhook',
  test: 'http://localhost:5000/api/payment/webhook' // For local testing
};

// Events that your application handles (from your codebase)
const WEBHOOK_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'transfer.created',
  'transfer.failed'
];

console.log('🔗 Setting up Stripe webhook for Vssyl...\n');

async function createWebhook() {
  try {
    const webhookUrl = WEBHOOK_URLS[environment];
    
    console.log(`🌍 Environment: ${isProduction ? 'PRODUCTION' : 'TEST'}`);
    console.log(`🔑 Using Stripe key: ${process.env.STRIPE_SECRET_KEY.substring(0, 12)}...`);
    console.log(`📍 Webhook URL: ${webhookUrl}`);
    console.log();

    // Create the webhook endpoint
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: WEBHOOK_EVENTS,
      description: `Vssyl ${isProduction ? 'Production' : 'Test'} Webhook - Payment and Subscription Events`
    });

    console.log('✅ Webhook endpoint created successfully!');
    console.log();
    console.log('📋 Webhook Details:');
    console.log(`  ID: ${webhook.id}`);
    console.log(`  URL: ${webhook.url}`);
    console.log(`  Status: ${webhook.status}`);
    console.log(`  Secret: ${webhook.secret}`);
    console.log();
    console.log('🎯 Events configured:');
    webhook.enabled_events.forEach(event => {
      console.log(`  • ${event}`);
    });

    console.log();
    console.log('🔧 Configuration Required:');
    console.log('Add this webhook secret to your environment variables:');
    console.log();
    if (isProduction) {
      console.log('For production (Google Cloud Secret Manager):');
      console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
    } else {
      console.log('For development (.env file):');
      console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
    }

    console.log();
    console.log('🧪 Testing Your Webhook:');
    console.log('1. Use Stripe CLI to forward events to your local server:');
    console.log('   stripe listen --forward-to localhost:5000/api/payment/webhook');
    console.log('2. Or use the webhook test feature in Stripe Dashboard');
    console.log('3. Trigger test events by creating subscriptions or payments');

    console.log();
    console.log('🔍 Monitoring:');
    console.log('- Check webhook delivery in Stripe Dashboard → Developers → Webhooks');
    console.log('- Monitor your server logs for webhook processing');
    console.log('- Verify subscription status updates in your database');

    return webhook;

  } catch (error) {
    console.error('❌ Webhook setup failed:', error.message);
    
    if (error.code === 'url_invalid') {
      console.log();
      console.log('💡 Troubleshooting:');
      console.log('- Make sure your server is running and accessible');
      console.log('- For local testing, use ngrok or similar to expose localhost');
      console.log('- For production, verify your server URL is correct');
    }
    
    process.exit(1);
  }
}

async function listExistingWebhooks() {
  try {
    console.log('📋 Existing webhooks:');
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
    
    if (webhooks.data.length === 0) {
      console.log('  No webhooks found');
    } else {
      webhooks.data.forEach(webhook => {
        console.log(`  • ${webhook.id}: ${webhook.url} (${webhook.status})`);
      });
    }
    console.log();
  } catch (error) {
    console.log('⚠️  Could not list existing webhooks:', error.message);
  }
}

// Main execution
async function main() {
  await listExistingWebhooks();
  await createWebhook();
}

main();
