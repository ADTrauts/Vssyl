#!/bin/bash
# Setup database schema via Prisma — requires DATABASE_URL from environment / Secret Manager.
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

if [ -z "${DATABASE_URL:-}" ]; then
  print_error "DATABASE_URL is not set."
  print_status "Export DATABASE_URL from Secret Manager (database-url). Do not embed credentials in this script."
  exit 1
fi
print_status "Using DATABASE_URL from environment (value not logged)."
print_status "Setting up database schema..."

print_status "Testing database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
  print_error "Cannot connect to database."
  exit 1
fi
print_success "Connected successfully"

print_status "Running Prisma migrations..."
if pnpm prisma migrate deploy; then
  print_success "Prisma migrations completed"
else
  print_error "Prisma migrations failed"
  exit 1
fi

TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
print_success "Found $TABLE_COUNT tables"
print_status "Next: verify the application against this database before decommissioning any prior instance."
