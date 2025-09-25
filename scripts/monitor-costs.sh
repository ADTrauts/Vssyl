#!/bin/bash

# Google Cloud Cost Monitoring Script
# This script helps monitor your cost savings after optimization

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "🔍 Checking Google Cloud SQL instance configuration..."

# Get current instance details
INSTANCE_INFO=$(gcloud sql instances describe vssyl-db --project=vssyl-472202 --format="value(settings.tier,settings.dataDiskSizeGb,settings.availabilityType,settings.backupConfiguration.retainedBackups)" 2>/dev/null)

if [ $? -eq 0 ]; then
    IFS=$'\t' read -r TIER STORAGE_SIZE AVAILABILITY BACKUP_RETENTION <<< "$INSTANCE_INFO"
    
    print_success "Current Configuration:"
    echo "  Instance Type: $TIER"
    echo "  Storage Size: ${STORAGE_SIZE}GB"
    echo "  Availability: $AVAILABILITY"
    echo "  Backup Retention: ${BACKUP_RETENTION} days"
    echo ""
    
    # Calculate estimated costs
    case $TIER in
        "db-f1-micro")
            INSTANCE_COST=25
            print_success "✅ Instance optimized to db-f1-micro (~$25/month)"
            ;;
        "db-g1-small")
            INSTANCE_COST=50
            print_warning "⚠️  Instance is db-g1-small (~$50/month) - consider db-f1-micro for more savings"
            ;;
        "db-custom-8-32768")
            INSTANCE_COST=400
            print_error "❌ Instance is still db-custom-8-32768 (~$400/month) - URGENT OPTIMIZATION NEEDED!"
            ;;
        *)
            INSTANCE_COST=100
            print_warning "⚠️  Unknown instance type: $TIER"
            ;;
    esac
    
    # Storage cost calculation
    if [ "$STORAGE_SIZE" -gt 100 ]; then
        STORAGE_COST=$((STORAGE_SIZE * 2))
        print_warning "⚠️  Large storage: ${STORAGE_SIZE}GB (~$${STORAGE_COST}/month) - consider migration"
    else
        STORAGE_COST=$((STORAGE_SIZE / 2))
        print_success "✅ Storage size reasonable: ${STORAGE_SIZE}GB (~$${STORAGE_COST}/month)"
    fi
    
    # Availability cost
    if [ "$AVAILABILITY" = "REGIONAL" ]; then
        AVAILABILITY_COST=150
        print_warning "⚠️  High Availability enabled (~$150/month) - consider disabling for cost savings"
    else
        AVAILABILITY_COST=0
        print_success "✅ High Availability disabled (~$0/month)"
    fi
    
    # Backup cost
    BACKUP_COST=$((BACKUP_RETENTION * 2))
    print_success "✅ Backup retention: ${BACKUP_RETENTION} days (~$${BACKUP_COST}/month)"
    
    # Total cost calculation
    TOTAL_COST=$((INSTANCE_COST + STORAGE_COST + AVAILABILITY_COST + BACKUP_COST))
    
    echo ""
    print_status "💰 Cost Breakdown:"
    echo "  Instance: ~$${INSTANCE_COST}/month"
    echo "  Storage: ~$${STORAGE_COST}/month"
    echo "  Availability: ~$${AVAILABILITY_COST}/month"
    echo "  Backups: ~$${BACKUP_COST}/month"
    echo "  TOTAL: ~$${TOTAL_COST}/month"
    echo ""
    
    # Cost savings analysis
    if [ "$TOTAL_COST" -lt 100 ]; then
        print_success "🎉 EXCELLENT! Your costs are optimized (~$${TOTAL_COST}/month)"
    elif [ "$TOTAL_COST" -lt 200 ]; then
        print_success "✅ Good optimization! Costs are reasonable (~$${TOTAL_COST}/month)"
    elif [ "$TOTAL_COST" -lt 400 ]; then
        print_warning "⚠️  Moderate costs (~$${TOTAL_COST}/month) - consider further optimization"
    else
        print_error "❌ HIGH COSTS! (~$${TOTAL_COST}/month) - URGENT optimization needed!"
    fi
    
else
    print_error "Failed to get instance information. Check your authentication and project settings."
    exit 1
fi

print_status "📊 Checking billing budget alerts..."

# Check if budget alerts are set up
BUDGET_COUNT=$(gcloud billing budgets list --billing-account=0115AA-CFA544-DF3242 --format="value(name)" 2>/dev/null | wc -l)

if [ "$BUDGET_COUNT" -gt 0 ]; then
    print_success "✅ Budget alerts configured ($BUDGET_COUNT budget(s) set up)"
else
    print_warning "⚠️  No budget alerts configured - consider setting up cost monitoring"
fi

print_status "🔍 Checking Cloud Run service costs..."

# Get Cloud Run service details
CLOUD_RUN_SERVICES=$(gcloud run services list --region=us-central1 --format="value(metadata.name,spec.template.spec.containers[0].resources.limits.memory,spec.template.spec.containers[0].resources.limits.cpu)" 2>/dev/null)

if [ $? -eq 0 ] && [ -n "$CLOUD_RUN_SERVICES" ]; then
    echo "$CLOUD_RUN_SERVICES" | while IFS=$'\t' read -r SERVICE_NAME MEMORY CPU; do
        if [ -n "$SERVICE_NAME" ]; then
            print_status "  Service: $SERVICE_NAME"
            echo "    Memory: ${MEMORY:-Not set}"
            echo "    CPU: ${CPU:-Not set}"
        fi
    done
else
    print_warning "⚠️  Could not retrieve Cloud Run service details"
fi

echo ""
print_status "📈 Cost Optimization Recommendations:"

if [ "$TOTAL_COST" -gt 200 ]; then
    echo "1. 🚨 URGENT: Consider migrating to Supabase or PlanetScale for 90%+ cost savings"
    echo "2. 📦 Optimize Cloud Run memory allocation (reduce from 2GB to 512MB)"
    echo "3. 💾 Migrate to smaller storage instance if possible"
fi

if [ "$STORAGE_SIZE" -gt 50 ]; then
    echo "4. 💾 Consider storage migration to reduce from ${STORAGE_SIZE}GB to 10GB"
fi

if [ "$AVAILABILITY" = "REGIONAL" ]; then
    echo "5. 🔄 Disable High Availability to save ~$150/month"
fi

echo ""
print_success "🎯 Next Steps:"
echo "1. Monitor your costs in Google Cloud Console"
echo "2. Test application performance with current settings"
echo "3. Consider alternative database solutions for maximum savings"
echo "4. Set up automated cost alerts"

print_status "📚 For detailed optimization guide, see: GOOGLE_CLOUD_COST_OPTIMIZATION.md"
