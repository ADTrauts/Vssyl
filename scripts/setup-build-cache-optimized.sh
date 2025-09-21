#!/bin/bash

# Setup optimized build cache for Vssyl
set -e

# Get project ID
PROJECT_ID=${1:-$(gcloud config get-value project)}

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No project ID provided and none set in gcloud config"
    echo "Usage: $0 [PROJECT_ID]"
    exit 1
fi

echo "🚀 Setting up optimized build cache for project: $PROJECT_ID"

# Create the build cache bucket
BUCKET_NAME="${PROJECT_ID}-build-cache"
echo "📦 Creating cache bucket: $BUCKET_NAME"

if gsutil ls -b gs://$BUCKET_NAME >/dev/null 2>&1; then
    echo "✅ Bucket already exists: $BUCKET_NAME"
else
    gsutil mb -p $PROJECT_ID gs://$BUCKET_NAME
    echo "✅ Created bucket: $BUCKET_NAME"
fi

# Set lifecycle policy to delete old cache after 7 days
echo "⏰ Setting up lifecycle policy (7-day retention)..."
cat > /tmp/lifecycle.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 7}
      }
    ]
  }
}
EOF

gsutil lifecycle set /tmp/lifecycle.json gs://$BUCKET_NAME
rm /tmp/lifecycle.json

# Grant Cloud Build access to the bucket
echo "🔐 Granting Cloud Build access to cache bucket..."
CLOUDBUILD_SA="${PROJECT_ID}@cloudbuild.gserviceaccount.com"

gsutil iam ch serviceAccount:$CLOUDBUILD_SA:objectAdmin gs://$BUCKET_NAME
gsutil iam ch serviceAccount:$CLOUDBUILD_SA:legacyBucketReader gs://$BUCKET_NAME

echo "✅ Build cache setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Replace cloudbuild.yaml with cloudbuild-optimized.yaml"
echo "2. Test with a build to create initial cache"
echo "3. Subsequent builds should be 3-5 minutes instead of 10-15 minutes"
echo ""
echo "🔄 To switch to optimized build:"
echo "   mv cloudbuild.yaml cloudbuild-original-backup.yaml"
echo "   mv cloudbuild-optimized.yaml cloudbuild.yaml"
echo "   git add cloudbuild.yaml && git commit -m 'feat: implement optimized build caching' && git push"
