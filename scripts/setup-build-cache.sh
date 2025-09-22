#!/bin/bash

# Setup Cloud Storage bucket for build caching
# This script creates the necessary Cloud Storage bucket and sets up permissions

set -e

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No project ID found. Please run 'gcloud config set project YOUR_PROJECT_ID'"
    exit 1
fi

BUCKET_NAME="${PROJECT_ID}-build-cache"
REGION="us-central1"

echo "🚀 Setting up build cache for project: $PROJECT_ID"
echo "📦 Bucket name: $BUCKET_NAME"
echo "🌍 Region: $REGION"

# Create the bucket if it doesn't exist
echo "🔍 Checking if bucket exists..."
if gsutil ls gs://$BUCKET_NAME >/dev/null 2>&1; then
    echo "✅ Bucket $BUCKET_NAME already exists"
else
    echo "📦 Creating bucket $BUCKET_NAME..."
    gsutil mb -l $REGION gs://$BUCKET_NAME
    echo "✅ Bucket created successfully"
fi

# Set bucket lifecycle policy to manage costs
echo "⚙️ Setting up lifecycle policy..."
cat > /tmp/lifecycle.json << EOF
{
  "rule": [
    {
      "action": {
        "type": "Delete"
      },
      "condition": {
        "age": 30
      }
    }
  ]
}
EOF

gsutil lifecycle set /tmp/lifecycle.json gs://$BUCKET_NAME
rm /tmp/lifecycle.json
echo "✅ Lifecycle policy set (files older than 30 days will be deleted)"

# Set appropriate permissions
echo "🔐 Setting up permissions..."
gsutil iam ch serviceAccount:$PROJECT_ID@cloudbuild.gserviceaccount.com:objectAdmin gs://$BUCKET_NAME
echo "✅ Permissions set for Cloud Build service account"

# Create initial cache structure
echo "📁 Creating initial cache structure..."
gsutil mkdir -p gs://$BUCKET_NAME/pnpm-cache
gsutil mkdir -p gs://$BUCKET_NAME/node_modules
echo "✅ Cache structure created"

echo ""
echo "🎉 Build cache setup complete!"
echo ""
echo "📋 Summary:"
echo "   • Bucket: gs://$BUCKET_NAME"
echo "   • Region: $REGION"
echo "   • Lifecycle: 30 days"
echo "   • Permissions: Cloud Build service account has objectAdmin access"
echo ""
echo "🚀 Your next build will start caching dependencies!"
echo "   Subsequent builds should be significantly faster."