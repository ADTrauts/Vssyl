#!/bin/bash

# Complete Stripe Setup Script for Vssyl
# This script guides you through the complete Stripe setup process

set -e

echo "🚀 Vssyl Stripe Setup - Complete Configuration"
echo "=============================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_requirements() {
    echo "🔍 Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is required but not installed${NC}"
        exit 1
    fi
    
    if ! npm list stripe &> /dev/null && ! npm list -g stripe &> /dev/null; then
        echo "📦 Installing Stripe CLI tools..."
        npm install stripe --save-dev
    fi
    
    echo -e "${GREEN}✅ Requirements satisfied${NC}"
    echo
}

# Prompt for Stripe keys
get_stripe_keys() {
    echo "🔑 Stripe API Keys Setup"
    echo "========================"
    echo
    echo "You need to get your API keys from Stripe Dashboard:"
    echo "1. Go to https://dashboard.stripe.com/apikeys"
    echo "2. Copy your Publishable key and Secret key"
    echo
    
    read -p "Are you setting up TEST or LIVE keys? (test/live): " key_type
    
    if [[ $key_type == "live" ]]; then
        echo -e "${YELLOW}⚠️  You're setting up LIVE keys - this will process real payments!${NC}"
        read -p "Are you sure? (yes/no): " confirm
        if [[ $confirm != "yes" ]]; then
            echo "Setup cancelled"
            exit 1
        fi
    fi
    
    echo
    read -p "Enter your Stripe Secret Key (sk_${key_type}_...): " stripe_secret
    read -p "Enter your Stripe Publishable Key (pk_${key_type}_...): " stripe_publishable
    
    # Validate key format
    if [[ ! $stripe_secret =~ ^sk_${key_type}_ ]]; then
        echo -e "${RED}❌ Invalid secret key format${NC}"
        exit 1
    fi
    
    if [[ ! $stripe_publishable =~ ^pk_${key_type}_ ]]; then
        echo -e "${RED}❌ Invalid publishable key format${NC}"
        exit 1
    fi
    
    export STRIPE_SECRET_KEY=$stripe_secret
    export STRIPE_PUBLISHABLE_KEY=$stripe_publishable
    
    echo -e "${GREEN}✅ Stripe keys configured${NC}"
    echo
}

# Create products and prices
setup_products() {
    echo "📦 Creating Stripe Products & Prices"
    echo "====================================="
    echo
    
    if [[ -f "scripts/setup-stripe-products.js" ]]; then
        echo "Running product setup script..."
        node scripts/setup-stripe-products.js
    else
        echo -e "${RED}❌ Product setup script not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Products and prices created${NC}"
    echo
}

# Setup webhook
setup_webhook() {
    echo "🔗 Setting up Webhook Endpoint"
    echo "==============================="
    echo
    
    read -p "Environment (production/test): " env
    
    if [[ -f "scripts/setup-stripe-webhook.js" ]]; then
        echo "Running webhook setup script..."
        webhook_output=$(node scripts/setup-stripe-webhook.js $env)
        echo "$webhook_output"
        
        # Extract webhook secret from output
        webhook_secret=$(echo "$webhook_output" | grep "STRIPE_WEBHOOK_SECRET=" | cut -d'=' -f2)
        export STRIPE_WEBHOOK_SECRET=$webhook_secret
        
    else
        echo -e "${RED}❌ Webhook setup script not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Webhook endpoint created${NC}"
    echo
}

# Create environment configuration
create_env_config() {
    echo "📝 Creating Environment Configuration"
    echo "===================================="
    echo
    
    env_file=".env.stripe"
    
    cat > $env_file << EOF
# Stripe Configuration for Vssyl
# Generated on $(date)

# Stripe API Keys
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET

# Frontend Environment Variables
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY

# Stripe Configuration Status
STRIPE_CONFIGURED=true
EOF

    echo -e "${GREEN}✅ Environment configuration saved to $env_file${NC}"
    echo
    echo "Add these variables to your production environment:"
    echo "- Google Cloud Secret Manager"
    echo "- Cloud Run environment variables"
    echo "- Your deployment configuration"
    echo
}

# Test the configuration
test_configuration() {
    echo "🧪 Testing Stripe Configuration"
    echo "==============================="
    echo
    
    echo "Testing API connection..."
    
    # Create a simple test script
    cat > test_stripe_temp.js << 'EOF'
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function test() {
  try {
    console.log('🔍 Testing Stripe connection...');
    const account = await stripe.accounts.retrieve();
    console.log(`✅ Connected to Stripe account: ${account.display_name || account.id}`);
    
    console.log('📦 Checking products...');
    const products = await stripe.products.list({ limit: 5 });
    console.log(`✅ Found ${products.data.length} products`);
    
    console.log('🔗 Checking webhooks...');
    const webhooks = await stripe.webhookEndpoints.list({ limit: 3 });
    console.log(`✅ Found ${webhooks.data.length} webhook endpoints`);
    
    console.log('\n🎉 Stripe configuration test successful!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

test();
EOF
    
    node test_stripe_temp.js
    rm test_stripe_temp.js
    
    echo -e "${GREEN}✅ Configuration test passed${NC}"
    echo
}

# Update todo status
update_todo() {
    echo "📋 Updating Setup Status"
    echo "========================"
    echo -e "${GREEN}✅ Stripe Dashboard setup - COMPLETE${NC}"
    echo -e "${GREEN}✅ Products and prices created - COMPLETE${NC}"
    echo -e "${GREEN}✅ Webhook endpoint configured - COMPLETE${NC}"
    echo -e "${GREEN}✅ Environment variables ready - COMPLETE${NC}"
    echo
}

# Display next steps
show_next_steps() {
    echo "🎯 Next Steps"
    echo "============="
    echo
    echo "1. 🚀 Deploy to Production:"
    echo "   - Add environment variables to Google Cloud Secret Manager"
    echo "   - Deploy your application with the new Stripe configuration"
    echo
    echo "2. 🧪 Test Payment Flows:"
    echo "   - Register a test user"
    echo "   - Try subscribing to different plans"
    echo "   - Test module purchases"
    echo "   - Verify webhook delivery"
    echo
    echo "3. 📊 Monitor in Stripe Dashboard:"
    echo "   - Check payment activity"
    echo "   - Monitor webhook delivery"
    echo "   - Review subscription metrics"
    echo
    echo "4. 🔧 Optional Configurations:"
    echo "   - Set up Stripe Connect for developer revenue sharing"
    echo "   - Configure customer portal for self-service"
    echo "   - Set up tax collection if needed"
    echo
    echo -e "${BLUE}📚 Documentation:${NC}"
    echo "   - Stripe Setup Guide: STRIPE_SETUP_GUIDE.md"
    echo "   - Your environment config: .env.stripe"
    echo
    echo -e "${GREEN}🎉 Stripe setup complete! Your payment system is ready to go.${NC}"
}

# Main execution
main() {
    echo "Starting complete Stripe setup for Vssyl..."
    echo
    
    check_requirements
    get_stripe_keys
    setup_products
    setup_webhook
    create_env_config
    test_configuration
    update_todo
    show_next_steps
}

# Run main function
main
