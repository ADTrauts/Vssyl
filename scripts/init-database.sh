#!/bin/bash
# Initialize database schema using Prisma.
# Requires DATABASE_URL from the environment / Secret Manager.
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

if [ -z "${DATABASE_URL:-}" ]; then
  print_error "DATABASE_URL is not set."
  print_status "Export DATABASE_URL from Secret Manager (database-url). Do not embed credentials in this script."
  exit 1
fi

print_status "Initializing database schema (DATABASE_URL value not logged)..."
print_status "Generating Prisma client..."
pnpm prisma generate

print_status "Running database migrations..."
pnpm prisma migrate deploy

print_success "Database schema initialization finished."
