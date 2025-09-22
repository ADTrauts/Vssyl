#!/bin/bash

# Manage Cloud Build cache
# This script provides utilities to manage the build cache

set -e

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No project ID found. Please run 'gcloud config set project YOUR_PROJECT_ID'"
    exit 1
fi

BUCKET_NAME="${PROJECT_ID}-build-cache"

# Function to show cache status
show_status() {
    echo "📊 Build Cache Status for project: $PROJECT_ID"
    echo "📦 Bucket: gs://$BUCKET_NAME"
    echo ""
    
    if gsutil ls gs://$BUCKET_NAME >/dev/null 2>&1; then
        echo "✅ Bucket exists"
        
        # Show pnpm cache size
        PNPM_SIZE=$(gsutil du -s gs://$BUCKET_NAME/pnpm-cache 2>/dev/null | awk '{print $1}' || echo "0")
        if [ "$PNPM_SIZE" -gt 0 ]; then
            echo "📦 pnpm cache: $(numfmt --to=iec $PNPM_SIZE)"
        else
            echo "📦 pnpm cache: Empty"
        fi
        
        # Show node_modules cache size
        NODE_SIZE=$(gsutil du -s gs://$BUCKET_NAME/node_modules 2>/dev/null | awk '{print $1}' || echo "0")
        if [ "$NODE_SIZE" -gt 0 ]; then
            echo "📦 node_modules cache: $(numfmt --to=iec $NODE_SIZE)"
        else
            echo "📦 node_modules cache: Empty"
        fi
        
        # Show total size
        TOTAL_SIZE=$(gsutil du -s gs://$BUCKET_NAME 2>/dev/null | awk '{print $1}' || echo "0")
        echo "📊 Total cache size: $(numfmt --to=iec $TOTAL_SIZE)"
        
    else
        echo "❌ Bucket does not exist. Run './scripts/setup-build-cache.sh' first"
    fi
}

# Function to clear cache
clear_cache() {
    echo "🗑️ Clearing build cache..."
    
    if gsutil ls gs://$BUCKET_NAME >/dev/null 2>&1; then
        gsutil -m rm -r gs://$BUCKET_NAME/pnpm-cache/*
        gsutil -m rm -r gs://$BUCKET_NAME/node_modules/*
        echo "✅ Cache cleared"
    else
        echo "❌ Bucket does not exist"
    fi
}

# Function to show cache contents
show_contents() {
    echo "📁 Cache Contents:"
    echo ""
    
    if gsutil ls gs://$BUCKET_NAME >/dev/null 2>&1; then
        echo "📦 pnpm cache:"
        gsutil ls -l gs://$BUCKET_NAME/pnpm-cache/ | head -10
        echo ""
        
        echo "📦 node_modules cache:"
        gsutil ls -l gs://$BUCKET_NAME/node_modules/ | head -10
    else
        echo "❌ Bucket does not exist"
    fi
}

# Function to show help
show_help() {
    echo "🔧 Build Cache Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  status     Show cache status and sizes"
    echo "  clear      Clear all cached data"
    echo "  contents   Show cache contents"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 clear"
    echo "  $0 contents"
}

# Main script logic
case "${1:-help}" in
    "status")
        show_status
        ;;
    "clear")
        clear_cache
        ;;
    "contents")
        show_contents
        ;;
    "help"|*)
        show_help
        ;;
esac
