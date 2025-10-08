#!/bin/bash

# Register Built-in Modules - Shell Script Wrapper
# This runs the TypeScript registration script with proper environment setup

echo "🚀 Starting module registration..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Make sure DATABASE_URL is set in your environment"
    echo ""
fi

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Run the TypeScript registration script
npx ts-node scripts/register-built-in-modules.ts

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo ""
    echo "✅ Module registration completed successfully!"
else
    echo ""
    echo "❌ Module registration failed with exit code: $exit_code"
    exit $exit_code
fi

