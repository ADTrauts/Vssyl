-- ============================================================================
-- STEP 1: Find the correct table names
-- Run this first to see what tables exist
-- ============================================================================
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- ============================================================================
-- STEP 2: Check if user exists
-- Try each version until one works:
-- ============================================================================

-- Version A: Try with capital U and quotes (Prisma default)
SELECT id, email, name, role FROM "User" WHERE email = 'Andrew.Trautman@Vssyl.com';

-- Version B: Try without quotes
-- SELECT id, email, name, role FROM User WHERE email = 'Andrew.Trautman@Vssyl.com';

-- Version C: Try lowercase
-- SELECT id, email, name, role FROM users WHERE email = 'Andrew.Trautman@Vssyl.com';

-- ============================================================================
-- STEP 3: Grant ADMIN role
-- Once you find the right table name above, uncomment the matching version:
-- ============================================================================

-- Version A: Capital U with quotes (most likely for Prisma)
UPDATE "User" 
SET role = 'ADMIN', "emailVerified" = COALESCE("emailVerified", NOW())
WHERE email = 'Andrew.Trautman@Vssyl.com';

-- Version B: No quotes (uncomment if this is what works)
-- UPDATE User 
-- SET role = 'ADMIN', emailVerified = COALESCE(emailVerified, NOW())
-- WHERE email = 'Andrew.Trautman@Vssyl.com';

-- Version C: Lowercase (uncomment if this is what works)
-- UPDATE users 
-- SET role = 'ADMIN', email_verified = COALESCE(email_verified, NOW())
-- WHERE email = 'Andrew.Trautman@Vssyl.com';

-- ============================================================================
-- STEP 4: Create or upgrade subscription
-- Use the same table name pattern that worked above
-- ============================================================================

-- Check current subscription
SELECT s.id, s.tier, s.status 
FROM "Subscription" s
JOIN "User" u ON s."userId" = u.id
WHERE u.email = 'Andrew.Trautman@Vssyl.com' AND s.status = 'active';

-- If no subscription, create one:
INSERT INTO "Subscription" (
  id, "userId", tier, status, 
  "stripeSubscriptionId", "stripePriceId",
  "currentPeriodStart", "currentPeriodEnd", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(), u.id, 'enterprise', 'active',
  'admin_grant_complimentary', 'enterprise_complimentary',
  NOW(), NOW() + INTERVAL '1 year', NOW(), NOW()
FROM "User" u
WHERE u.email = 'Andrew.Trautman@Vssyl.com'
AND NOT EXISTS (
  SELECT 1 FROM "Subscription" WHERE "userId" = u.id AND status = 'active'
);

-- If subscription exists, upgrade it:
UPDATE "Subscription" s
SET tier = 'enterprise', "stripePriceId" = 'enterprise_complimentary', "updatedAt" = NOW()
FROM "User" u
WHERE s."userId" = u.id 
  AND u.email = 'Andrew.Trautman@Vssyl.com' 
  AND s.status = 'active';

-- ============================================================================
-- STEP 5: Verify success
-- ============================================================================
SELECT 
  u.email, 
  u.role, 
  s.tier, 
  s.status,
  CASE 
    WHEN u.role = 'ADMIN' AND s.tier = 'enterprise' THEN 'SUCCESS'
    ELSE 'INCOMPLETE'
  END as access_status
FROM "User" u
LEFT JOIN "Subscription" s ON u.id = s."userId" AND s.status = 'active'
WHERE u.email = 'Andrew.Trautman@Vssyl.com';

-- ============================================================================
-- ALTERNATIVE: List all users to find yours
-- ============================================================================
SELECT id, email, name, role, "createdAt" FROM "User" ORDER BY "createdAt" DESC LIMIT 10;

