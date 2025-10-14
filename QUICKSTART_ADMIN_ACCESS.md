# 🚀 Quick Start: Grant Admin Access

## TL;DR - Run This Now

**Goal**: Give `Andrew.Trautman@Vssyl.com` full admin + enterprise access (free)

### Step 1: Open Google Cloud Console
1. Go to https://console.cloud.google.com
2. Select project: **vssyl-472202**
3. Go to **Cloud SQL** → **vssyl-db**

### Step 2: Open SQL Console
Click **"OPEN CLOUD SHELL SQL"** button

### Step 3: Copy & Paste These Commands

```sql
-- 1. Promote to ADMIN role
UPDATE "User" 
SET role = 'ADMIN', "emailVerified" = COALESCE("emailVerified", NOW())
WHERE email = 'Andrew.Trautman@Vssyl.com';

-- 2. Create/Upgrade to Enterprise subscription
INSERT INTO "Subscription" (
  id, "userId", tier, status, 
  "stripeSubscriptionId", "stripePriceId",
  "currentPeriodStart", "currentPeriodEnd", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(), u.id, 'enterprise', 'active',
  'admin_grant_' || EXTRACT(EPOCH FROM NOW())::TEXT, 'enterprise_complimentary',
  NOW(), NOW() + INTERVAL '1 year', NOW(), NOW()
FROM "User" u
WHERE u.email = 'Andrew.Trautman@Vssyl.com'
AND NOT EXISTS (SELECT 1 FROM "Subscription" WHERE "userId" = u.id AND status = 'active')
ON CONFLICT DO NOTHING;

-- 3. If subscription exists, upgrade to enterprise
UPDATE "Subscription" s
SET tier = 'enterprise', "stripePriceId" = 'enterprise_complimentary', "updatedAt" = NOW()
FROM "User" u
WHERE s."userId" = u.id AND u.email = 'Andrew.Trautman@Vssyl.com' 
AND s.status = 'active' AND s.tier != 'enterprise';

-- 4. Verify
SELECT u.email, u.role, s.tier, s.status, 
  CASE WHEN u.role = 'ADMIN' AND s.tier = 'enterprise' 
  THEN '✅ SUCCESS' ELSE '❌ CHECK' END as status
FROM "User" u
LEFT JOIN "Subscription" s ON u.id = s."userId" AND s.status = 'active'
WHERE u.email = 'Andrew.Trautman@Vssyl.com';
```

### Step 4: Verify Success
You should see:
```
email                          | role  | tier       | status | status
-------------------------------|-------|------------|--------|----------
Andrew.Trautman@Vssyl.com      | ADMIN | enterprise | active | ✅ SUCCESS
```

### Step 5: Test Access
1. Go to: **https://vssyl.com/admin-portal**
2. Login with: `Andrew.Trautman@Vssyl.com`
3. You should see full admin dashboard

## What You Get

✅ **Admin Portal** - Full system management  
✅ **Enterprise Tier** - All premium features (free)  
✅ **No Payment** - Complimentary subscription  
✅ **All Modules** - Complete access to everything  

## If User Doesn't Exist

If the user account doesn't exist yet, you need to:
1. Register at https://vssyl.com/auth/register
2. Then run the SQL commands above
3. Or use the password reset flow to set a password

## Files Reference

- **This File**: Quick commands to run now
- **`ADMIN_ACCESS_SUMMARY.md`**: Overview and verification steps
- **`ADMIN_ACCESS_SETUP.md`**: Complete documentation with all methods
- **`grant-full-admin-access.sql`**: Full SQL script with explanations

---

**That's it!** Run those SQL commands and you're done. 🎉

