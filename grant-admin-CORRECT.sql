-- ============================================================================
-- CORRECT SQL COMMANDS - Mixed case columns
-- Table: users (lowercase)
-- Columns: camelCase (need quotes)
-- ============================================================================

-- STEP 1: Check if user exists
SELECT id, email, name, role, "createdAt" 
FROM users 
WHERE email = 'Andrew.Trautman@Vssyl.com';

-- STEP 2: Grant ADMIN role
UPDATE users 
SET role = 'ADMIN', 
    "emailVerified" = COALESCE("emailVerified", NOW()),
    "updatedAt" = NOW()
WHERE email = 'Andrew.Trautman@Vssyl.com';

-- STEP 3: Check what the subscription table columns are
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
ORDER BY ordinal_position;

-- STEP 4: Check current subscription (will adjust after seeing column names)
-- Run STEP 3 first, then we'll know the exact column names to use

