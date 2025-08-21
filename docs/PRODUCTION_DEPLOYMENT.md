# Production Deployment Guide

## Centralized AI Learning System

This guide covers the production deployment of the centralized AI learning system, including performance optimization, security hardening, and compliance requirements.

## 🚀 Pre-Deployment Checklist

### System Requirements
- **Node.js**: v18+ (LTS recommended)
- **PostgreSQL**: v14+ with at least 8GB RAM
- **Redis**: v6+ for caching (optional but recommended)
- **Memory**: Minimum 4GB RAM, 8GB+ recommended
- **Storage**: SSD with at least 100GB free space
- **CPU**: 4+ cores recommended

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/blockondrive"

# Security
ENCRYPTION_KEY="your-32-character-encryption-key"
JWT_SECRET="your-jwt-secret-key"
SESSION_SECRET="your-session-secret"

# API Keys (if using external AI services)
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"

# Monitoring
LOG_LEVEL="info"
NODE_ENV="production"
```

## 🔧 Performance Optimization

### Database Optimization
```sql
-- Create indexes for performance
CREATE INDEX idx_global_learning_events_timestamp ON global_learning_events(timestamp);
CREATE INDEX idx_global_learning_events_user_id ON global_learning_events(user_id);
CREATE INDEX idx_global_patterns_pattern_type ON global_patterns(pattern_type);
CREATE INDEX idx_collective_insights_type ON collective_insights(type);

-- Analyze table statistics
ANALYZE global_learning_events;
ANALYZE global_patterns;
ANALYZE collective_insights;
```

### Application Performance
```typescript
// Enable connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pooling for production
  connectionLimit: 20,
  acquireTimeout: 60000,
  timeout: 60000,
});

// Enable query caching
const queryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

### Caching Strategy
```typescript
// Redis caching for frequently accessed data
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

// Cache global patterns
async function getCachedGlobalPatterns(): Promise<GlobalPattern[]> {
  const cached = await redis.get('global_patterns');
  if (cached) {
    return JSON.parse(cached);
  }
  
  const patterns = await prisma.globalPattern.findMany();
  await redis.setex('global_patterns', 300, JSON.stringify(patterns)); // 5 minutes
  
  return patterns;
}
```

## 🛡️ Security Hardening

### Authentication & Authorization
```typescript
// Rate limiting middleware
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);

// JWT token validation
const validateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Data Encryption
```typescript
// Encrypt sensitive data before storage
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex')
  };
}

function decrypt(encrypted: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipher(algorithm, key);
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Input Validation & Sanitization
```typescript
import { body, validationResult } from 'express-validator';

const validateLearningEvent = [
  body('userId').isUUID().notEmpty(),
  body('eventType').isIn(['interaction', 'feedback', 'correction', 'pattern_discovery']),
  body('context.module').isString().notEmpty(),
  body('data').isObject(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

## 📊 Monitoring & Alerting

### Performance Monitoring
```typescript
// Performance metrics collection
import { PerformanceMonitor } from './PerformanceMonitor';

const performanceMonitor = new PerformanceMonitor(prisma);

// Middleware to collect performance data
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    performanceMonitor.recordMetrics({
      responseTime,
      throughput: 1, // Will be calculated per second
      errorRate: res.statusCode >= 400 ? 1 : 0,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      cpuUsage: process.cpuUsage().user / 1000000, // Percentage
      databaseQueries: 0, // Will be tracked by Prisma middleware
      cacheHitRate: 0, // Will be calculated from cache stats
      activeConnections: 0, // Will be tracked by connection pool
      queueLength: 0 // Will be tracked by request queue
    });
  });
  
  next();
});
```

### Health Checks
```typescript
// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Database health
    await prisma.$queryRaw`SELECT 1`;
    
    // Redis health (if using)
    if (redis) {
      await redis.ping();
    }
    
    // System health
    const health = performanceMonitor.getSystemHealth();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      redis: redis ? 'connected' : 'not_configured',
      system: health.overall,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
```

### Logging
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'centralized-ai-learning' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Structured logging
logger.info('User consent updated', {
  userId: 'user123',
  consentType: 'collective_learning',
  granted: true,
  timestamp: new Date()
});
```

## 🔒 Compliance & Privacy

### GDPR Compliance
```typescript
// Data retention policy
const DATA_RETENTION_DAYS = 90;

async function cleanupExpiredData(): Promise<void> {
  const cutoffDate = new Date(Date.now() - DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  
  // Delete expired learning events
  await prisma.globalLearningEvent.deleteMany({
    where: {
      timestamp: {
        lt: cutoffDate
      }
    }
  });
  
  // Delete expired patterns
  await prisma.globalPattern.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate
      }
    }
  });
  
  logger.info('Data cleanup completed', { cutoffDate });
}

// Schedule daily cleanup
setInterval(cleanupExpiredData, 24 * 60 * 60 * 1000);
```

### User Consent Management
```typescript
// Consent verification middleware
const verifyConsent = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  const consent = await prisma.userPrivacySettings.findUnique({
    where: { userId }
  });
  
  if (!consent?.allowCollectiveLearning) {
    return res.status(403).json({ error: 'Consent required for collective learning' });
  }
  
  next();
};

// Apply to learning endpoints
app.use('/api/centralized-ai/learning', verifyConsent);
```

## 🚀 Deployment Process

### 1. Database Migration
```bash
# Generate migration
npx prisma migrate dev --name production_setup

# Apply migration to production
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env.production

# Edit production environment
nano .env.production

# Validate environment
npm run validate:env
```

### 3. Build & Deploy
```bash
# Install dependencies
npm ci --only=production

# Build application
npm run build

# Start production server
npm run start:prod
```

### 4. Process Management
```bash
# Using PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit

# View logs
pm2 logs centralized-ai-learning
```

## 📈 Scaling Considerations

### Horizontal Scaling
```typescript
// Load balancer configuration
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Replace dead worker
  });
} else {
  // Worker process
  require('./server');
}
```

### Database Scaling
```sql
-- Read replicas for analytics queries
-- Primary database for writes
-- Replica databases for reads

-- Connection string for read replica
DATABASE_URL_REPLICA="postgresql://user:password@replica-host:5432/blockondrive"
```

### Caching Strategy
```typescript
// Multi-level caching
const cacheStrategy = {
  L1: 'memory', // Fastest, limited size
  L2: 'redis',  // Fast, larger size
  L3: 'database' // Slowest, unlimited size
};

async function getDataWithCache(key: string): Promise<any> {
  // Try L1 cache first
  let data = memoryCache.get(key);
  if (data) return data;
  
  // Try L2 cache
  data = await redis.get(key);
  if (data) {
    memoryCache.set(key, data, 60); // Cache in memory for 1 minute
    return data;
  }
  
  // Get from database
  data = await getDataFromDatabase(key);
  
  // Cache in both levels
  await redis.setex(key, 300, JSON.stringify(data)); // 5 minutes in Redis
  memoryCache.set(key, data, 60); // 1 minute in memory
  
  return data;
}
```

## 🧪 Testing & Validation

### Load Testing
```bash
# Using Artillery for load testing
npm install -g artillery

# Run load test
artillery run load-test.yml
```

### Security Testing
```bash
# Run security audit
npm audit

# Run OWASP ZAP security scan
zap-baseline.py -t http://localhost:5000
```

### Compliance Testing
```bash
# Run GDPR compliance checks
npm run test:compliance

# Run privacy impact assessment
npm run test:privacy
```

## 📋 Maintenance & Updates

### Regular Maintenance Tasks
- **Daily**: Monitor system health and performance metrics
- **Weekly**: Review security audit logs and compliance status
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Perform comprehensive security audit and penetration testing

### Backup Strategy
```bash
# Database backup
pg_dump blockondrive > backup_$(date +%Y%m%d_%H%M%S).sql

# Application backup
tar -czf app_backup_$(date +%Y%m%d_%H%M%S).tar.gz ./dist ./node_modules

# Automated backup script
0 2 * * * /usr/local/bin/backup-script.sh
```

### Monitoring Dashboard
```typescript
// Grafana dashboard configuration
const dashboardConfig = {
  panels: [
    {
      title: 'System Performance',
      metrics: ['response_time', 'throughput', 'error_rate']
    },
    {
      title: 'Security Events',
      metrics: ['failed_logins', 'permission_denials', 'suspicious_activities']
    },
    {
      title: 'Compliance Status',
      metrics: ['gdpr_compliance', 'user_consent_rate', 'data_retention']
    }
  ]
};
```

## 🚨 Incident Response

### Security Incident Response Plan
1. **Detection**: Automated monitoring and alerting
2. **Assessment**: Evaluate impact and scope
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove threat and vulnerabilities
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Document and improve processes

### Emergency Contacts
- **Security Team**: security@company.com
- **DevOps Team**: devops@company.com
- **Legal Team**: legal@company.com
- **24/7 Support**: +1-800-SUPPORT

## 📚 Additional Resources

- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance.html)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [GDPR Compliance Guide](https://gdpr.eu/)

## 🔄 Version History

- **v1.0.0**: Initial production deployment
- **v1.1.0**: Added performance monitoring
- **v1.2.0**: Enhanced security features
- **v1.3.0**: GDPR compliance implementation

---

**Last Updated**: August 15, 2025  
**Next Review**: September 15, 2025  
**Maintained By**: DevOps Team
