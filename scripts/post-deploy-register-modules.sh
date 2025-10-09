#!/bin/bash

# Post-Deployment Module Registration Script
# Run this after deploying to Cloud Run to register built-in modules

set -e

echo "🤖 Post-Deployment Module Registration"
echo "======================================"
echo ""

# Get the server URL
SERVER_URL=${1:-"https://vssyl-server-235369681725.us-central1.run.app"}

echo "📍 Server URL: $SERVER_URL"
echo ""

# Option 1: Run via Cloud Run exec (requires IAM permissions)
echo "🔧 Running module registration via Cloud Run..."
echo ""

gcloud run jobs create register-modules \
  --image=gcr.io/vssyl-472202/vssyl-server:latest \
  --region=us-central1 \
  --vpc-connector=default \
  --set-env-vars="DATABASE_URL=postgresql://vssyl_user:ArthurGeorge116%21@172.30.0.15:5432/vssyl_production?connection_limit=20&pool_timeout=20" \
  --command="node" \
  --args="server/dist/scripts/register-built-in-modules.js" \
  --max-retries=0 \
  --task-timeout=300s \
  2>/dev/null || echo "Job may already exist, updating..."

# Execute the job
gcloud run jobs execute register-modules --region=us-central1 --wait

echo ""
echo "✅ Module registration complete!"
echo ""
echo "💡 You can verify the registration at:"
echo "   ${SERVER_URL}/admin-portal/ai-learning"

