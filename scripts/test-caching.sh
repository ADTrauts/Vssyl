#!/bin/bash

# Test script to verify caching setup
# This script runs a test build to verify caching is working

set -e

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No project ID found. Please run 'gcloud config set project YOUR_PROJECT_ID'"
    exit 1
fi

echo "🧪 Testing Build Caching Setup"
echo "📦 Project: $PROJECT_ID"
echo ""

# Check if cache bucket exists
BUCKET_NAME="${PROJECT_ID}-build-cache"
if gsutil ls gs://$BUCKET_NAME >/dev/null 2>&1; then
    echo "✅ Cache bucket exists: gs://$BUCKET_NAME"
else
    echo "❌ Cache bucket not found. Run './scripts/setup-build-cache.sh' first"
    exit 1
fi

# Check if cloudbuild.yaml exists
if [ ! -f "cloudbuild.yaml" ]; then
    echo "❌ cloudbuild.yaml not found"
    exit 1
fi

echo "✅ cloudbuild.yaml found"

# Check if Dockerfiles exist
if [ ! -f "server/Dockerfile.production" ] || [ ! -f "web/Dockerfile.production" ]; then
    echo "❌ Production Dockerfiles not found"
    exit 1
fi

echo "✅ Production Dockerfiles found"

# Show current cache status
echo ""
echo "📊 Current Cache Status:"
./scripts/manage-build-cache.sh status

echo ""
echo "🚀 Running test build..."
echo "   This will take 8-12 minutes for the first build"
echo "   Subsequent builds should be much faster"
echo ""

# Run the build
gcloud builds submit --config cloudbuild.yaml . --timeout=1200s

echo ""
echo "✅ Test build completed!"
echo ""
echo "📊 Updated Cache Status:"
./scripts/manage-build-cache.sh status

echo ""
echo "🎉 Caching setup test complete!"
echo ""
echo "💡 Next steps:"
echo "   1. Run another build to test cache effectiveness"
echo "   2. Check build logs for cache hit messages"
echo "   3. Monitor build times in Cloud Build console"
