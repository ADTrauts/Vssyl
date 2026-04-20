#!/bin/bash
# Clean Database Reset Script
# WARNING: This will DELETE ALL DATA and reset migrations
# Only run if you have no important data!

set -e

echo "⚠️  WARNING: This will DELETE ALL DATA and reset migrations!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo ""
echo "🔄 Step 1: Building schema from modules..."
pnpm prisma:build

echo ""
echo "🗑️  Step 2: Resetting database and migrations..."
pnpm prisma migrate reset --force --skip-seed

echo ""
echo "📦 Step 3: Creating fresh baseline migration..."
pnpm prisma migrate dev --name initial_schema_baseline

echo ""
echo "✅ Step 4: Verifying migration status..."
pnpm prisma migrate status

echo ""
echo "🔍 Step 5: Checking for drift..."
pnpm prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma || echo "No drift detected ✅"

echo ""
echo "🎉 Step 6: Generating Prisma client..."
pnpm prisma:generate

echo ""
echo "✅ Database reset complete!"
echo "📊 Migration count: $(ls -d prisma/migrations/2* 2>/dev/null | wc -l)"
echo ""
echo "Next steps:"
echo "  1. Test your application: pnpm dev"
echo "  2. Verify everything works"
echo "  3. Deploy to production (see docs/archive/migration/CLEAN_RESTART_PLAN.md)"
