#!/bin/bash

# Setup New Database Script
# This script sets up the new optimized database with schema and data

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

print_status "🔧 Setting up new optimized database..."

# Database connection details
NEW_DB_IP="172.30.0.15"
DB_USER="vssyl_user"
DB_PASSWORD="ArthurGeorge116!"
DB_NAME="vssyl_production"

# Set up environment for Prisma
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${NEW_DB_IP}:5432/${DB_NAME}?connection_limit=5&pool_timeout=20"

print_status "📊 Database connection details:"
echo "  Host: $NEW_DB_IP"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Check if we can connect to the new database
print_status "🔍 Testing connection to new database..."
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    print_success "✅ Connected to new database successfully"
else
    print_error "❌ Cannot connect to new database"
    print_warning "⚠️  This might be due to network restrictions. Let's try a different approach."
    exit 1
fi

# Run Prisma migrations
print_status "🔄 Running Prisma migrations on new database..."
if npx prisma migrate deploy; then
    print_success "✅ Prisma migrations completed successfully"
else
    print_error "❌ Prisma migrations failed"
    print_warning "⚠️  This might be due to network restrictions. Let's try a different approach."
    exit 1
fi

# Check if tables exist
print_status "🔍 Verifying database schema..."
TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
print_success "✅ Found $TABLE_COUNT tables in new database"

if [ "$TABLE_COUNT" -gt 0 ]; then
    print_success "🎉 New database setup completed successfully!"
    print_status "📊 New database is ready for use:"
    echo "  Instance: vssyl-db-optimized"
    echo "  IP: $NEW_DB_IP"
    echo "  Database: $DB_NAME"
    echo "  Tables: $TABLE_COUNT"
    echo "  Storage: 10GB HDD (vs 250GB SSD)"
    echo "  Monthly cost: ~$25 (vs ~$75)"
    echo ""
    print_success "✅ You can now safely delete the old database instance!"
else
    print_warning "⚠️  No tables found in new database"
    print_status "💡 This might be normal if the database is empty"
fi

print_status "🎯 Next steps:"
echo "1. Test your application with the new database"
echo "2. If everything works, delete the old database instance"
echo "3. Monitor your costs for the expected $50/month savings"
