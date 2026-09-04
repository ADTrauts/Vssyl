#!/bin/bash
# Historical one-shot DB cutover helper.
# Requires OLD_DATABASE_URL and NEW_DATABASE_URL. Does not embed credentials.
# Does NOT auto-commit or push repository changes.
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
  exit 1
fi

if ! command -v pg_dump >/dev/null || ! command -v psql >/dev/null; then
  print_error "pg_dump and psql are required."
  exit 1
fi

EXPORT_FILE="database-export-$(date +%s).sql"
print_status "Exporting from old database..."
pg_dump "$OLD_DATABASE_URL" > "$EXPORT_FILE"
print_success "Exported to temporary file (filename only logged)"

print_status "Importing into new database..."
psql "$NEW_DATABASE_URL" -f "$EXPORT_FILE"
print_success "Import complete"

rm -f "$EXPORT_FILE"
print_success "Temporary export removed"
print_warning "Update Secret Manager / Cloud Run bindings separately. Do not commit credentials or dump files."
print_status "This script no longer modifies cloudbuild.yaml or performs git commit/push."
