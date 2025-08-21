# Production Deployment Guide

## **Overview**
This guide covers the production deployment of the Block-on-Block Org Chart & Permission System.

## **Prerequisites**
- Node.js 20.x or higher
- PostgreSQL 14+ database
- Redis (optional, for caching)
- Domain name with SSL certificate
- Production server (VPS, cloud instance, etc.)

## **Environment Configuration**

### **1. Create Production Environment File**
```bash
# Copy the example file
cp .env.production.example .env.production

# Edit with your production values
nano .env.production
```

### **2. Required Environment Variables**
```bash
# Core Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com

# Database
DATABASE_URL="postgresql://username:password@host:port/database_name?schema=public"
DIRECT_URL="postgresql://username:password@host:port/database_name?schema=public"

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here
NEXTAUTH_SECRET=your-nextauth-secret-key-here
NEXTAUTH_URL=https://your-domain.com

# Email (Required for user verification)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
EMAIL_FROM=noreply@your-domain.com
```

## **Database Setup**

### **1. Production Database Migration**
```bash
# Generate Prisma client
pnpm prisma:generate

# Run production migrations
pnpm prisma:migrate

# Verify database connection
pnpm prisma:studio
```

### **2. Database Optimization**
```sql
-- Create production indexes
CREATE INDEX CONCURRENTLY idx_user_email ON users(email);
CREATE INDEX CONCURRENTLY idx_business_ein ON businesses(ein);
CREATE INDEX CONCURRENTLY idx_employee_position_active ON employee_positions(active);
CREATE INDEX CONCURRENTLY idx_permission_module_feature ON permissions(module_id, feature_id);
```

## **Build & Deployment**

### **1. Build All Applications**
```bash
# Install dependencies
pnpm install

# Build shared components
pnpm build:shared

# Build server
pnpm --filter server build

# Build web application
pnpm --filter web build
```

### **2. Production Start Scripts**
```bash
# Start server
cd server
NODE_ENV=production node dist/index.js

# Start web application
cd web
NODE_ENV=production node server.js
```

## **Server Configuration**

### **1. PM2 Process Manager (Recommended)**
```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'block-on-block-server',
      script: './server/dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_file: './logs/server-combined.log',
      time: true
    },
    {
      name: 'block-on-block-web',
      script: './web/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_file: './logs/web-combined.log',
      time: true
    }
  ]
};
EOF

# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

### **2. Nginx Reverse Proxy**
```nginx
# /etc/nginx/sites-available/block-on-block
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API Routes
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket Support
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static Files
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File Uploads
    location /uploads/ {
        alias /path/to/your/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## **SSL Certificate (Let's Encrypt)**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## **Monitoring & Logging**

### **1. Application Logs**
```bash
# Create logs directory
mkdir -p logs

# View logs
pm2 logs
pm2 logs block-on-block-server
pm2 logs block-on-block-web

# Monitor processes
pm2 monit
```

### **2. System Monitoring**
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor system resources
htop
iotop
nethogs
```

## **Backup & Recovery**

### **1. Database Backup**
```bash
# Create backup script
cat > backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="your_database_name"

mkdir -p $BACKUP_DIR
pg_dump $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

# Make executable and add to cron
chmod +x backup-db.sh
sudo crontab -e
# Add: 0 2 * * * /path/to/backup-db.sh
```

### **2. File Backup**
```bash
# Backup uploads directory
rsync -av /path/to/uploads/ /backups/uploads/
```

## **Performance Optimization**

### **1. Database Optimization**
```sql
-- Analyze tables for better query planning
ANALYZE;

-- Vacuum tables
VACUUM ANALYZE;

-- Check for slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### **2. Application Optimization**
```bash
# Enable gzip compression in Nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# Enable caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## **Security Checklist**

- [ ] SSL/TLS certificate installed
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Firewall configured
- [ ] Regular security updates
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting setup
- [ ] Rate limiting configured
- [ ] Input validation enabled
- [ ] SQL injection protection

## **Deployment Commands**

### **Quick Deployment**
```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
pnpm install

# 3. Build applications
pnpm build

# 4. Run database migrations
pnpm prisma:migrate

# 5. Restart applications
pm2 restart all

# 6. Check status
pm2 status
```

### **Rollback Procedure**
```bash
# 1. Check PM2 logs for issues
pm2 logs

# 2. Rollback to previous version
git checkout HEAD~1

# 3. Rebuild and restart
pnpm build
pm2 restart all
```

## **Troubleshooting**

### **Common Issues**
1. **Port conflicts**: Check if ports 3000/5000 are available
2. **Database connection**: Verify DATABASE_URL in environment
3. **Permission errors**: Check file permissions and ownership
4. **Memory issues**: Monitor with `pm2 monit` and adjust instances

### **Support Commands**
```bash
# Check application status
pm2 status
pm2 logs

# Check system resources
htop
df -h
free -h

# Check network
netstat -tulpn | grep :5000
netstat -tulpn | grep :3000
```

## **Next Steps**
After successful deployment:
1. **User Documentation** - Create comprehensive user guides
2. **Performance Testing** - Load test the system
3. **Monitoring Setup** - Implement alerting and dashboards
4. **Backup Verification** - Test backup and recovery procedures
