#!/bin/bash
# Historical dump/restore helper between two Postgres URLs.
# Requires OLD_DATABASE_URL and NEW_DATABASE_URL.
# Do not embed production credentials in this repository.
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

OLD_DATABASE_URL="${OLD_DATABASE_URL:-${DATABASE_URL_OLD:-}}"
NEW_DATABASE_URL="${NEW_DATABASE_URL:-${DATABASE_URL_NEW:-}}"

if [ -z "$OLD_DATABASE_URL" ] || [ -z "$NEW_DATABASE_URL" ]; then
  print_error "OLD_DATABASE_URL and NEW_DATABASE_URL must be set (values not logged)."
  print_status "Obtain URLs from Secret Manager / an authorized operator channel. Never commit them."
  exit 1
fi

if ! command -v pg_dump >/dev/null || ! command -v psql >/dev/null; then
  print_error "pg_dump and psql are required."
  exit 1
fi

print_status "Exporting schema from old database..."
pg_dump "$OLD_DATABASE_URL" --schema-only > schema.sql
print_success "Schema exported"

print_status "Exporting data from old database..."
pg_dump "$OLD_DATABASE_URL" --data-only > data.sql
print_success "Data exported"

print_status "Importing schema into new database..."
psql "$NEW_DATABASE_URL" -f schema.sql
print_success "Schema imported"

print_status "Importing data into new database..."
psql "$NEW_DATABASE_URL" -f data.sql
print_success "Data imported"

rm -f schema.sql data.sql
print_success "Migration helper finished. Update application Secret Manager bindings as needed."
print_warning "Delete temporary dumps if any remain; never commit dump files."
