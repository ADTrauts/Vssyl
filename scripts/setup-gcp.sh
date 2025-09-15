#!/bin/bash

# Google Cloud Setup Script for Vssyl
# This script sets up the necessary Google Cloud services for Vssyl deployment

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

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first:"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_error "You are not authenticated with gcloud. Please run:"
    echo "gcloud auth login"
    exit 1
fi

# Get project ID
PROJECT_ID=${1:-$(gcloud config get-value project)}
if [ -z "$PROJECT_ID" ]; then
    print_error "No project ID provided and no default project set."
    echo "Usage: $0 <PROJECT_ID>"
    echo "Or set default project: gcloud config set project PROJECT_ID"
    exit 1
fi

print_status "Setting up Google Cloud project: $PROJECT_ID"

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
print_status "Enabling required Google Cloud APIs..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    storage.googleapis.com \
    secretmanager.googleapis.com \
    monitoring.googleapis.com \
    logging.googleapis.com \
    cloudresourcemanager.googleapis.com

print_success "APIs enabled successfully"

# Create Cloud SQL instance
print_status "Creating Cloud SQL PostgreSQL instance..."
if gcloud sql instances describe vssyl-db &>/dev/null; then
    print_warning "Cloud SQL instance already exists, skipping creation"
else
    gcloud sql instances create vssyl-db \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=us-central1 \
        --storage-type=SSD \
        --storage-size=10GB \
        --storage-auto-increase \
        --backup-start-time=03:00 \
        --maintenance-window-day=SUN \
        --maintenance-window-hour=04 \
        --deletion-protection \
        --network=default \
        --no-assign-ip
    print_success "Cloud SQL instance created"
fi

# Create database
print_status "Creating database..."
if gcloud sql databases describe vssyl_production --instance=vssyl-db &>/dev/null; then
    print_warning "Database already exists, skipping creation"
else
    gcloud sql databases create vssyl_production --instance=vssyl-db
    print_success "Database created"
fi

# Create database user
print_status "Creating database user..."
if gcloud sql users describe vssyl_user --instance=vssyl-db &>/dev/null; then
    print_warning "Database user already exists, skipping creation"
    # Get existing password from secret manager
    DB_PASSWORD=$(gcloud secrets versions access latest --secret="database-password" 2>/dev/null || echo "password-not-found")
else
    DB_PASSWORD=$(openssl rand -base64 32)
    gcloud sql users create vssyl_user \
        --instance=vssyl-db \
        --password=$DB_PASSWORD
    print_success "Database user created"
    print_warning "Database password: $DB_PASSWORD"
    print_warning "Please save this password securely!"
fi

# Create Cloud Storage bucket
print_status "Creating Cloud Storage bucket..."
BUCKET_NAME="vssyl-uploads-$PROJECT_ID"
if gsutil ls gs://$BUCKET_NAME &>/dev/null; then
    print_warning "Cloud Storage bucket already exists, skipping creation"
else
    gsutil mb -p $PROJECT_ID -c STANDARD -l us-central1 gs://$BUCKET_NAME
    print_success "Cloud Storage bucket created: $BUCKET_NAME"
fi

# Create secrets in Secret Manager
print_status "Creating secrets in Secret Manager..."

# Generate secrets
JWT_SECRET=$(openssl rand -base64 64)
NEXTAUTH_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)

# Create secrets (skip if they already exist)
if ! gcloud secrets describe database-password &>/dev/null; then
    echo -n "$DB_PASSWORD" | gcloud secrets create database-password --data-file=-
    print_status "Created database-password secret"
else
    print_warning "database-password secret already exists, skipping"
fi

if ! gcloud secrets describe jwt-secret &>/dev/null; then
    echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-
    print_status "Created jwt-secret secret"
else
    print_warning "jwt-secret secret already exists, skipping"
fi

if ! gcloud secrets describe nextauth-secret &>/dev/null; then
    echo -n "$NEXTAUTH_SECRET" | gcloud secrets create nextauth-secret --data-file=-
    print_status "Created nextauth-secret secret"
else
    print_warning "nextauth-secret secret already exists, skipping"
fi

if ! gcloud secrets describe jwt-refresh-secret &>/dev/null; then
    echo -n "$JWT_REFRESH_SECRET" | gcloud secrets create jwt-refresh-secret --data-file=-
    print_status "Created jwt-refresh-secret secret"
else
    print_warning "jwt-refresh-secret secret already exists, skipping"
fi

print_success "Secrets setup completed in Secret Manager"

# Create service account for Cloud Run
print_status "Creating service account..."
if gcloud iam service-accounts describe vssyl-service-account@$PROJECT_ID.iam.gserviceaccount.com &>/dev/null; then
    print_warning "Service account already exists, skipping creation"
else
    gcloud iam service-accounts create vssyl-service-account \
        --display-name="Vssyl Service Account" \
        --description="Service account for Vssyl Cloud Run services"
    print_success "Service account created"
fi

# Wait a moment for service account to be fully available
sleep 5

# Grant necessary permissions
print_status "Granting permissions to service account..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:vssyl-service-account@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:vssyl-service-account@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:vssyl-service-account@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:vssyl-service-account@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/logging.logWriter"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:vssyl-service-account@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/monitoring.metricWriter"

print_success "Service account permissions granted"

# Create environment file template
print_status "Creating production environment file template..."
cat > .env.production << EOF
# Production Environment Variables for Vssyl
# Generated on $(date)

# Database Configuration
DATABASE_URL=postgresql://vssyl_user:${DB_PASSWORD}@/vssyl_production?host=/cloudsql/${PROJECT_ID}:us-central1:vssyl-db
DIRECT_URL=postgresql://vssyl_user:${DB_PASSWORD}@/vssyl_production?host=/cloudsql/${PROJECT_ID}:us-central1:vssyl-db

# Application Configuration
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}

# API Configuration (will be updated after deployment)
BACKEND_URL=https://vssyl-server-xxxxx-uc.a.run.app
NEXT_PUBLIC_API_URL=https://vssyl-server-xxxxx-uc.a.run.app
NEXT_PUBLIC_APP_URL=https://your-domain.com

# File Storage
GOOGLE_CLOUD_PROJECT_ID=${PROJECT_ID}
GOOGLE_CLOUD_STORAGE_BUCKET=${BUCKET_NAME}
FILE_STORAGE_TYPE=cloud-storage

# WebSocket Configuration (will be updated after deployment)
WEBSOCKET_URL=wss://vssyl-server-xxxxx-uc.a.run.app
NEXT_PUBLIC_WEBSOCKET_URL=wss://vssyl-server-xxxxx-uc.a.run.app

# CORS Configuration
CORS_ORIGIN=https://your-domain.com

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_FILE_UPLOADS=true
ENABLE_REAL_TIME_CHAT=true

# TODO: Add your API keys and email configuration
# OPENAI_API_KEY=your-openai-api-key
# ANTHROPIC_API_KEY=your-anthropic-api-key
# STRIPE_SECRET_KEY=your-stripe-secret-key
# STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
# SMTP_HOST=your-smtp-host
# SMTP_USER=your-smtp-user
# SMTP_PASS=your-smtp-password
# EMAIL_FROM=notifications@your-domain.com
# VAPID_PUBLIC_KEY=your-vapid-public-key
# VAPID_PRIVATE_KEY=your-vapid-private-key
EOF

print_success "Environment file created: .env.production"

# Create deployment script
print_status "Creating deployment script..."
cat > scripts/deploy.sh << 'EOF'
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
EOF

chmod +x scripts/deploy.sh

print_success "Deployment script created: scripts/deploy.sh"

# Summary
print_success "Google Cloud setup completed!"
echo ""
echo "Next steps:"
echo "1. Update .env.production with your API keys and email configuration"
echo "2. Set up your custom domain and update URLs in .env.production"
echo "3. Run database migrations: pnpm prisma:migrate"
echo "4. Deploy the application: ./scripts/deploy.sh"
echo ""
echo "Important information:"
echo "- Database password: $DB_PASSWORD"
echo "- Storage bucket: $BUCKET_NAME"
echo "- Service account: vssyl-service-account@$PROJECT_ID.iam.gserviceaccount.com"
echo "- Secrets are stored in Secret Manager"
echo ""
print_warning "Remember to save the database password securely!"
