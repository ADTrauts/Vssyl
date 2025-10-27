# Logging System Database Migration

## Overview
This migration adds a real-time database logging system to replace the mock in-memory logs. All system logs will now be stored in PostgreSQL for long-term analysis and monitoring.

## New Tables
- `logs` - Stores all application logs
- `log_alerts` - Configurable log alert rules
- `log_retention_policies` - Log retention and cleanup settings

## Migration Steps

### Option 1: Automatic Migration (Recommended for Development)
```bash
# From project root
npx prisma migrate deploy
```

### Option 2: Manual Migration (Production)
If you need to run the migration manually in production:

```bash
# Connect to your production database
psql $DATABASE_URL

# Run the migration SQL (generated when you deploy)
```

### Option 3: Cloud Run Deployment
The migration will automatically run during deployment if you have:
```bash
# In your cloudbuild.yaml or deployment script
- npx prisma migrate deploy
```

## What Changes

### Before (Mock Data):
- Logs stored in memory
- Lost on server restart
- 5 hardcoded mock entries
- No persistence

### After (Real Data):
- Logs stored in PostgreSQL
- Persistent across restarts
- Real-time data from application
- Comprehensive analytics and querying

## Features

1. **Real-time Logging**: All server logs automatically saved to database
2. **Client Logging**: Frontend can send logs via `/api/admin/logs/client`
3. **Advanced Filtering**: Filter by level, service, operation, user, business, date range, search
4. **Analytics**: Real-time analytics on log patterns, errors, performance
5. **Alerts**: Configurable alerts based on log conditions
6. **Retention**: Automatic log cleanup based on retention policies
7. **Performance**: Indexed for fast querying on common filters

## Verification

After migration, verify the tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('logs', 'log_alerts', 'log_retention_policies');
```

Expected output:
```
 table_name
-------------------------
 logs
 log_alerts
 log_retention_policies
```

## Rollback

If needed, you can rollback by running:
```bash
npx prisma migrate resolve --rolled-back add_logging_system
```

Then manually drop the tables:
```sql
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS log_alerts CASCADE;
DROP TABLE IF EXISTS log_retention_policies CASCADE;
```

## Performance Considerations

The `logs` table includes multiple indexes for performance:
- `level + timestamp`
- `service + timestamp`
- `operation + timestamp`
- `userId + timestamp`
- `businessId + timestamp`
- `module + timestamp`
- `timestamp` (standalone)

These indexes ensure fast queries even with millions of log entries.

## Monitoring

After deployment, monitor:
1. Database size growth (logs table)
2. Query performance on logs endpoints
3. Log retention policy effectiveness
4. Alert triggering accuracy

## Support

If you encounter issues:
1. Check Prisma schema is built: `npm run prisma:build`
2. Verify Prisma client is generated: `npx prisma generate`
3. Check database connection: `npx prisma db pull`
4. Review migration status: `npx prisma migrate status`

