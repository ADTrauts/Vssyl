# Context Issue - Root Cause Analysis

## 🔍 **THE PROBLEM**

Personal files/calendars are showing in the business workspace because `businessDashboardId` is **NULL** when modules first render.

---

## 🐛 **ROOT CAUSE**

Looking at `web/src/app/business/[id]/workspace/page.tsx`:

```typescript
const loadBusinessData = async () => {
  try {
    setLoading(true);
    setError(null);

    const businessResponse = await businessAPI.getBusiness(businessId);

    if (businessResponse.success) {
      const businessData = businessResponse.data as unknown as Business;
      setBusiness(businessData);  // <-- Sets business
      
      // Auto-create or get business dashboard
      await ensureBusinessDashboard(businessData);  // <-- ASYNC! Takes time
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load business data');
  } finally {
    setLoading(false);  // <-- RUNS IMMEDIATELY after setBusiness()
  }
};
```

**The Flow:**
1. `loadBusinessData()` starts
2. Business data fetched
3. `setBusiness(businessData)` - business state updated
4. `ensureBusinessDashboard()` starts (ASYNC - takes 100-500ms)
5. `finally` block runs → `setLoading(false)`
6. **Component renders BusinessWorkspaceContent with `businessDashboardId = null`**
7. Modules render with `dashboardId = null`
8. API calls with `dashboardId = null` → Backend returns personal files!
9. THEN `ensureBusinessDashboard()` completes
10. `setBusinessDashboardId()` is called
11. Component re-renders, but modules might not refresh

---

## ✅ **THE FIX**

Move `setLoading(false)` INSIDE the success block, AFTER the dashboard is created:

```typescript
const loadBusinessData = async () => {
  try {
    setLoading(true);
    setError(null);

    const businessResponse = await businessAPI.getBusiness(businessId);

    if (businessResponse.success) {
      const businessData = businessResponse.data as unknown as Business;
      setBusiness(businessData);
      
      // Auto-create or get business dashboard
      await ensureBusinessDashboard(businessData);
      
      // ONLY set loading false AFTER dashboard is ready
      setLoading(false);
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load business data');
    setLoading(false);  // Also set false on error
  }
  // NO finally block!
};
```

---

## 🎯 **VERIFICATION**

After fix, check console logs:

```javascript
// Should see this ORDER:
🔍 Business Dashboard Created/Found: { dashboardId: "abc-123-...", ... }
📁 Rendering Drive with businessDashboardId: "abc-123-..."  // NOT null!
🚀 DriveModuleWrapper: { dashboardId: "abc-123-...", ... }
📁 DriveModule Context Resolution: { resolvedContextId: "abc-123-..." }
📁 Drive Debug - API URLs: { 
  filesUrl: "/api/drive/files?dashboardId=abc-123-...",  // HAS dashboardId!
  foldersUrl: "/api/drive/folders?dashboardId=abc-123-..." 
}
```

**If you see `dashboardId=null` or undefined, modules are loading too early!**

---

## 🔐 **WHY THIS MATTERS**

The backend properly filters by dashboardId:

**fileController.ts:**
```typescript
if (dashboardId) {
  query += ` AND "dashboardId" = $${paramIndex}`;
  params.push(dashboardId);
} else {
  query += ` AND "dashboardId" IS NULL`;  // <-- Returns PERSONAL files!
}
```

So when modules render with `dashboardId = null`, the API returns personal files because the backend thinks we want personal context!

---

## 📊 **SECONDARY ISSUE**

Modules might not re-fetch when `businessDashboardId` changes from `null` to actual value. Need to ensure useEffect dependencies include `dashboardId`.

In `DriveModule.tsx`, the dependency array is:
```typescript
}, [session?.accessToken, dashboardId, businessId, currentDashboard?.id, currentFolder]);
```

This should trigger a re-fetch when `dashboardId` changes, but the initial render with `null` already happened!

---

## 🎬 **ACTION ITEMS**

1. ✅ Fix loading state timing in `workspace/page.tsx`
2. ✅ Verify modules wait for `businessDashboardId` before rendering
3. ✅ Check console logs to confirm proper dashboard ID flow
4. ✅ Test: Upload file → Should only appear in business workspace
5. ✅ Test: Personal files should NOT appear in business workspace

