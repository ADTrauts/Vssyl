#!/bin/bash

# Setup build cache for faster Cloud Build deployments
# This script creates a Cloud Storage bucket for caching dependencies

set -e

PROJECT_ID=${1:-$(gcloud config get-value project)}

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No project ID provided and no default project set"
    echo "Usage: $0 [PROJECT_ID]"
    echo "Or set default project: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "🚀 Setting up build cache for project: $PROJECT_ID"

# Create the build cache bucket
BUCKET_NAME="${PROJECT_ID}-build-cache"
REGION="us-central1"

echo "📦 Creating build cache bucket: $BUCKET_NAME"

# Check if bucket exists
if gsutil ls -b gs://$BUCKET_NAME >/dev/null 2>&1; then
    echo "✅ Build cache bucket already exists: gs://$BUCKET_NAME"
else
    # Create bucket
    gsutil mb -l $REGION gs://$BUCKET_NAME
    echo "✅ Created build cache bucket: gs://$BUCKET_NAME"
fi

# Set bucket lifecycle policy to clean up old caches
echo "🗑️  Setting up cache cleanup policy..."

cat > /tmp/cache-lifecycle.json << EOF
{
  "rule": [
    {
      "action": {
        "type": "Delete"
      },
      "condition": {
        "age": 7
      }
    }
  ]
}
EOF

gsutil lifecycle set /tmp/cache-lifecycle.json gs://$BUCKET_NAME
rm /tmp/cache-lifecycle.json

echo "✅ Cache cleanup policy set (7 days retention)"

# Set up Cloud Build service account permissions
echo "🔐 Setting up Cloud Build permissions..."

# Get the Cloud Build service account
BUILD_SA="${PROJECT_ID}@cloudbuild.gserviceaccount.com"

# Grant storage admin role for cache operations
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$BUILD_SA" \
    --role="roles/storage.admin" \
    --quiet

echo "✅ Cloud Build service account granted storage permissions"

echo ""
echo "🎉 Build cache setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update your Cloud Build trigger to use cloudbuild-optimized.yaml"
echo "2. First build will be slow (no cache), subsequent builds will be much faster"
echo "3. Dependencies will be cached for 7 days"
echo ""
echo "💡 Expected improvements:"
echo "   - First build: ~15 minutes (same as before)"
echo "   - Subsequent builds: ~3-5 minutes (70% faster!)"
echo "   - Only changed layers will rebuild"
