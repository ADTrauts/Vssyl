# HR Module Testing Checklist

**Wait ~10 minutes** for Cloud Build to complete, then run these tests:

---

## ✅ **Step 1: Check if Migration Ran**

```bash
curl https://vssyl-server-235369681725.us-central1.run.app/api/debug/database/hr-tables
```

**Expected (Success)**:
```json
{
  "success": true,
  "hrModuleExists": true,
  "migrationComplete": true,
  "tables": {
    "employeeHRProfile": true,
    "managerApprovalHierarchy": true,
    "hrModuleSettings": true
  },
  "message": "All HR tables exist - migration successful!"
}
```

**If migrationComplete is false**:
- Migration hasn't run yet
- Wait a few more minutes
- Or check Cloud Run logs for migration errors

---

## ✅ **Step 2: Verify HR Module Exists**

```bash
curl https://vssyl-server-235369681725.us-central1.run.app/api/debug/modules/hr
```

**Expected**:
```json
{
  "success": true,
  "module": {
    "id": "hr",
    "name": "HR Management",
    "pricingTier": "business_advanced",
    "aiContextRegistered": true
  }
}
```

---

## ✅ **Step 3: Check Your Business Tier**

**Find your businessId**: 
- It's in your console logs: `a3c13e53-9e98-4595-94b6-47cecd993611`

**Option A: Quick SQL Query** (if you have database access)
```sql
SELECT id, name, tier FROM businesses WHERE id = 'a3c13e53-9e98-4595-94b6-47cecd993611';
```

**Option B: Via API** (after logging in)
```javascript
// In browser console:
fetch('/api/business/a3c13e53-9e98-4595-94b6-47cecd993611')
  .then(r => r.json())
  .then(b => console.log('Tier:', b.tier))
```

**Expected tiers for HR**:
- ✅ `business_advanced` - Can install HR (limited features)
- ✅ `enterprise` - Can install HR (full features)
- ❌ `free` or `business_basic` - Cannot install HR

---

## ✅ **Step 4: Update Business Tier** (If Needed)

If your business tier is `free` or `business_basic`, you need to update it.

**Quick Fix via SQL**:
```sql
UPDATE businesses 
SET tier = 'enterprise' 
WHERE id = 'a3c13e53-9e98-4595-94b6-47cecd993611';
```

**Or let me know** and I'll create an admin API endpoint to update it.

---

## ✅ **Step 5: Try Installing HR Module Again**

After confirming:
- ✅ Migration complete (tables exist)
- ✅ Business tier is `business_advanced` or `enterprise`

Try installing again:

```
1. Go to https://vssyl.com
2. Navigate to business modules page
3. Find "HR Management"
4. Click "Install"
5. Should work now! ✅
```

**If it still fails with 500**:
- Check browser console for error details
- Let me see the full error message
- I'll help debug further

---

## 🔍 **Quick Diagnosis**

Run these in order after ~10 minutes:

```bash
# 1. Check HR tables exist
curl https://vssyl-server-235369681725.us-central1.run.app/api/debug/database/hr-tables

# 2. Check HR module exists  
curl https://vssyl-server-235369681725.us-central1.run.app/api/debug/modules/hr

# 3. Check all modules
curl https://vssyl-server-235369681725.us-central1.run.app/api/debug/modules
```

---

## 📊 **Current Status**

**What's Working** ✅:
- HR module seeded automatically
- Login working
- HR module shows in marketplace

**What's Not Working** ❌:
- Installation failing with 500 error
- Likely cause: Migration hasn't run yet OR business tier too low

**Your Business**:
- ID: `a3c13e53-9e98-4595-94b6-47cecd993611`
- Tier: Unknown (need to check)
- Should be: `business_advanced` or `enterprise` for HR

---

## ⏰ **Timeline**

**Latest Push**: Just now (commit `dca735f`)  
**Build Time**: ~10 minutes  
**Try Tests**: Around 11:15 AM

---

**In ~10 minutes, run the database check endpoint first.** If tables exist, then it's just a tier issue we can fix easily! 🎯

