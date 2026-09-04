#!/bin/bash
# Inspect database-url Secret Manager format. Does not write credentials.
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

GCP_PROJECT_ID="${GCP_PROJECT_ID:-vssyl-472202}"
SECRET_NAME="database-url"

echo -e "${YELLOW}Checking ${SECRET_NAME} secret metadata/format${NC}"

LATEST_VERSION=$(gcloud secrets versions list "${SECRET_NAME}" \
  --project="${GCP_PROJECT_ID}" \
  --limit=1 \
  --format="value(name)")

if [ -z "$LATEST_VERSION" ]; then
  echo -e "${RED}Could not find latest version${NC}"
  exit 1
fi
echo -e "${GREEN}Latest version: ${LATEST_VERSION}${NC}"

LATEST_VALUE=$(gcloud secrets versions access latest \
  --secret="${SECRET_NAME}" \
  --project="${GCP_PROJECT_ID}")

if [ -z "$LATEST_VALUE" ]; then
  echo -e "${RED}Could not access latest version value${NC}"
  exit 1
fi

# Redact password component before any display
SAFE_VALUE=$(echo "$LATEST_VALUE" | sed 's/:[^@/]*@/:***@/')
echo -e "${BLUE}Current latest value (redacted): ${SAFE_VALUE:0:120}${NC}"

if [[ "$LATEST_VALUE" == *"host=/cloudsql/vssyl-472202:us-central1:vssyl-db-optimized"* ]] && \
   [[ "$LATEST_VALUE" == *"connection_limit=20"* ]]; then
  echo -e "${GREEN}Latest version matches expected Unix-socket style markers${NC}"
  exit 0
fi

echo -e "${YELLOW}Latest version does not match the expected Unix-socket format markers${NC}"
echo "This script no longer writes a replacement secret value (credentials must not live in git)."
echo "To update the secret safely:"
echo "  1. Build the correct URL offline / from an authorized operator channel"
echo "  2. Follow docs/setup/UPDATE_SECRETS_GUIDE.md"
echo "  3. Redeploy or update Cloud Run so it picks up database-url:latest"
exit 1
