#!/bin/bash

# Minimal Database Setup Script
# This script sets up a minimal database with essential tables for the application to start

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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "🔧 Setting up minimal database for application startup..."

# Database connection details
DB_IP="172.30.0.15"
DB_USER="vssyl_user"
DB_PASSWORD="Arthur%26George116%21%21"
DB_NAME="vssyl_production"

# Set up environment for Prisma
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_IP}:5432/${DB_NAME}?connection_limit=5&pool_timeout=20"

print_status "📊 Database connection details:"
echo "  Host: $DB_IP"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Check if we can connect to the database
print_status "🔍 Testing connection to database..."
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    print_success "✅ Connected to database successfully"
else
    print_error "❌ Cannot connect to database"
    print_warning "⚠️  This might be due to network restrictions."
    print_status "💡 Alternative: Use Cloud SQL proxy or run from a VM with access"
    exit 1
fi

# Run Prisma migrations
print_status "🔄 Running Prisma migrations..."
if npx prisma migrate deploy; then
    print_success "✅ Prisma migrations completed successfully"
else
    print_error "❌ Prisma migrations failed"
    exit 1
fi

# Check if tables exist
print_status "🔍 Verifying database schema..."
TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
print_success "✅ Found $TABLE_COUNT tables in database"

# Create a minimal admin user if no users exist
print_status "👤 Checking for admin user..."
USER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null || echo "0")
if [ "$USER_COUNT" -eq 0 ]; then
    print_status "👤 Creating minimal admin user..."
    psql "$DATABASE_URL" -c "
        INSERT INTO \"User\" (id, email, name, \"emailVerified\", \"createdAt\", \"updatedAt\") 
        VALUES ('admin-001', 'admin@vssyl.com', 'Admin User', NOW(), NOW(), NOW());
    "
    print_success "✅ Admin user created"
else
    print_success "✅ Users already exist ($USER_COUNT users)"
fi

print_success "🎉 Minimal database setup completed successfully!"
print_status "📊 Database is now ready for application startup"

