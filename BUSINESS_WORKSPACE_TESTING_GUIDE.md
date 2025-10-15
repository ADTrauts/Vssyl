# 🧪 Business Workspace - Testing Guide

**Date:** October 15, 2025  
**Status:** Ready for Testing  
**Priority:** CRITICAL - Verify all fixes are working correctly

---

## 📋 Overview

This testing guide covers verification of the two critical fixes:

1. **Dashboard Context Isolation** - Personal and business data must be completely separated
2. **Module Management System** - Admin control over employee modules must work correctly

---

## 🔧 Pre-Testing Setup

### **Step 1: Deploy Changes**

```bash
# From project root
git add .
git commit -m "Fix business workspace dashboard isolation and module management

- Add businessDashboardId creation logic to layouts
- Remove businessId fallback from modules (data leakage fix)
- Auto-install core modules (Drive, Chat, Calendar) on business creation
- Create module management UI at /business/[id]/modules
- Remove hardcoded fallback modules
- Update admin dashboard routing"

git push origin main
```

**Wait for Google Cloud Build to complete (~7-10 minutes)**

### **Step 2: Clear Browser Cache**

**IMPORTANT:** Hard refresh to get new JavaScript bundle

- **Chrome/Edge:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- **Firefox:** `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- **Or:** Use Incognito/Private browsing mode

---

## 🧪 Test Suite 1: Dashboard Context Isolation

### **Objective**
Verify that personal files/data don't appear in business workspace, and business files/data don't appear in personal workspace.

### **Test 1.1: Personal Drive Isolation**

**Steps:**
1. Log in to your account at https://vssyl.com
2. Go to Personal Dashboard (any personal tab)
3. Navigate to Drive
4. Upload a test file: `personal-test-file.pdf`
5. Verify file appears in personal Drive
6. Note the file name and upload time

**Expected Result:** ✅ File uploads successfully to personal Drive

---

### **Test 1.2: Business Drive Isolation**

**Steps:**
1. From same session, switch to Work tab (or create a test business if needed)
2. Click on your business to enter workspace
3. Navigate to Drive in business workspace
4. **CRITICAL CHECK:** Open browser console (F12)
5. Look for log: `📁 DriveModule Context Resolution`
6. Verify:
   - `dashboardId: "[uuid-here]"` (NOT null!)
   - `resolvedContextId: "[same-uuid]"` (matches dashboardId)
   - `businessId: "(not used - deprecated)"` or similar
7. Look at the files list

**Expected Results:**
- ✅ `dashboardId` is a valid UUID (not null)
- ✅ `resolvedContextId` equals `dashboardId`
- ✅ `personal-test-file.pdf` does NOT appear in the list
- ✅ No console errors about null dashboardId

**If FAILED:**
- ❌ `dashboardId: null` - Layout fix didn't apply
- ❌ Personal file appears - Data leakage still occurring
- ❌ Console errors - Check error messages

---

### **Test 1.3: Business File Upload**

**Steps:**
1. While in business Drive, upload a test file: `business-test-file.pdf`
2. Verify file appears in business Drive
3. Check console for dashboard context logs
4. Note file name and upload time

**Expected Result:** ✅ File uploads successfully to business Drive with correct dashboardId

---

### **Test 1.4: Verify Personal Drive Unchanged**

**Steps:**
1. Switch back to Personal Dashboard
2. Navigate to personal Drive
3. Look at files list

**Expected Results:**
- ✅ `personal-test-file.pdf` is still there
- ✅ `business-test-file.pdf` does NOT appear
- ✅ Business files completely isolated from personal

---

### **Test 1.5: Multiple Business Isolation**

**Steps (if you have multiple businesses):**
1. Create a second test business OR use existing second business
2. Upload file in Business A: `business-a-file.pdf`
3. Switch to Business B workspace
4. Navigate to Drive
5. Check files list

**Expected Result:** ✅ Business A files don't appear in Business B Drive

---

## 🧪 Test Suite 2: Module Management System

### **Objective**
Verify that business admins can control which modules employees see, and changes sync in real-time.

### **Test 2.1: Core Modules Auto-Installation**

**Steps:**
1. Create a NEW business (to test auto-installation)
2. Fill in business details and submit
3. Wait for business creation to complete
4. Check server logs OR browser network tab
5. Look for console messages about module installation

**Expected Results:**
- ✅ Business created successfully
- ✅ Server logs show: "🔧 Auto-installing core modules for business: [id]"
- ✅ Server logs show: "✅ Installed core module: Drive (drive)"
- ✅ Server logs show: "✅ Installed core module: Chat (chat)"
- ✅ Server logs show: "✅ Installed core module: Calendar (calendar)"

**If using EXISTING business:** Core modules won't be auto-installed. Admin must install manually from module management page.

---

### **Test 2.2: Access Module Management UI**

**Steps:**
1. Go to Business Admin Dashboard: `/business/[id]`
2. Find the "Business Modules" card
3. Click "Manage Modules" button
4. Verify navigation to `/business/[id]/modules`

**Expected Results:**
- ✅ Button navigates to `/business/[id]/modules` (NOT `/profile?tab=analytics`)
- ✅ Module management page loads successfully
- ✅ "Installed" tab shows 3 modules: Drive, Chat, Calendar
- ✅ Each core module has "Core" badge
- ✅ Core modules have "cannot be uninstalled" message

---

### **Test 2.3: Install Additional Module**

**Steps:**
1. On module management page, click "Marketplace" tab
2. Search for a module (e.g., "Analytics" or any available module)
3. Click "Install Module" button
4. Wait for installation to complete
5. Switch back to "Installed" tab

**Expected Results:**
- ✅ Module installs successfully
- ✅ Toast notification: "Module installed successfully"
- ✅ Module appears in "Installed" tab
- ✅ Module has "Installed" badge (NOT "Core" badge)
- ✅ Module has "Uninstall" button (trash icon)

---

### **Test 2.4: Module Appears in Employee Workspace**

**Steps:**
1. Open a new browser tab (or incognito window)
2. Log in as a DIFFERENT user (employee of the business)
3. Go to Work tab, select the business
4. Check available modules on BrandedWorkDashboard

**Expected Results:**
- ✅ Newly installed module appears in employee's workspace
- ✅ Module is clickable and navigates correctly
- ✅ No need to refresh page (real-time sync via polling)

**If FAILED:**
- ❌ Module doesn't appear - Check BusinessConfigurationContext polling
- ❌ Need to refresh page - Polling may be disabled

---

### **Test 2.5: Uninstall Module (Non-Core)**

**Steps:**
1. Back in admin account, go to Module Management
2. Find the module you just installed (NOT a core module)
3. Click the trash icon to uninstall
4. Confirm the uninstall dialog
5. Wait for uninstallation to complete

**Expected Results:**
- ✅ Confirmation dialog appears: "Are you sure you want to uninstall..."
- ✅ Toast notification: "Module uninstalled successfully"
- ✅ Module disappears from "Installed" tab
- ✅ Module reappears in "Marketplace" tab

---

### **Test 2.6: Module Removed from Employee Workspace**

**Steps:**
1. Switch back to employee account tab
2. Wait 30 seconds (polling interval) OR refresh page
3. Check available modules

**Expected Results:**
- ✅ Uninstalled module is no longer visible to employee
- ✅ Core modules (Drive, Chat, Calendar) still visible
- ✅ Module list updates without manual refresh (within 30 seconds)

---

### **Test 2.7: Cannot Uninstall Core Modules**

**Steps:**
1. As admin, go to Module Management > Installed tab
2. Find "Drive" module
3. Attempt to click uninstall button

**Expected Results:**
- ✅ Drive, Chat, and Calendar do NOT have uninstall buttons
- ✅ Message shows: "Core module - cannot be uninstalled"
- ✅ Attempting uninstall shows error toast

---

### **Test 2.8: Non-Admin Access Restriction**

**Steps:**
1. Log in as EMPLOYEE (not admin or manager)
2. Try to navigate directly to `/business/[id]/modules`

**Expected Results:**
- ✅ Access denied message appears
- ✅ Message: "Only business administrators can manage modules"
- ✅ Cannot install/uninstall modules

---

## 🔍 Console Debugging

### **What to Look For in Console**

**Good Logs (Success):**
```
🔄 BusinessWorkspaceLayout: Fetching dashboards for business: [uuid]
📊 BusinessWorkspaceLayout: Total dashboards: 5
✅ BusinessWorkspaceLayout: Found existing business dashboard: [uuid]
🎯 BusinessWorkspaceLayout: Business Dashboard Ready: {...}

📁 DriveModule Context Resolution: {
  dashboardId: "abc-123-uuid",
  resolvedContextId: "abc-123-uuid",
  businessId: "(not used - deprecated)"
}
```

**Bad Logs (Failure):**
```
❌ DriveModule: No dashboardId provided! Cannot load drive content.
⚠️  BusinessWorkspace rendering without dashboardId! This will show personal data!

📁 DriveModule Context Resolution: {
  dashboardId: null,  // ❌ BAD!
  resolvedContextId: "business-id-here",  // ❌ Using wrong ID!
}
```

---

## 📊 Success Criteria Checklist

### **Dashboard Isolation (Test Suite 1)**

- [ ] Personal files uploaded in personal Drive
- [ ] Business files uploaded in business Drive  
- [ ] Personal files DO NOT appear in business Drive
- [ ] Business files DO NOT appear in personal Drive
- [ ] Console shows valid dashboardId (not null)
- [ ] Console shows dashboardId equals resolvedContextId
- [ ] No errors about null or undefined dashboardId
- [ ] Multiple businesses have isolated data

### **Module Management (Test Suite 2)**

- [ ] New businesses auto-install Drive, Chat, Calendar
- [ ] Module Management page accessible at `/business/[id]/modules`
- [ ] Admin can see installed modules (3 core modules)
- [ ] Admin can browse marketplace modules
- [ ] Admin can install additional modules
- [ ] Installed modules appear in employee workspace
- [ ] Admin can uninstall non-core modules
- [ ] Uninstalled modules disappear from employee workspace
- [ ] Core modules cannot be uninstalled
- [ ] Non-admin users cannot access module management
- [ ] Changes sync in real-time (within 30 seconds)

---

## 🚨 Common Issues & Solutions

### **Issue: dashboardId still null**

**Symptoms:**
- Console shows `dashboardId: null`
- Personal files appear in business Drive

**Solution:**
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Try incognito mode
4. Check if Cloud Build completed successfully
5. Verify new code deployed (check build timestamp in Google Cloud Console)

---

### **Issue: No modules appear**

**Symptoms:**
- Employee sees "No modules available"
- Admin sees empty installed list

**Solution:**
1. Check if business was created BEFORE auto-installation was implemented
2. Go to Module Management page as admin
3. Manually install Drive, Chat, Calendar from marketplace
4. Or run database migration to add modules to existing businesses

---

### **Issue: Module install fails**

**Symptoms:**
- Toast error: "Failed to install module"
- Module doesn't appear in installed list

**Solution:**
1. Check browser console for error details
2. Check server logs for backend errors
3. Verify `BusinessModuleInstallation` table exists in database
4. Verify user has admin/manager role

---

### **Issue: Changes don't sync to employee**

**Symptoms:**
- Admin installs module
- Employee doesn't see it (even after 30+ seconds)

**Solution:**
1. Check if polling is enabled in BusinessConfigurationContext
2. Employee should manually refresh page
3. Check WebSocket connection (may need to implement WebSocket for instant sync)
4. Verify employee is member of the business

---

## 🎯 Quick Test Script

**For rapid verification, run this quick test:**

```
1. Clear cache, hard refresh
2. Log in as admin
3. Create new business "Test Corp"
4. Check console for core module installation logs
5. Go to /business/[id]/modules
6. Verify 3 modules installed (Drive, Chat, Calendar)
7. Upload file in business Drive: "business.pdf"
8. Check console: dashboardId should be UUID
9. Switch to personal Drive
10. Verify "business.pdf" does NOT appear
11. Upload "personal.pdf" in personal Drive
12. Switch back to business Drive
13. Verify "personal.pdf" does NOT appear
14. ✅ If all pass: FIXES ARE WORKING!
```

---

## 📞 Support Information

If tests fail, collect the following information:

1. **Browser Console Logs** (full output)
2. **Network Tab** (failed API calls)
3. **Server Logs** (from Google Cloud Console)
4. **Build Status** (verify latest build deployed)
5. **User Role** (admin, manager, or employee)
6. **Business ID** (for debugging specific business)
7. **Dashboard IDs** (from console logs)

---

## ✅ Testing Complete - Next Steps

Once all tests pass:

1. ✅ Mark all TODOs as complete
2. ✅ Update memory bank (activeContext.md, progress.md)
3. ✅ Document any issues found and resolutions
4. ✅ Create production test users if needed
5. ✅ Monitor system for 24-48 hours
6. ✅ Gather user feedback on module management UX
7. ✅ Plan next iteration improvements

---

## 🚀 Future Enhancements (Post-Testing)

### **Priority 1: Module Permissions UI**
- Configure which roles can access which modules
- Per-module permission settings
- Department-level module access

### **Priority 2: Real-Time WebSocket Sync**
- Instant module updates (no 30-second polling delay)
- Real-time branding changes
- Live permission updates

### **Priority 3: Module Analytics**
- Track module usage per employee
- Module engagement metrics
- ROI tracking for paid modules

### **Priority 4: Advanced Module Features**
- Module-specific settings configuration
- Custom module permissions
- Module dependency management
- Module update notifications

---

**End of Testing Guide**

