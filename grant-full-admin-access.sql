-- ============================================================================
-- GRANT FULL ADMIN ACCESS
-- ============================================================================
-- Email: Andrew.Trautman@Vssyl.com
-- Purpose: Grant ADMIN role + Enterprise tier (complimentary, no payment)
-- Run this in Google Cloud SQL Console or via gcloud sql connect
-- ============================================================================

-- Step 1: Check if user exists
SELECT 
  id, 
  email, 
  name, 
  role, 
  "emailVerified",
  "createdAt"
FROM "User" 
WHERE email = 'Andrew.Trautman@Vssyl.com';

-- ============================================================================
-- If user DOES NOT exist, you'll need to create one with a hashed password
-- This cannot be done in plain SQL - you need the bcrypt hash
-- Use the setup script or create via registration form
-- ============================================================================

-- Step 2: Promote user to ADMIN (if user exists)
UPDATE "User" 
SET 
  role = 'ADMIN',
  "emailVerified" = COALESCE("emailVerified", NOW())
WHERE email = 'Andrew.Trautman@Vssyl.com';

-- Verify role updated:
SELECT email, name, role, "emailVerified"
FROM "User" 
WHERE email = 'Andrew.Trautman@Vssyl.com';

-- ============================================================================
-- Step 3: Check current subscription status
-- ============================================================================
SELECT 
  s.id,
  s.tier,
  s.status,
  s."currentPeriodStart",
  s."currentPeriodEnd",
  s."stripeSubscriptionId"
FROM "Subscription" s
JOIN "User" u ON s."userId" = u.id
WHERE u.email = 'Andrew.Trautman@Vssyl.com'
  AND s.status = 'active';

-- ============================================================================
-- Step 4a: If NO active subscription exists, create enterprise tier
-- ============================================================================
INSERT INTO "Subscription" (
  id, 
  "userId", 
  tier, 
  status,
  "stripeSubscriptionId", 
  "stripePriceId",
  "currentPeriodStart", 
  "currentPeriodEnd",
  "createdAt", 
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  u.id,
  'enterprise',
  'active',
  'admin_grant_' || EXTRACT(EPOCH FROM NOW())::TEXT,
  'enterprise_complimentary',
  NOW(),
  NOW() + INTERVAL '1 year',
  NOW(),
  NOW()
FROM "User" u
WHERE u.email = 'Andrew.Trautman@Vssyl.com'
  AND NOT EXISTS (
    SELECT 1 FROM "Subscription" 
    WHERE "userId" = u.id AND status = 'active'
  );

-- ============================================================================
-- Step 4b: If subscription exists but NOT enterprise, upgrade it
-- ============================================================================
UPDATE "Subscription" s
SET 
  tier = 'enterprise',
  "stripePriceId" = 'enterprise_complimentary',
  "currentPeriodEnd" = GREATEST(s."currentPeriodEnd", NOW() + INTERVAL '1 year'),
  "updatedAt" = NOW()
FROM "User" u
WHERE s."userId" = u.id
  AND u.email = 'Andrew.Trautman@Vssyl.com'
  AND s.status = 'active'
  AND s.tier != 'enterprise';

-- ============================================================================
-- Step 5: Verify final setup
-- ============================================================================
SELECT 
  u.id as "User ID",
  u.email as "Email",
  u.name as "Name",
  u.role as "Admin Role",
  u."emailVerified" as "Email Verified",
  s.tier as "Subscription Tier",
  s.status as "Subscription Status",
  s."currentPeriodStart" as "Valid From",
  s."currentPeriodEnd" as "Valid Until",
  s."stripeSubscriptionId" as "Stripe ID (Complimentary)",
  CASE 
    WHEN u.role = 'ADMIN' AND s.tier = 'enterprise' AND s.status = 'active' 
    THEN '✅ FULL ACCESS GRANTED'
    ELSE '❌ ACCESS INCOMPLETE'
  END as "Access Status"
FROM "User" u
LEFT JOIN "Subscription" s ON u.id = s."userId" AND s.status = 'active'
WHERE u.email = 'Andrew.Trautman@Vssyl.com';

-- ============================================================================
-- Step 6: List all admin users (for verification)
-- ============================================================================
SELECT 
  email,
  name,
  role,
  "emailVerified",
  "createdAt"
FROM "User"
WHERE role = 'ADMIN'
ORDER BY "createdAt" DESC;

-- ============================================================================
-- Step 7: List all enterprise subscriptions (for verification)
-- ============================================================================
SELECT 
  u.email,
  u.name,
  s.tier,
  s.status,
  s."currentPeriodEnd" as "Valid Until"
FROM "Subscription" s
JOIN "User" u ON s."userId" = u.id
WHERE s.tier = 'enterprise'
  AND s.status = 'active'
ORDER BY s."createdAt" DESC;

-- ============================================================================
-- EXPECTED RESULTS AFTER RUNNING THIS SCRIPT
-- ============================================================================
-- User: Andrew.Trautman@Vssyl.com
-- Role: ADMIN
-- Subscription: enterprise (active)
-- Access: Full admin portal + All enterprise features
-- Payment: None required (complimentary)
-- Valid: 1 year from grant date (renewable)
-- ============================================================================

