#!/bin/bash

# Deploy Vssyl to Google Cloud Run
set -e

PROJECT_ID=$(gcloud config get-value project)
COMMIT_SHA=$(git rev-parse --short HEAD)

echo "Deploying Vssyl to Google Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Commit: $COMMIT_SHA"

# Submit build to Cloud Build
gcloud builds submit --config cloudbuild.yaml --substitutions=COMMIT_SHA=$COMMIT_SHA

echo "Deployment completed!"
echo "Check your services at: https://console.cloud.google.com/run"
