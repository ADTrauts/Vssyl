#!/bin/bash

# Production Deployment Script for Vssyl
# This script deploys the application to Google Cloud Run with proper environment variables

set -e

echo "🚀 Starting Vssyl Production Deployment..."

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: Not authenticated with gcloud. Please run 'gcloud auth login' first."
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No project set. Please run 'gcloud config set project YOUR_PROJECT_ID' first."
    exit 1
fi

echo "📋 Project ID: $PROJECT_ID"

# Check if Cloud Build is enabled
echo "🔍 Checking Cloud Build API..."
if ! gcloud services list --enabled --filter="name:cloudbuild.googleapis.com" --format="value(name)" | grep -q cloudbuild; then
    echo "⚠️  Cloud Build API not enabled. Enabling now..."
    gcloud services enable cloudbuild.googleapis.com
fi

# Check if Cloud Run API is enabled
echo "🔍 Checking Cloud Run API..."
if ! gcloud services list --enabled --filter="name:run.googleapis.com" --format="value(name)" | grep -q run; then
    echo "⚠️  Cloud Run API not enabled. Enabling now..."
    gcloud services enable run.googleapis.com
fi

# Check if Container Registry API is enabled
echo "🔍 Checking Container Registry API..."
if ! gcloud services list --enabled --filter="name:containerregistry.googleapis.com" --format="value(name)" | grep -q containerregistry; then
    echo "⚠️  Container Registry API not enabled. Enabling now..."
    gcloud services enable containerregistry.googleapis.com
fi

# Trigger Cloud Build
echo "🏗️  Starting Cloud Build deployment..."
gcloud builds submit --config cloudbuild.yaml .

echo "✅ Deployment initiated! Check the Cloud Build console for progress:"
echo "https://console.cloud.google.com/cloud-build/builds?project=$PROJECT_ID"

# Wait for deployment to complete
echo "⏳ Waiting for deployment to complete..."
gcloud builds list --limit=1 --format="value(id,status)" --filter="status=WORKING OR status=QUEUED"

echo "🎉 Deployment process started! The services will be available at:"
echo "   Web App: https://vssyl-web-235369681725.northamerica-northeast2.run.app"
echo "   API: https://vssyl-server-235369681725.northamerica-northeast2.run.app"

echo ""
echo "📝 Next steps:"
echo "1. Monitor the deployment in the Cloud Build console"
echo "2. Test the services once deployment is complete"
echo "3. Check service logs if there are any issues"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: gcloud run services logs read vssyl-web --region=northamerica-northeast2"
echo "   View logs: gcloud run services logs read vssyl-server --region=northamerica-northeast2"
echo "   Test web: curl -I https://vssyl-web-235369681725.northamerica-northeast2.run.app"
echo "   Test API: curl -I https://vssyl-server-235369681725.northamerica-northeast2.run.app/api/health"
