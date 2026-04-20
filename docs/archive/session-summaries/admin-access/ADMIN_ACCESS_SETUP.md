# Admin Access Setup for Andrew.Trautman@Vssyl.com

## Current Access Requirements

You need **Andrew.Trautman@Vssyl.com** to have:
- ✅ **ADMIN role** - For admin portal and system management
- ✅ **Enterprise tier subscription** - For all premium features (free/complimentary)
- ✅ **Full access** - To all systems including admin portal and enterprise features

## Access Components

### 1. ADMIN Role (Database: User.role = 'ADMIN')
**Grants access to:**
- Admin Portal (`https://vssyl.com/admin-portal`)
- User management endpoints
- Security and compliance tools
- System configuration
- AI learning management
- Audit logs and monitoring

### 2. Enterprise Tier Subscription (Database: Subscription.tier = 'enterprise')
**Grants access to:**
- Advanced Analytics & Business Intelligence
- Custom Integrations & API Access
- Advanced File Sharing & DLP
- Compliance & Legal Hold
- Resource Booking & Workflows
- Custom Widgets & Dashboards
- SSO Integration
- Priority Support
- All features across all modules

## How to Verify/Grant Access

### Option 1: Using Google Cloud Console (Recommended)

Since you're running on Google Cloud, you can use Cloud Shell to run the setup script:

```bash
# 1. Open Google Cloud Console
# 2. Open Cloud Shell
# 3. Connect to Cloud SQL:
gcloud sql connect vssyl-db --user=vssyl_user --database=vssyl_production

# 4. Run these SQL commands:

-- Check if user exists and their current role
SELECT id, email, name, role, "emailVerified", "createdAt" 
FROM "User" 
WHERE email = 'Andrew.Trautman@Vssyl.com';

-- If user doesn't exist, create them (you'll need to hash the password separately)
-- If user exists but isn't ADMIN, promote them:
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'Andrew.Trautman@Vssyl.com';

-- Check current subscription
SELECT id, "userId", tier, status, "currentPeriodStart", "currentPeriodEnd"
FROM "Subscription"
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'Andrew.Trautman@Vssyl.com')
AND status = 'active';

-- If no subscription exists, create enterprise tier:
INSERT INTO "Subscription" (
  id, "userId", tier, status, 
  "stripeSubscriptionId", "stripePriceId",
  "currentPeriodStart", "currentPeriodEnd",
  "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM "User" WHERE email = 'Andrew.Trautman@Vssyl.com'),
  'enterprise',
  'active',
  'admin_grant_complimentary',
  'enterprise_complimentary',
  NOW(),
  NOW() + INTERVAL '1 year',
  NOW(),
  NOW()
);

-- If subscription exists but isn't enterprise, upgrade it:
UPDATE "Subscription"
SET tier = 'enterprise'
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'Andrew.Trautman@Vssyl.com')
AND status = 'active';

-- Verify final setup:
SELECT 
  u.email,
  u.name,
  u.role as "User Role",
  s.tier as "Subscription Tier",
  s.status as "Subscription Status",
  s."currentPeriodEnd" as "Valid Until"
FROM "User" u
LEFT JOIN "Subscription" s ON u.id = s."userId" AND s.status = 'active'
WHERE u.email = 'Andrew.Trautman@Vssyl.com';
```

### Option 2: Using Cloud Run Job

Deploy and run the setup script as a Cloud Run job:

```bash
# From your local machine with gcloud configured:
cd /Users/andrewtrautman/Desktop/Vssyl

# Deploy the script as a one-time job
gcloud run jobs create setup-admin-access \
  --source=./server \
  --command="node" \
  --args="setup-admin-production.js,Andrew.Trautman@Vssyl.com" \
  --region=us-central1 \
  --set-env-vars="DATABASE_URL=postgresql://vssyl_user:ThJhZWJiKPFa1AWPUNgxI61v1/zo810j348ncouT3w0=@/vssyl_production?host=/cloudsql/vssyl-472202:us-central1:vssyl-db" \
  --set-cloudsql-instances=vssyl-472202:us-central1:vssyl-db

# Execute the job
gcloud run jobs execute setup-admin-access --region=us-central1
```

### Option 3: Using Admin Portal (If you already have access)

If you can already log in to the system with any account that has ADMIN role:

1. Go to `https://vssyl.com/admin-portal`
2. Navigate to **User Management**
3. Search for `Andrew.Trautman@Vssyl.com`
4. Edit user and set:
   - Role: `ADMIN`
   - Subscription Tier: `enterprise`

### Option 4: Quick Verification from Local Machine

If you have Google Cloud SQL Proxy installed:

```bash
# Terminal 1: Start Cloud SQL Proxy
cloud-sql-proxy vssyl-472202:us-central1:vssyl-db --port=5433

# Terminal 2: Run the setup script with local DATABASE_URL
cd /Users/andrewtrautman/Desktop/Vssyl/server
DATABASE_URL="postgresql://vssyl_user:ThJhZWJiKPFa1AWPUNgxI61v1/zo810j348ncouT3w0=@localhost:5433/vssyl_production" node setup-admin-production.js Andrew.Trautman@Vssyl.com
```

## What Access You Get

Once setup is complete, `Andrew.Trautman@Vssyl.com` will have:

### ✅ Admin Portal Features
- **URL**: https://vssyl.com/admin-portal
- **User Management**: View, edit, delete, impersonate users
- **Security Dashboard**: Monitor security events and threats
- **Compliance Monitoring**: GDPR, HIPAA, SOC2, PCI DSS status
- **Support Tickets**: Manage customer support requests
- **AI Learning Management**: Configure and monitor AI systems
- **Analytics**: Platform-wide analytics and insights

### ✅ Enterprise Features (All Modules)
- **Drive**: Advanced file sharing, DLP, audit logs, classification
- **Chat**: Message retention, compliance mode, advanced moderation
- **Calendar**: Resource booking, approval workflows, advanced scheduling
- **Dashboard**: Custom widgets, advanced business intelligence
- **Analytics**: Real-time analytics, predictive intelligence, AI insights
- **Business**: Full business workspace management
- **All Modules**: Every feature in every module (no restrictions)

### ✅ System-Wide Permissions
- Create and manage businesses
- Configure system-wide settings
- Access all API endpoints
- Manage other users and admins
- View all audit logs and security events
- Configure AI and compliance settings

## Payment Information

**NO PAYMENT REQUIRED** for your admin account:
- The enterprise subscription is marked as `complimentary`
- No Stripe charges will be made
- Full access without any payment processing
- This is an administrative grant, not a customer subscription

## Testing Your Access

After setup, verify your access:

1. **Login**: Go to https://vssyl.com and login with `Andrew.Trautman@Vssyl.com`
2. **Admin Portal**: Visit https://vssyl.com/admin-portal (should show admin dashboard)
3. **Enterprise Features**: Create a business and check enterprise modules
4. **Feature Gating**: All features should be available without upgrade prompts

## Current System Architecture

```
User Table:
┌──────────┬────────────────────────────┬────────┐
│ Field    │ Value                      │ Status │
├──────────┼────────────────────────────┼────────┤
│ email    │ Andrew.Trautman@Vssyl.com  │ ✅     │
│ role     │ ADMIN                      │ ✅     │
│ verified │ true                       │ ✅     │
└──────────┴────────────────────────────┴────────┘

Subscription Table:
┌──────────┬────────────┬────────┬─────────────────────┐
│ Field    │ Value      │ Status │ Valid Until         │
├──────────┼────────────┼────────┼─────────────────────┤
│ tier     │ enterprise │ ✅     │ 1 year from grant   │
│ status   │ active     │ ✅     │ (renewable)         │
│ payment  │ N/A        │ ✅     │ Complimentary       │
└──────────┴────────────┴────────┴─────────────────────┘
```

## Permission Checking Logic

The system checks permissions in this order:

1. **User.role === 'ADMIN'** → Full admin portal access
2. **Subscription.tier === 'enterprise'** → All premium features
3. **Feature Gating Service** → Validates tier access for each feature
4. **Business Role** → Additional business-specific permissions

All checks will pass for your account once setup is complete.

## Troubleshooting

### Issue: "Admin access required" error
**Solution**: Ensure `User.role = 'ADMIN'` in database

### Issue: "Upgrade to Enterprise" prompts
**Solution**: Ensure active subscription with `tier = 'enterprise'`

### Issue: Can't access admin portal
**Solution**: Check both role and email verification:
```sql
SELECT role, "emailVerified" FROM "User" WHERE email = 'Andrew.Trautman@Vssyl.com';
```

### Issue: Features still locked
**Solution**: Check subscription status:
```sql
SELECT tier, status, "currentPeriodEnd" 
FROM "Subscription" 
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'Andrew.Trautman@Vssyl.com')
AND status = 'active';
```

## Security Notes

- The ADMIN role grants full system access - use responsibly
- Consider changing password after first login if account was newly created
- Monitor admin activity through audit logs
- Consider setting up MFA for additional security

## Support

If you encounter issues:
1. Check Cloud Run logs: `gcloud run services logs read vssyl-server --region=us-central1`
2. Check database directly via Cloud SQL Console
3. Review this document for SQL commands to run manually

