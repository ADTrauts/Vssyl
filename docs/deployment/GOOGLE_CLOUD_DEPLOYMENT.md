# Google Cloud Deployment Guide for Vssyl

This guide provides step-by-step instructions for deploying the Vssyl digital workspace platform to Google Cloud.

## 🚀 Quick Start

### Prerequisites
- Google Cloud account with billing enabled
- `gcloud` CLI installed and authenticated
- Domain name (optional, for custom domain setup)

### 1. Initial Setup
```bash
# Clone the repository and navigate to project
cd /path/to/vssyl

# Run the Google Cloud setup script
./scripts/setup-gcp.sh YOUR_PROJECT_ID
```

### 2. Configure Environment
```bash
# Copy the environment template
cp env.production.template .env.production

# Edit with your actual values
nano .env.production
```

### 3. Deploy Application
```bash
# Deploy to Google Cloud Run
./scripts/deploy.sh
```

## 📋 Detailed Setup Instructions

### Step 1: Google Cloud Project Setup

1. **Create a new Google Cloud project** or use an existing one
2. **Enable billing** for the project
3. **Install and authenticate gcloud CLI**:
   ```bash
   # Install gcloud CLI
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   
   # Authenticate
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

### Step 2: Run Automated Setup

The setup script will create all necessary Google Cloud resources:

```bash
./scripts/setup-gcp.sh YOUR_PROJECT_ID
```

This script creates:
- ✅ Cloud SQL PostgreSQL instance
- ✅ Cloud Storage bucket for file uploads
- ✅ Secret Manager for sensitive data
- ✅ Service accounts with proper permissions
- ✅ Production environment file template

### Step 3: Configure Environment Variables

Edit `.env.production` with your actual values:

```bash
# Required: Update these values
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com

# Required: Add your API keys
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# Required: Configure email service
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=notifications@your-domain.com

# Required: Generate VAPID keys for push notifications
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

### Step 4: Run Database Migrations

```bash
# Run Prisma migrations on production database
./scripts/migrate-database.sh
```

### Step 5: Deploy Application

```bash
# Deploy to Google Cloud Run
./scripts/deploy.sh
```

## 🔧 Manual Configuration

### Cloud SQL Database

The setup script creates a Cloud SQL instance, but you may need to configure additional settings:

```bash
# Connect to your database
gcloud sql connect vssyl-db --user=vssyl_user --database=vssyl_production

# Or use Cloud SQL Proxy
cloud_sql_proxy -instances=YOUR_PROJECT:us-central1:vssyl-db=tcp:5432
```

### Cloud Storage Configuration

Set up Cloud Storage for file uploads:

```bash
# Run the storage setup script
./scripts/setup-cloud-storage.sh

# Or manually configure
gsutil mb -p YOUR_PROJECT_ID -c STANDARD -l us-central1 gs://vssyl-uploads-YOUR_PROJECT_ID
```

### Custom Domain Setup

1. **Add your domain to Google Cloud**:
   ```bash
   gcloud domains registrations describe YOUR_DOMAIN
   ```

2. **Create SSL certificate**:
   ```bash
   gcloud compute ssl-certificates create vssyl-ssl-cert \
     --domains=your-domain.com,www.your-domain.com
   ```

3. **Update DNS records** to point to your Cloud Run service URLs

4. **Update environment variables** with your domain

## 🏗️ Architecture Overview

### Services Deployed

1. **vssyl-server** (Cloud Run)
   - Backend API server
   - Express.js with TypeScript
   - Handles authentication, business logic, AI integration

2. **vssyl-web** (Cloud Run)
   - Frontend Next.js application
   - React with TypeScript
   - User interface and client-side logic

3. **vssyl-db** (Cloud SQL)
   - PostgreSQL database
   - Stores all application data
   - Managed by Google Cloud

4. **vssyl-uploads** (Cloud Storage)
   - File storage for uploads
   - Static asset hosting
   - CDN integration

### Network Architecture

```
Internet → Load Balancer → Cloud Run Services
                    ↓
              Cloud SQL (Private IP)
                    ↓
              Cloud Storage
```

## 🔐 Security Configuration

### Environment Variables Security

All sensitive data is stored in Google Secret Manager:

```bash
# View secrets
gcloud secrets list

# Access secret values
gcloud secrets versions access latest --secret="database-password"
```

### Service Account Permissions

The setup script creates a service account with minimal required permissions:
- Cloud SQL Client
- Storage Object Admin
- Secret Manager Secret Accessor
- Logging Log Writer
- Monitoring Metric Writer

### Network Security

- Cloud SQL uses private IP
- Cloud Run services are publicly accessible
- CORS is configured for your domain
- Security headers are set in Next.js config

## 📊 Monitoring and Logging

### Cloud Logging

All application logs are automatically sent to Cloud Logging:

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit=50
```

### Cloud Monitoring

Set up monitoring dashboards:

1. Go to [Cloud Monitoring](https://console.cloud.google.com/monitoring)
2. Create custom dashboards
3. Set up alerts for critical metrics

### Health Checks

Both services have health check endpoints:
- Server: `https://vssyl-server-xxx.run.app/api/health`
- Web: `https://vssyl-web-xxx.run.app/`

## 🚀 Deployment Process

### Automated Deployment

The deployment process uses Google Cloud Build:

1. **Code is pushed** to your repository
2. **Cloud Build triggers** automatically
3. **Docker images are built** and pushed to Container Registry
4. **Cloud Run services are updated** with new images
5. **Health checks verify** deployment success

### Manual Deployment

```bash
# Build and deploy manually
gcloud builds submit --config cloudbuild.yaml

# Or deploy specific service
gcloud run deploy vssyl-server --source=./server
gcloud run deploy vssyl-web --source=./web
```

## 🔄 Updates and Maintenance

### Database Migrations

```bash
# Run migrations
./scripts/migrate-database.sh

# Or manually
npx prisma migrate deploy
```

### Application Updates

```bash
# Deploy updates
./scripts/deploy.sh

# Or update specific service
gcloud run deploy vssyl-server --image=gcr.io/YOUR_PROJECT/vssyl-server:latest
```

### Backup and Recovery

Cloud SQL automatically backs up your database:
- Daily backups
- Point-in-time recovery
- Cross-region replication

## 💰 Cost Optimization

### Cloud Run Optimization

- Services scale to zero when not in use
- Pay only for actual usage
- Automatic scaling based on traffic

### Cloud SQL Optimization

- Start with `db-f1-micro` for development
- Scale up as needed
- Use read replicas for heavy read workloads

### Cloud Storage Optimization

- Lifecycle policies move old files to cheaper storage classes
- CDN integration for static assets
- Compression enabled

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check Cloud SQL instance status
   gcloud sql instances describe vssyl-db
   
   # Test connection
   gcloud sql connect vssyl-db --user=vssyl_user
   ```

2. **Service Deployment Issues**
   ```bash
   # Check service status
   gcloud run services list
   
   # View service logs
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=vssyl-server"
   ```

3. **Environment Variable Issues**
   ```bash
   # Check environment variables
   gcloud run services describe vssyl-server --region=us-central1
   ```

### Debug Commands

```bash
# View all resources
gcloud run services list
gcloud sql instances list
gsutil ls

# Check service health
curl https://vssyl-server-xxx.run.app/api/health
curl https://vssyl-web-xxx.run.app/

# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit=100
```

## 📚 Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [Vssyl Project Documentation](./memory-bank/)

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Google Cloud Console logs
3. Check the application logs in Cloud Logging
4. Verify environment variables are set correctly
5. Ensure all required APIs are enabled

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready
