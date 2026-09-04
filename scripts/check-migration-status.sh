#!/bin/bash
# Check migration status — requires DATABASE_URL from environment / Secret Manager.
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

print_status "Checking migration status..."
if ! pnpm prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
  print_error "Cannot connect to database. Check DATABASE_URL (not logged here)."
  exit 1
fi

print_status "Migration Status:"
pnpm prisma migrate status
print_status ""
print_status "To apply pending migrations: pnpm prisma migrate deploy"
print_warning "Ensure you have a backup before applying production migrations."
