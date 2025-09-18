#!/bin/bash

# Smart build script that only builds what changed
# This can be used locally or in CI to determine what needs rebuilding

set -e

# Get the last commit hash
LAST_COMMIT=${1:-$(git rev-parse HEAD~1)}
CURRENT_COMMIT=$(git rev-parse HEAD)

echo "🔍 Analyzing changes between $LAST_COMMIT and $CURRENT_COMMIT"

# Check what files changed
CHANGED_FILES=$(git diff --name-only $LAST_COMMIT $CURRENT_COMMIT)

echo "📝 Changed files:"
echo "$CHANGED_FILES"
echo ""

# Determine what needs to be built
BUILD_SERVER=false
BUILD_WEB=false
BUILD_SHARED=false

# Check for shared package changes
if echo "$CHANGED_FILES" | grep -E "^(shared/|package\.json|pnpm-lock\.yaml|tsconfig\.json)" > /dev/null; then
    BUILD_SHARED=true
    BUILD_SERVER=true
    BUILD_WEB=true
    echo "🔄 Shared package changed - will build everything"
fi

# Check for server changes
if echo "$CHANGED_FILES" | grep -E "^server/" > /dev/null; then
    BUILD_SERVER=true
    echo "🔄 Server code changed"
fi

# Check for web changes
if echo "$CHANGED_FILES" | grep -E "^web/" > /dev/null; then
    BUILD_WEB=true
    echo "🔄 Web code changed"
fi

# Check for Dockerfile changes
if echo "$CHANGED_FILES" | grep -E "Dockerfile" > /dev/null; then
    BUILD_SERVER=true
    BUILD_WEB=true
    echo "🔄 Dockerfile changed - will build both services"
fi

# Check for build config changes
if echo "$CHANGED_FILES" | grep -E "cloudbuild" > /dev/null; then
    BUILD_SERVER=true
    BUILD_WEB=true
    echo "🔄 Build configuration changed - will build both services"
fi

# Output build plan
echo ""
echo "📋 Build Plan:"
echo "  Build Shared: $BUILD_SHARED"
echo "  Build Server: $BUILD_SERVER"
echo "  Build Web:    $BUILD_WEB"

# Export variables for use in Cloud Build
echo ""
echo "🔧 Environment variables for Cloud Build:"
echo "  BUILD_SHARED=$BUILD_SHARED"
echo "  BUILD_SERVER=$BUILD_SERVER"
echo "  BUILD_WEB=$BUILD_WEB"

# Create build flags
if [ "$BUILD_SERVER" = true ] && [ "$BUILD_WEB" = true ]; then
    echo "  BUILD_ALL=true"
else
    echo "  BUILD_ALL=false"
fi

# If nothing changed, we might still want to build (e.g., for testing)
if [ "$BUILD_SERVER" = false ] && [ "$BUILD_WEB" = false ]; then
    echo ""
    echo "⚠️  No changes detected that require rebuilding"
    echo "   This might be a configuration-only change or the first build"
fi
