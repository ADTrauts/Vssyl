<!--
Google Cloud Production Infrastructure
See README for the modular context pattern.
-->

# Google Cloud Production Infrastructure

**Description:**
This file documents the **PRODUCTION** Google Cloud infrastructure for Vssyl, including environment configuration, service setup, and operational procedures.

**Status:** ✅ **PRODUCTION - FULLY OPERATIONAL**  
**Last Updated:** 2025-10-25

## 1. Header & Purpose
- **Purpose:**  
  Document the **PRODUCTION** Google Cloud infrastructure currently running Vssyl. This includes deployed services, environment configuration, monitoring setup, and operational procedures.
- **Cross-References:**  
  - [deployment.md] (CI/CD and deployment procedures)
  - [techContext.md] (technology stack details)
  - [activeContext.md] (current development status)

## 2. Production Services - Currently Deployed ✅

### **Core Infrastructure:**

#### **Cloud Run Services** ✅ LIVE
- **Frontend**: `vssyl-web` → `https://vssyl.com`
  - Next.js 14 application
  - Auto-scaling serverless deployment
  - Domain mapping configured
- **Backend**: `vssyl-server` → `https://vssyl-server-235369681725.us-central1.run.app`
  - Express.js API server
  - WebSocket support via Socket.IO
  - Auto-scaling serverless deployment

#### **Database** ✅ LIVE
- **Cloud SQL PostgreSQL**: Production database
  - Instance: `vssyl-db-buffalo` (replaced by newer instance)
  - Internal IP: `172.30.0.15`
  - Database: `vssyl_production`
  - Connection: Private VPC with Cloud Run
  - Connection Pooling: Configured (limit=20, timeout=20)

#### **Storage** ✅ LIVE
- **Google Cloud Storage**: File storage
  - Bucket: `vssyl-storage-472202`
  - Region: `us-central1`
  - Public access configured for user uploads
  - Integrated via storage service abstraction

#### **CI/CD Pipeline** ✅ AUTOMATED
- **Google Cloud Build**: Automated deployments
  - Trigger: Git push to main branch
  - Build time: ~7-10 minutes
  - Machine type: E2_HIGHCPU_8
  - Multi-stage Docker builds
  - Automatic Prisma schema generation
  - Container Registry: GCR

#### **Secrets Management** ✅ CONFIGURED
- **Google Cloud Secret Manager**: All production secrets
  - JWT secrets
  - Database credentials
  - API keys (Stripe, OpenAI, etc.)
  - VAPID keys for push notifications

#### **Application Features** ✅ DEPLOYED
- **Authentication**: NextAuth.js with JWT
- **WebSocket**: Real-time chat and notifications
- **File Management**: Drive module with GCS integration
- **Business Management**: Multi-tenant business workspaces
- **AI Integration**: OpenAI GPT-4o and Claude-3.5-Sonnet
- **Module Marketplace**: Dynamic module system

## 3. Production Environment Configuration

### **Production Database Configuration** ✅ ACTIVE
```bash
# Production Cloud SQL Connection
DATABASE_URL="postgresql://vssyl_user:ArthurGeorge116!@172.30.0.15:5432/vssyl_production?connection_limit=20&pool_timeout=20"

# Connection Details:
# - Host: 172.30.0.15 (Cloud SQL private IP)
# - Port: 5432
# - Database: vssyl_production
# - User: vssyl_user
# - Connection Pooling: 20 connections, 20s timeout
```

### **Production URLs** ✅ CONFIGURED
```bash
# Frontend Service
NEXT_PUBLIC_APP_URL=https://vssyl.com
NEXTAUTH_URL=https://vssyl.com
NEXT_PUBLIC_WS_URL=wss://vssyl-server-235369681725.us-central1.run.app

# Backend Service  
BACKEND_URL=https://vssyl-server-235369681725.us-central1.run.app
NEXT_PUBLIC_API_BASE_URL=https://vssyl-server-235369681725.us-central1.run.app
FRONTEND_URL=https://vssyl.com
```

### **JWT Secrets** ✅ CONFIGURED
```bash
# Production secrets stored in Google Cloud Secret Manager
JWT_SECRET=<generated-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<generated-with-openssl-rand-base64-32>
NEXTAUTH_SECRET=<32-character-secret>

# Secret generation command:
# openssl rand -base64 32
```

### **Email Notifications (SMTP)**
```bash
# Development (placeholder)
SMTP_HOST=your-smtp-host.com
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
EMAIL_FROM=notifications@yourdomain.com

# Production (real service - choose one)
# Option 1: Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false

# Option 2: SendGrid
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_SECURE=false

# Option 3: Google Workspace
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-workspace-email@yourdomain.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
```

### **Push Notifications (VAPID Keys)**
```bash
# Development (test keys)
VAPID_PUBLIC_KEY=your-test-public-key
VAPID_PRIVATE_KEY=your-test-private-key

# Production (real keys)
VAPID_PUBLIC_KEY=your-production-public-key
VAPID_PRIVATE_KEY=your-production-private-key
```

### **File Storage Configuration** ✅ ACTIVE
```bash
# Production Google Cloud Storage
STORAGE_PROVIDER=gcs
GOOGLE_CLOUD_STORAGE_BUCKET=vssyl-storage-472202
GOOGLE_CLOUD_PROJECT_ID=vssyl-472202

# Authentication: Application Default Credentials (ADC)
# - No key file needed when running on Cloud Run
# - Automatic authentication via service account
```

### **WebSocket Configuration** ✅ ACTIVE
```bash
# Production WebSocket URLs
WEBSOCKET_URL=wss://vssyl-server-235369681725.us-central1.run.app
NEXT_PUBLIC_WEBSOCKET_URL=wss://vssyl-server-235369681725.us-central1.run.app
NEXT_PUBLIC_WS_URL=wss://vssyl-server-235369681725.us-central1.run.app

# Socket.IO configuration with authentication
# - Requires JWT token for connection
# - Supports chat and notifications
```

## 4. Google Cloud Services - Currently Active ✅

### **Active Core Services:**
1. **Cloud SQL**: PostgreSQL database ✅ RUNNING
   - Instance: Production database on private IP
   - Backups: Automated daily backups configured
2. **Cloud Run**: Containerized application hosting ✅ RUNNING
   - vssyl-web (frontend)
   - vssyl-server (backend)
3. **Cloud Storage**: File uploads and static assets ✅ CONFIGURED
   - Bucket: vssyl-storage-472202
4. **Secret Manager**: Environment variable management ✅ CONFIGURED
   - All production secrets stored securely
5. **Cloud Build**: Automated CI/CD pipeline ✅ AUTOMATED
   - Triggered on git push to main
6. **Domain & SSL**: Custom domain with certificates ✅ CONFIGURED
   - Domain: vssyl.com
   - SSL: Automatic HTTPS

### **Active Supporting Services:**
1. **Cloud Monitoring**: Application monitoring ✅ ACTIVE
2. **Cloud Logging**: Centralized logging ✅ ACTIVE
3. **Container Registry**: Docker image storage ✅ ACTIVE
4. **IAM & Admin**: Access control and permissions ✅ CONFIGURED

### **Future Services (Planned):**
1. **Cloud CDN**: Static asset delivery (optional optimization)
2. **Cloud Redis**: Caching and session storage (optional optimization)
3. **Cloud Tasks**: Background job processing (when needed)

## 5. Deployment Status - ✅ COMPLETED

### **Infrastructure Setup:** ✅ COMPLETE
- [x] Set up Google Cloud project (vssyl-472202)
- [x] Configure Cloud SQL instance (production database)
- [x] Set up Cloud Storage buckets (vssyl-storage-472202)
- [x] Configure domain and SSL certificates (vssyl.com)
- [x] Set up Secret Manager for sensitive values
- [x] Configure production environment variables
- [x] Configure Cloud Build for automated deployments
- [x] Set up monitoring and logging

### **Database Setup:** ✅ COMPLETE
- [x] Run Prisma migrations on production database
- [x] Configure connection pooling (limit=20, timeout=20)
- [x] Set up automated backups
- [x] Verify database connectivity from Cloud Run

### **Application Deployment:** ✅ COMPLETE
- [x] Build optimized production Docker images
- [x] Configure Cloud Run services (vssyl-web, vssyl-server)
- [x] Set up domain mapping (vssyl.com → vssyl-web)
- [x] Configure all environment variables
- [x] Set up WebSocket support for real-time features
- [x] Configure file upload handling for Cloud Storage
- [x] Enable automated deployments via Cloud Build

### **Verification & Testing:** ✅ COMPLETE
- [x] Verify authentication flows (NextAuth.js working)
- [x] Test file uploads and storage (GCS integration working)
- [x] Test WebSocket connections (chat and notifications working)
- [x] Monitor performance and errors (Cloud Monitoring active)
- [x] Verify all API endpoints (production URLs configured)
- [x] Test database connections (connection pooling working)

## 6. Testing Strategy

### **Notification System Testing:**
1. **Email Notifications**: Test with real SMTP credentials
2. **Push Notifications**: Test with real VAPID keys
3. **In-App Notifications**: Test real-time delivery
4. **User Preferences**: Test notification settings
5. **Module Integration**: Test notifications from all modules

### **Performance Testing:**
1. **Database Performance**: Test with larger datasets
2. **Real-time Performance**: Test WebSocket connections
3. **File Upload Performance**: Test with Cloud Storage
4. **API Response Times**: Monitor endpoint performance
5. **CDN Performance**: Test static asset delivery
6. **Caching Performance**: Test Redis caching (if implemented)

## 7. Security Considerations

### **Environment Variables:**
- Use Google Cloud Secret Manager for sensitive values
- Never commit production credentials to version control
- Rotate secrets regularly

### **Database Security:**
- Use Cloud SQL with private IP
- Configure proper firewall rules
- Enable SSL connections

### **Application Security:**
- Enable HTTPS everywhere
- Configure CORS properly
- Set up rate limiting
- Validate all inputs
- Configure Cloud Storage bucket permissions
- Set up WebSocket authentication
- Implement file upload security

## 8. Monitoring & Maintenance

### **Application Monitoring:**
- Set up Cloud Monitoring for application metrics
- Configure error tracking and alerting
- Monitor notification delivery success rates
- Track user engagement with notifications

### **Database Monitoring:**
- Monitor database performance
- Set up automated backups
- Configure connection pool monitoring
- Track query performance

### **Infrastructure Monitoring:**
- Monitor Cloud Run performance
- Track Cloud Storage usage
- Monitor network traffic
- Set up cost alerts
- Monitor WebSocket connections
- Track CDN performance
- Monitor SSL certificate expiration

## 9. Cost Optimization

### **Google Cloud Services:**
- Use Cloud Run for serverless scaling
- Optimize Cloud SQL instance size
- Use Cloud Storage for cost-effective file storage
- Monitor and optimize costs regularly

### **Application Optimization:**
- Implement proper caching strategies
- Optimize database queries
- Use CDN for static assets
- Implement efficient notification delivery
- Optimize file upload handling
- Configure WebSocket connection pooling
- Implement database connection pooling

## 10. Rollback Strategy

### **Database Rollback:**
- Keep database backups before major changes
- Document migration steps
- Test rollback procedures

### **Application Rollback:**
- Use Cloud Run revisions for easy rollback
- Keep previous versions available
- Test rollback procedures

## 11. Docker & Build Configuration

### **Dockerfile Setup:**
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS builder
COPY . .
RUN npm run build

# Production stage
FROM base AS production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
EXPOSE 5000
CMD ["npm", "start"]
```

### **Cloud Build Configuration:**
```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/block-on-block', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/block-on-block']
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'block-on-block'
      - '--image'
      - 'gcr.io/$PROJECT_ID/block-on-block'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
```

### **Environment-Specific Builds:**
- **Development**: Local builds with hot reload
- **Staging**: Cloud Build with staging environment
- **Production**: Cloud Build with production environment
- **Database Migrations**: Automated migration scripts

## 12. Database Migration Strategy

### **Prisma Migration Process:**
```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
npx prisma generate
```

### **Data Seeding:**
- Initial user accounts
- System modules and configurations
- Sample data for testing
- Audit logs and compliance data

### **Backup Strategy:**
- Automated daily backups
- Point-in-time recovery
- Cross-region backup replication
- Backup retention policies

## 13. SSL/TLS Configuration

### **Custom Domain Setup:**
- Domain verification in Google Cloud
- SSL certificate provisioning
- DNS configuration
- HTTPS enforcement

### **Certificate Management:**
- Automatic SSL certificate renewal
- Certificate monitoring and alerts
- Multi-domain certificate support
- Certificate transparency logging

## 14. Documentation Updates Needed

### **After Migration:**
- Update deployment documentation
- Document production environment setup
- Create monitoring and maintenance guides
- Update troubleshooting procedures
- Document SSL certificate management
- Create backup and restore procedures

## 15. Production Operations

### **Monitoring & Maintenance:**
1. **Cloud Monitoring**: Dashboard configured for service metrics
2. **Cloud Logging**: Centralized log aggregation active
3. **Error Tracking**: Cloud Error Reporting configured
4. **Performance Monitoring**: Real-time metrics tracked
5. **Cost Monitoring**: Budget alerts configured

### **Operational Procedures:**
1. **Deployment**: Git push to main triggers automated Cloud Build
2. **Rollback**: Use Cloud Run revisions for quick rollbacks
3. **Database**: Automated daily backups configured
4. **Secrets**: Update via Cloud Secret Manager
5. **Scaling**: Auto-scaling configured (min:0, max:10)

### **Common Operations:**

**View Logs:**
```bash
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

**Manual Deployment:**
```bash
gcloud builds submit --config=cloudbuild.yaml
```

**Check Service Status:**
```bash
gcloud run services list --region=us-central1
gcloud run services describe vssyl-web --region=us-central1
gcloud run services describe vssyl-server --region=us-central1
```

**Update Secrets:**
```bash
# See UPDATE_SECRETS_GUIDE.md for detailed instructions
gcloud secrets versions add JWT_SECRET --data-file=-
```

### **Performance Optimization:**
1. **Build Time**: ~7-10 minutes (E2_HIGHCPU_8 machine type)
2. **Cold Start**: <2 seconds (optimized Docker images)
3. **Database**: Connection pooling configured (20 connections)
4. **Storage**: GCS with public access for user files

---

**Last Updated:** 2025-10-25
**Status:** ✅ **PRODUCTION - FULLY OPERATIONAL**
**Infrastructure:** Google Cloud Platform (Cloud Run, Cloud SQL, Cloud Storage)
**Automation:** Fully automated CI/CD via Cloud Build 