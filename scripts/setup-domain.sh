#!/bin/bash

# Domain Setup Script for Vssyl
# This script helps configure a custom domain for your Google Cloud Run services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🌐 Vssyl Domain Setup Script${NC}"
echo "=================================="

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ Not authenticated with gcloud. Please run 'gcloud auth login' first.${NC}"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project)
echo -e "${YELLOW}📋 Current project: ${PROJECT_ID}${NC}"

# Get current service URLs
echo -e "${YELLOW}🔍 Current service URLs:${NC}"
WEB_URL=$(gcloud run services describe vssyl-web --region=us-central1 --format="value(status.url)")
SERVER_URL=$(gcloud run services describe vssyl-server --region=us-central1 --format="value(status.url)")

echo "  Web: ${WEB_URL}"
echo "  Server: ${SERVER_URL}"

# Prompt for domain
echo ""
echo -e "${YELLOW}📝 Enter your custom domain (e.g., vssyl.com):${NC}"
read -p "Domain: " CUSTOM_DOMAIN

if [ -z "$CUSTOM_DOMAIN" ]; then
    echo -e "${RED}❌ Domain cannot be empty${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔧 Setting up domain: ${CUSTOM_DOMAIN}${NC}"

# Create domain mapping for web service
echo -e "${YELLOW}📱 Creating domain mapping for web service...${NC}"
gcloud run domain-mappings create \
    --service=vssyl-web \
    --domain="${CUSTOM_DOMAIN}" \
    --region=us-central1 \
    --project="${PROJECT_ID}"

# Create subdomain mapping for API
echo -e "${YELLOW}🔌 Creating domain mapping for API service...${NC}"
gcloud run domain-mappings create \
    --service=vssyl-server \
    --domain="api.${CUSTOM_DOMAIN}" \
    --region=us-central1 \
    --project="${PROJECT_ID}"

echo ""
echo -e "${GREEN}✅ Domain mappings created successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Update your DNS records with the following information:"
echo "   - A record: ${CUSTOM_DOMAIN} → [IP from domain mapping]"
echo "   - A record: api.${CUSTOM_DOMAIN} → [IP from domain mapping]"
echo ""
echo "2. Update your cloudbuild.yaml with the new domain:"
echo "   - Replace all instances of 'vssyl-web-zykigsc2xa-uc.a.run.app' with '${CUSTOM_DOMAIN}'"
echo "   - Replace all instances of 'vssyl-server-zykigsc2xa-uc.a.run.app' with 'api.${CUSTOM_DOMAIN}'"
echo ""
echo "3. Update your environment variables:"
echo "   - NEXTAUTH_URL=https://${CUSTOM_DOMAIN}"
echo "   - NEXT_PUBLIC_APP_URL=https://${CUSTOM_DOMAIN}"
echo "   - NEXT_PUBLIC_API_URL=https://api.${CUSTOM_DOMAIN}"
echo "   - BACKEND_URL=https://api.${CUSTOM_DOMAIN}"
echo ""
echo -e "${GREEN}🎉 Domain setup complete!${NC}"
