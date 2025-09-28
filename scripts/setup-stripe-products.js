#!/usr/bin/env node

/**
 * Stripe Products Setup Script for Vssyl
 * 
 * This script creates all the necessary products and prices in your Stripe account
 * to match the configuration in your Vssyl codebase.
 * 
 * Usage:
 *   node scripts/setup-stripe-products.js
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

console.log('🚀 Setting up Stripe products for Vssyl...\n');

// Product and price configurations matching your new simplified structure
const PRODUCTS_CONFIG = [
  {
    id: 'prod_pro',
    name: 'Vssyl Pro Plan',
    description: 'Full platform access with unlimited AI features',
    prices: [
      {
        id: 'price_pro_monthly',
        amount: 2900, // $29.00 in cents
        currency: 'usd',
        interval: 'month',
        nickname: 'Pro Monthly'
      },
      {
        id: 'price_pro_yearly',
        amount: 29000, // $290.00 in cents
        currency: 'usd',
        interval: 'year',
        nickname: 'Pro Yearly'
      }
    ]
  },
  {
    id: 'prod_business_basic',
    name: 'Vssyl Business Basic',
    description: 'Team workspace with basic AI settings and 10 included employees',
    prices: [
      {
        id: 'price_business_basic_monthly',
        amount: 4999, // $49.99 in cents
        currency: 'usd',
        interval: 'month',
        nickname: 'Business Basic Monthly'
      },
      {
        id: 'price_business_basic_yearly',
        amount: 49999, // $499.99 in cents
        currency: 'usd',
        interval: 'year',
        nickname: 'Business Basic Yearly'
      }
    ]
  },
  {
    id: 'prod_business_advanced',
    name: 'Vssyl Business Advanced',
    description: 'Team workspace with advanced AI settings and 10 included employees',
    prices: [
      {
        id: 'price_business_advanced_monthly',
        amount: 6999, // $69.99 in cents
        currency: 'usd',
        interval: 'month',
        nickname: 'Business Advanced Monthly'
      },
      {
        id: 'price_business_advanced_yearly',
        amount: 69999, // $699.99 in cents
        currency: 'usd',
        interval: 'year',
        nickname: 'Business Advanced Yearly'
      }
    ]
  },
  {
    id: 'prod_enterprise',
    name: 'Vssyl Enterprise Plan',
    description: 'Enterprise workspace with unlimited AI, custom integrations, and dedicated support',
    prices: [
      {
        id: 'price_enterprise_monthly',
        amount: 12999, // $129.99 in cents
        currency: 'usd',
        interval: 'month',
        nickname: 'Enterprise Monthly'
      },
      {
        id: 'price_enterprise_yearly',
        amount: 129999, // $1299.99 in cents
        currency: 'usd',
        interval: 'year',
        nickname: 'Enterprise Yearly'
      }
    ]
  }
];

async function createProduct(productConfig) {
  try {
    console.log(`📦 Creating product: ${productConfig.name}`);
    
    // Create the product
    const product = await stripe.products.create({
      id: productConfig.id,
      name: productConfig.name,
      description: productConfig.description,
      type: 'service'
    });

    console.log(`✅ Product created: ${product.id}`);

    // Create prices for this product
    for (const priceConfig of productConfig.prices) {
      console.log(`  💰 Creating price: ${priceConfig.nickname}`);
      
      const price = await stripe.prices.create({
        id: priceConfig.id,
        product: product.id,
        unit_amount: priceConfig.amount,
        currency: priceConfig.currency,
        recurring: {
          interval: priceConfig.interval
        },
        nickname: priceConfig.nickname
      });

      console.log(`  ✅ Price created: ${price.id} ($${priceConfig.amount / 100}/${priceConfig.interval})`);
    }

    console.log();
    return product;

  } catch (error) {
    if (error.code === 'resource_already_exists') {
      console.log(`⚠️  Product ${productConfig.id} already exists, skipping...`);
      
      // Still try to create prices if product exists
      for (const priceConfig of productConfig.prices) {
        try {
          console.log(`  💰 Creating price: ${priceConfig.nickname}`);
          
          const price = await stripe.prices.create({
            id: priceConfig.id,
            product: productConfig.id,
            unit_amount: priceConfig.amount,
            currency: priceConfig.currency,
            recurring: {
              interval: priceConfig.interval
            },
            nickname: priceConfig.nickname
          });

          console.log(`  ✅ Price created: ${price.id} ($${priceConfig.amount / 100}/${priceConfig.interval})`);
        } catch (priceError) {
          if (priceError.code === 'resource_already_exists') {
            console.log(`  ⚠️  Price ${priceConfig.id} already exists, skipping...`);
          } else {
            console.error(`  ❌ Error creating price ${priceConfig.id}:`, priceError.message);
          }
        }
      }
      console.log();
    } else {
      console.error(`❌ Error creating product ${productConfig.id}:`, error.message);
      throw error;
    }
  }
}

async function setupStripeProducts() {
  try {
    console.log(`🔑 Using Stripe key: ${process.env.STRIPE_SECRET_KEY.substring(0, 12)}...`);
    console.log(`🌍 Environment: ${process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'TEST' : 'LIVE'}`);
    console.log();

    // Create all products and prices
    for (const productConfig of PRODUCTS_CONFIG) {
      await createProduct(productConfig);
    }

    console.log('🎉 All Stripe products and prices created successfully!');
    console.log();
    console.log('📋 Summary:');
    console.log('Products created:');
    PRODUCTS_CONFIG.forEach(product => {
      console.log(`  • ${product.name} (${product.id})`);
      product.prices.forEach(price => {
        console.log(`    - ${price.nickname}: $${price.amount / 100}/${price.interval}`);
      });
    });

    console.log();
    console.log('🔗 Next Steps:');
    console.log('1. Set up webhooks in Stripe Dashboard');
    console.log('2. Configure environment variables with your keys');
    console.log('3. Test subscription flows in your application');
    console.log('4. Set up Stripe Connect for developer revenue sharing');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupStripeProducts();
