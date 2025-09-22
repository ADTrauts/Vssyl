#!/bin/bash

# Test script for fast build configuration
# This script tests the streamlined build process

set -e

echo "🚀 Testing Fast Build Configuration"
echo "=================================="
echo ""

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No project ID found. Please run 'gcloud config set project YOUR_PROJECT_ID'"
    exit 1
fi

echo "📦 Project: $PROJECT_ID"
echo ""

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

# Show build configuration
echo ""
echo "🔧 Build Configuration:"
echo "   • Machine Type: E2_HIGHCPU_8 (fast)"
echo "   • Docker Layer Caching: Enabled"
echo "   • BuildKit: Enabled"
echo "   • Timeout: 30 minutes"
echo ""

echo "🚀 Starting fast build test..."
echo "   Expected time: 5-10 minutes (first build)"
echo "   Subsequent builds: 2-4 minutes"
echo ""

# Run the build
echo "⏰ Build started at: $(date)"
START_TIME=$(date +%s)

gcloud builds submit --config cloudbuild.yaml . --timeout=1800s

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "✅ Build completed!"
echo "⏰ Total time: $((DURATION / 60)) minutes $((DURATION % 60)) seconds"
echo ""

if [ $DURATION -lt 600 ]; then
    echo "🎉 EXCELLENT! Build completed in under 10 minutes"
elif [ $DURATION -lt 1200 ]; then
    echo "✅ GOOD! Build completed in under 20 minutes"
else
    echo "⚠️  Build took longer than expected. Check logs for issues."
fi

echo ""
echo "💡 Next steps:"
echo "   1. Run another build to test Docker layer caching"
echo "   2. Check build logs for cache hit messages"
echo "   3. Monitor build times in Cloud Build console"
