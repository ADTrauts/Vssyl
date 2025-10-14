-- ============================================================================
-- ADMIN ACCESS GRANT - LOWERCASE TABLES
-- For: Andrew.Trautman@Vssyl.com
-- ============================================================================

-- STEP 1: Check if user exists
SELECT id, email, name, role, created_at FROM users 
WHERE email = 'Andrew.Trautman@Vssyl.com';

-- STEP 2: Grant ADMIN role
UPDATE users 
SET role = 'ADMIN', 
    email_verified = COALESCE(email_verified, NOW()),
    updated_at = NOW()
WHERE email = 'Andrew.Trautman@Vssyl.com';

-- STEP 3: Check current subscription
SELECT s.id, s.tier, s.status, s.current_period_end
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE u.email = 'Andrew.Trautman@Vssyl.com' 
  AND s.status = 'active';

-- STEP 4a: Create enterprise subscription (if none exists)
INSERT INTO subscriptions (
  id, user_id, tier, status, 
  stripe_subscription_id, stripe_price_id,
  current_period_start, current_period_end, 
  created_at, updated_at
)
SELECT
  gen_random_uuid(), 
  u.id, 
  'enterprise', 
  'active',
  'admin_grant_complimentary', 
  'enterprise_complimentary',
  NOW(), 
  NOW() + INTERVAL '1 year', 
  NOW(), 
  NOW()
FROM users u
WHERE u.email = 'Andrew.Trautman@Vssyl.com'
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE user_id = u.id AND status = 'active'
  );

-- STEP 4b: OR upgrade existing subscription to enterprise
UPDATE subscriptions s
SET tier = 'enterprise', 
    stripe_price_id = 'enterprise_complimentary', 
    updated_at = NOW(),
    current_period_end = GREATEST(s.current_period_end, NOW() + INTERVAL '1 year')
FROM users u
WHERE s.user_id = u.id 
  AND u.email = 'Andrew.Trautman@Vssyl.com' 
  AND s.status = 'active'
  AND s.tier != 'enterprise';

-- STEP 5: Verify final access
SELECT 
  u.email, 
  u.role, 
  s.tier, 
  s.status,
  s.current_period_end as valid_until,
  CASE 
    WHEN u.role = 'ADMIN' AND s.tier = 'enterprise' AND s.status = 'active' 
    THEN '✅ SUCCESS - FULL ACCESS GRANTED'
    ELSE '❌ CHECK REQUIRED'
  END as access_status
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
WHERE u.email = 'Andrew.Trautman@Vssyl.com';

-- STEP 6: List all admin users (for verification)
SELECT email, name, role, created_at 
FROM users 
WHERE role = 'ADMIN' 
ORDER BY created_at DESC;

