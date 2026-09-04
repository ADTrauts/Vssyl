#!/bin/bash
# Post-Deployment Module Registration Script
# Run after deploying to Cloud Run to register built-in modules.
# Uses Secret Manager for DATABASE_URL — does not embed credentials.
set -euo pipefail

echo "Post-Deployment Module Registration"
echo "======================================"
echo ""

SERVER_URL=${1:-"https://vssyl-server-235369681725.us-central1.run.app"}
echo "Server URL: $SERVER_URL"
echo ""

echo "Running module registration via Cloud Run Job..."
echo ""

# Prefer secret binding over embedding DATABASE_URL in env literals.
gcloud run jobs create register-modules \
  --image=us-central1-docker.pkg.dev/vssyl-472202/vssyl/vssyl-server:latest \
  --region=us-central1 \
  --vpc-connector=default \
  --set-secrets="DATABASE_URL=database-url:latest" \
  --command="node" \
  --args="server/dist/scripts/register-built-in-modules.js" \
  --max-retries=0 \
  --task-timeout=300s \
  2>/dev/null || {
    echo "Job may already exist; updating secret binding..."
    gcloud run jobs update register-modules \
      --region=us-central1 \
      --set-secrets="DATABASE_URL=database-url:latest" \
      >/dev/null
  }

gcloud run jobs execute register-modules --region=us-central1 --wait

echo ""
echo "Module registration complete!"
echo ""
echo "Verify registration at:"
echo "   ${SERVER_URL}/admin-portal/ai-learning"
