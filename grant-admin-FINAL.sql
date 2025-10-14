-- ============================================================================
-- FINAL CORRECT COMMANDS - All column names verified
-- ============================================================================

-- STEP 1: Grant ADMIN role
UPDATE users 
SET role = 'ADMIN', 
    "emailVerified" = COALESCE("emailVerified", NOW()),
    "updatedAt" = NOW()
WHERE email = 'Andrew.Trautman@Vssyl.com';

-- Verify:
SELECT email, role, "emailVerified" FROM users WHERE email = 'Andrew.Trautman@Vssyl.com';

-- STEP 2: Check current subscription
SELECT s.id, s."userId", s.tier, s.status, s."currentPeriodEnd"
FROM subscriptions s
JOIN users u ON s."userId" = u.id
WHERE u.email = 'Andrew.Trautman@Vssyl.com' 
  AND s.status = 'active';

-- STEP 3a: Create enterprise subscription (if none exists)
INSERT INTO subscriptions (
  id, "userId", tier, status, 
  "stripeSubscriptionId", 
  "currentPeriodStart", "currentPeriodEnd", 
  "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(), 
  u.id, 
  'enterprise', 
  'active',
  'admin_grant_complimentary',
  NOW(), 
  NOW() + INTERVAL '1 year', 
  NOW(), 
  NOW()
FROM users u
WHERE u.email = 'Andrew.Trautman@Vssyl.com'
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions WHERE "userId" = u.id AND status = 'active'
  );

-- STEP 3b: OR upgrade existing subscription to enterprise
UPDATE subscriptions s
SET tier = 'enterprise', 
    "updatedAt" = NOW(),
    "currentPeriodEnd" = GREATEST(s."currentPeriodEnd", NOW() + INTERVAL '1 year')
FROM users u
WHERE s."userId" = u.id 
  AND u.email = 'Andrew.Trautman@Vssyl.com' 
  AND s.status = 'active'
  AND s.tier != 'enterprise';

-- STEP 4: FINAL VERIFICATION
SELECT 
  u.email, 
  u.role, 
  s.tier, 
  s.status,
  s."currentPeriodEnd" as "Valid Until",
  CASE 
    WHEN u.role = 'ADMIN' AND s.tier = 'enterprise' AND s.status = 'active' 
    THEN '✅ SUCCESS - FULL ACCESS GRANTED'
    ELSE '❌ INCOMPLETE - CHECK REQUIRED'
  END as "Access Status"
FROM users u
LEFT JOIN subscriptions s ON u.id = s."userId" AND s.status = 'active'
WHERE u.email = 'Andrew.Trautman@Vssyl.com';

-- STEP 5: List all admins (for confirmation)
SELECT email, name, role FROM users WHERE role = 'ADMIN' ORDER BY "createdAt" DESC;

