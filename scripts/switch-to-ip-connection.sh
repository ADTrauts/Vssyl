#!/bin/bash
# Add a new database-url Secret Manager version from an operator-supplied URL.
# Does not embed production credentials in this repository.
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

GCP_PROJECT_ID="${GCP_PROJECT_ID:-vssyl-472202}"
SECRET_NAME="database-url"

if [ -z "${DATABASE_URL:-}" ]; then
  echo -e "${RED}DATABASE_URL is not set${NC}"
  echo "Export the intended connection URL in your shell (from Secret Manager or an authorized channel),"
  echo "then re-run. This script will not invent or hard-code credentials."
  exit 1
fi

echo -e "${YELLOW}Adding a new ${SECRET_NAME} version from DATABASE_URL env (value not logged)${NC}"
echo -n "${DATABASE_URL}" | gcloud secrets versions add "${SECRET_NAME}" \
  --project="${GCP_PROJECT_ID}" \
  --data-file=-

NEW_LATEST=$(gcloud secrets versions list "${SECRET_NAME}" \
  --project="${GCP_PROJECT_ID}" \
  --limit=1 \
  --format="value(name)")

echo -e "${GREEN}New latest version: ${NEW_LATEST}${NC}"
echo "Redeploy / update vssyl-server so Cloud Run picks up database-url:latest"
echo "See docs/deployment/MANUAL_CLOUD_BUILD_DEPLOY.md and docs/setup/UPDATE_SECRETS_GUIDE.md"
