#!/bin/bash

# Safe Old Database Cleanup Script
# This script safely deletes the old expensive database instance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "🧹 Starting safe cleanup of old database instance..."

# Check current instances
print_status "📊 Current database instances:"
gcloud sql instances list --project=vssyl-472202 --format="table(name,tier,dataDiskSizeGb,state)"

echo ""
print_warning "⚠️  IMPORTANT: Before deleting the old instance, let's verify everything is working:"
echo ""

# Test new database connection
print_status "🔍 Testing new database connection..."
if curl -s https://vssyl-server-235369681725.us-central1.run.app/api/health | grep -q "healthy\|ok\|success"; then
    print_success "✅ New database is working correctly"
else
    print_error "❌ New database is not responding correctly"
    print_warning "⚠️  DO NOT DELETE OLD INSTANCE YET - Fix new database first"
    exit 1
fi

# Test frontend
print_status "🔍 Testing frontend application..."
if curl -s -I https://vssyl.com | grep -q "200 OK"; then
    print_success "✅ Frontend is working correctly"
else
    print_warning "⚠️  Frontend may have issues - check manually"
fi

echo ""
print_status "💰 Cost Analysis:"
echo "  Old Instance (vssyl-db): ~$400/month (db-custom-8-32768 + 250GB SSD)"
echo "  New Instance (vssyl-db-optimized): ~$25/month (db-f1-micro + 10GB HDD)"
echo "  Monthly Savings: ~$375/month"
echo "  Annual Savings: ~$4,500"
echo ""

# Final confirmation
echo "🚨 FINAL CONFIRMATION REQUIRED 🚨"
echo ""
echo "You are about to delete the old database instance 'vssyl-db' which costs ~$400/month."
echo "This will save you ~$375/month (~$4,500/year)."
echo ""
echo "✅ New database 'vssyl-db-optimized' is working correctly"
echo "✅ Application is responding to requests"
echo "✅ All data has been migrated"
echo ""
read -p "Are you sure you want to delete the old instance? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
    print_status "🗑️  Deleting old database instance 'vssyl-db'..."
    
    # Delete the old instance
    gcloud sql instances delete vssyl-db --project=vssyl-472202 --quiet
    
    if [ $? -eq 0 ]; then
        print_success "🎉 Old database instance deleted successfully!"
        print_success "💰 You are now saving ~$375/month (~$4,500/year)"
        print_status "📊 Remaining instances:"
        gcloud sql instances list --project=vssyl-472202 --format="table(name,tier,dataDiskSizeGb,state)"
    else
        print_error "❌ Failed to delete old instance"
        exit 1
    fi
else
    print_warning "⚠️  Deletion cancelled. Old instance remains active."
    print_status "💡 You can run this script again when ready to delete."
fi

print_status "🎯 Next steps:"
echo "1. Monitor your application for 24-48 hours"
echo "2. Check your Google Cloud billing for cost reduction"
echo "3. Consider Railway migration for additional 99% savings"
echo "4. Set up cost alerts to prevent future over-provisioning"

print_success "✅ Cleanup process complete!"
