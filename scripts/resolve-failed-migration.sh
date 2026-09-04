#!/bin/bash
# Resolve failed migration helper.
# Requires DATABASE_URL from the environment (e.g. from Secret Manager).
# Do not embed production credentials in this repository.
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  echo "Obtain the production URL from Secret Manager (secret: database-url) and export it in your shell." >&2
  echo "Do not paste credentials into this script or commit them." >&2
  exit 1
fi

echo "Checking migration status (DATABASE_URL value not logged)..."
pnpm prisma migrate status

echo ""
echo "To resolve a failed migration:"
echo "1. Confirm whether the migration actually succeeded (tables might exist)"
echo "2. Mark applied: pnpm prisma migrate resolve --applied <migration_name>"
echo "3. Or mark rolled back: pnpm prisma migrate resolve --rolled-back <migration_name>"
echo ""
echo "This typically requires Cloud SQL Proxy or execution from an authorized network path."
