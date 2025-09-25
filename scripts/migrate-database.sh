#!/bin/bash

# Database Migration Script
# Migrates from vssyl-db to vssyl-db-optimized

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

# Database connection details
OLD_DB_IP="172.30.0.4"
NEW_DB_IP="172.30.0.15"
DB_USER="vssyl_user"
DB_PASSWORD="ArthurGeorge116!"
DB_NAME="vssyl_production"

print_status "🔄 Starting database migration from vssyl-db to vssyl-db-optimized"

# Check if pg_dump and psql are available
if ! command -v pg_dump &> /dev/null; then
    print_error "pg_dump is not installed. Please install PostgreSQL client tools."
    exit 1
fi

if ! command -v psql &> /dev/null; then
    print_error "psql is not installed. Please install PostgreSQL client tools."
    exit 1
fi

# Test connection to old database
print_status "🔍 Testing connection to old database..."
if pg_dump -h $OLD_DB_IP -U $DB_USER -d $DB_NAME --no-password --set=sslmode=disable --schema-only > /dev/null 2>&1; then
    print_success "✅ Connection to old database successful"
else
    print_error "❌ Cannot connect to old database. Check network connectivity."
    exit 1
fi

# Test connection to new database
print_status "🔍 Testing connection to new database..."
if psql -h $NEW_DB_IP -U $DB_USER -d $DB_NAME --no-password --set=sslmode=disable -c "SELECT 1;" > /dev/null 2>&1; then
    print_success "✅ Connection to new database successful"
else
    print_error "❌ Cannot connect to new database. Check network connectivity."
    exit 1
fi

# Export schema
print_status "📤 Exporting database schema..."
pg_dump -h $OLD_DB_IP -U $DB_USER -d $DB_NAME --no-password --set=sslmode=disable --schema-only > schema.sql
print_success "✅ Schema exported to schema.sql"

# Export data
print_status "📤 Exporting database data..."
pg_dump -h $OLD_DB_IP -U $DB_USER -d $DB_NAME --no-password --set=sslmode=disable --data-only > data.sql
print_success "✅ Data exported to data.sql"

# Import schema to new database
print_status "📥 Importing schema to new database..."
psql -h $NEW_DB_IP -U $DB_USER -d $DB_NAME --no-password --set=sslmode=disable -f schema.sql
print_success "✅ Schema imported successfully"

# Import data to new database
print_status "📥 Importing data to new database..."
psql -h $NEW_DB_IP -U $DB_USER -d $DB_NAME --no-password --set=sslmode=disable -f data.sql
print_success "✅ Data imported successfully"

# Verify migration
print_status "🔍 Verifying migration..."
TABLE_COUNT=$(psql -h $NEW_DB_IP -U $DB_USER -d $DB_NAME --no-password --set=sslmode=disable -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
print_success "✅ Migration complete! Found $TABLE_COUNT tables in new database"

# Clean up temporary files
rm -f schema.sql data.sql
print_success "✅ Temporary files cleaned up"

print_success "🎉 Database migration completed successfully!"
print_status "📊 New database configuration:"
echo "  Instance: vssyl-db-optimized"
echo "  IP: $NEW_DB_IP"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Storage: 10GB HDD (vs 250GB SSD)"
echo "  Estimated monthly savings: $45-65"

print_warning "⚠️  Next steps:"
echo "1. Update your application's DATABASE_URL to use the new instance"
echo "2. Test your application thoroughly"
echo "3. Delete the old instance once confirmed working"
echo "4. Update Cloud Build configuration with new connection details"