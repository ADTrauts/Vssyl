#!/bin/bash

# Production Service Test Script for Vssyl
# This script tests the production services to ensure they're working correctly

set -e

echo "🧪 Testing Vssyl Production Services..."

# Service URLs
WEB_URL="https://vssyl-web-235369681725.northamerica-northeast2.run.app"
API_URL="https://vssyl-server-235369681725.northamerica-northeast2.run.app"

echo "📋 Testing Services:"
echo "   Web App: $WEB_URL"
echo "   API: $API_URL"
echo ""

# Test Web Service
echo "🌐 Testing Web Service..."
if curl -s -o /dev/null -w "%{http_code}" "$WEB_URL" | grep -q "200"; then
    echo "   ✅ Web service is responding (HTTP 200)"
else
    echo "   ❌ Web service is not responding correctly"
    echo "   Response: $(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL")"
fi

# Test API Service
echo "🔌 Testing API Service..."
if curl -s -o /dev/null -w "%{http_code}" "$API_URL" | grep -q "200\|403"; then
    echo "   ✅ API service is responding"
else
    echo "   ❌ API service is not responding"
    echo "   Response: $(curl -s -o /dev/null -w "%{http_code}" "$API_URL")"
fi

# Test API Health Endpoint
echo "🏥 Testing API Health Endpoint..."
if curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health" | grep -q "200"; then
    echo "   ✅ API health endpoint is working (HTTP 200)"
else
    echo "   ⚠️  API health endpoint response: $(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health")"
fi

# Test API with proper headers
echo "🔐 Testing API with CORS headers..."
if curl -s -H "Origin: $WEB_URL" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: X-Requested-With" -X OPTIONS "$API_URL" | grep -q "200\|204"; then
    echo "   ✅ API CORS is configured correctly"
else
    echo "   ⚠️  API CORS may need configuration"
fi

echo ""
echo "📊 Service Status Summary:"
echo "   Web Service: $(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL")"
echo "   API Service: $(curl -s -o /dev/null -w "%{http_code}" "$API_URL")"
echo "   API Health: $(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health")"

echo ""
echo "🔧 If services are not working correctly:"
echo "1. Check Cloud Run service logs:"
echo "   gcloud run services logs read vssyl-web --region=northamerica-northeast2 --limit=50"
echo "   gcloud run services logs read vssyl-server --region=northamerica-northeast2 --limit=50"
echo ""
echo "2. Check service status:"
echo "   gcloud run services list --region=northamerica-northeast2"
echo ""
echo "3. Redeploy if needed:"
echo "   ./scripts/deploy-production.sh"
