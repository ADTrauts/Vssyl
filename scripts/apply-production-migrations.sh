#!/bin/bash
# Apply Production Migrations — requires DATABASE_URL from environment / Secret Manager.
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

print_warning "PRODUCTION DATABASE MIGRATION"
print_warning "This will modify the production database schema!"
read -p "Are you sure you want to continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  print_status "Migration cancelled."
  exit 0
fi

print_status "Checking current migration status..."
pnpm prisma migrate status

print_warning "About to apply pending migrations..."
read -p "Continue? (yes/no): " confirm2
if [ "$confirm2" != "yes" ]; then
  print_status "Migration cancelled."
  exit 0
fi

print_status "Building Prisma schema from modules..."
pnpm prisma:build

print_status "Applying migrations..."
if pnpm prisma migrate deploy; then
  print_success "Migrations applied successfully!"
  print_status "Verifying migration status..."
  pnpm prisma migrate status
  print_success "All migrations are now up to date!"
else
  print_error "Migration failed!"
  exit 1
fi
