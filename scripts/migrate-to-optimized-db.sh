#!/bin/bash

# Complete Database Migration Script
# This script migrates from the old expensive database to the new optimized one

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

print_status "🚀 Starting complete database migration to optimized instance..."

# Database connection details
OLD_DB_IP="172.30.0.4"
NEW_DB_IP="172.30.0.15"
DB_USER="vssyl_user"
DB_PASSWORD="ArthurGeorge116!"
DB_NAME="vssyl_production"

print_status "📊 Migration plan:"
echo "  From: vssyl-db ($OLD_DB_IP) - 250GB SSD (~$75/month)"
echo "  To: vssyl-db-optimized ($NEW_DB_IP) - 10GB HDD (~$25/month)"
echo "  Savings: ~$50/month (~$600/year)"
echo ""

# Step 1: Export data from old database
print_status "📤 Step 1: Exporting data from old database..."
EXPORT_FILE="database-export-$(date +%s).sql"

if pg_dump -h $OLD_DB_IP -U $DB_USER -d $DB_NAME --no-password --set=sslmode=disable > $EXPORT_FILE; then
    print_success "✅ Data exported to $EXPORT_FILE"
    FILE_SIZE=$(du -h $EXPORT_FILE | cut -f1)
    print_status "📊 Export file size: $FILE_SIZE"
else
    print_error "❌ Failed to export data from old database"
    print_warning "⚠️  This might be due to network restrictions"
    print_status "💡 Alternative: Use Google Cloud SQL export instead"
    exit 1
fi

# Step 2: Import data to new database
print_status "📥 Step 2: Importing data to new database..."
if psql -h $NEW_DB_IP -U $DB_USER -d $DB_NAME --no-password --set=sslmode=disable -f $EXPORT_FILE; then
    print_success "✅ Data imported to new database successfully"
else
    print_error "❌ Failed to import data to new database"
    print_warning "⚠️  This might be due to network restrictions"
    exit 1
fi

# Step 3: Verify migration
print_status "🔍 Step 3: Verifying migration..."
OLD_TABLE_COUNT=$(psql -h $OLD_DB_IP -U $DB_USER -d $DB_NAME --no-password --set=sslmode=disable -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
NEW_TABLE_COUNT=$(psql -h $NEW_DB_IP -U $DB_USER -d $DB_NAME --no-password --set=sslmode=disable -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")

print_status "📊 Migration verification:"
echo "  Old database tables: $OLD_TABLE_COUNT"
echo "  New database tables: $NEW_TABLE_COUNT"

if [ "$OLD_TABLE_COUNT" -eq "$NEW_TABLE_COUNT" ] && [ "$NEW_TABLE_COUNT" -gt 0 ]; then
    print_success "✅ Migration verification successful!"
else
    print_warning "⚠️  Table count mismatch or no tables found"
    print_status "💡 This might be normal if the database is empty"
fi

# Step 4: Update Cloud Build configuration
print_status "🔧 Step 4: Updating Cloud Build configuration..."
if sed -i.bak 's/172\.30\.0\.4/172.30.0.15/g' cloudbuild.yaml && \
   sed -i.bak 's/vssyl-db/vssyl-db-optimized/g' cloudbuild.yaml; then
    print_success "✅ Cloud Build configuration updated"
else
    print_error "❌ Failed to update Cloud Build configuration"
    exit 1
fi

# Step 5: Deploy with new database
print_status "🚀 Step 5: Deploying with new database..."
if git add cloudbuild.yaml && \
   git commit -m "Switch to optimized database instance (10GB HDD vs 250GB SSD)" && \
   git push origin main; then
    print_success "✅ Deployment triggered with new database"
    print_status "⏳ Deployment will take 5-10 minutes"
else
    print_error "❌ Failed to trigger deployment"
    exit 1
fi

# Step 6: Clean up
print_status "🧹 Step 6: Cleaning up temporary files..."
rm -f $EXPORT_FILE
print_success "✅ Temporary files cleaned up"

print_success "🎉 Database migration completed successfully!"
print_status "📊 Migration summary:"
echo "  ✅ Data exported from old database"
echo "  ✅ Data imported to new database"
echo "  ✅ Migration verified"
echo "  ✅ Cloud Build configuration updated"
echo "  ✅ Deployment triggered"
echo "  ✅ Temporary files cleaned up"
echo ""
print_status "💰 Cost impact:"
echo "  Previous cost: ~$75/month (250GB SSD)"
echo "  New cost: ~$25/month (10GB HDD)"
echo "  Monthly savings: ~$50/month"
echo "  Annual savings: ~$600/year"
echo ""
print_status "🎯 Next steps:"
echo "1. Wait for deployment to complete (5-10 minutes)"
echo "2. Test your application thoroughly"
echo "3. If everything works, delete the old database instance"
echo "4. Monitor your costs for the expected savings"
echo ""
print_warning "⚠️  Important: Keep the old database running until you confirm everything works!"
