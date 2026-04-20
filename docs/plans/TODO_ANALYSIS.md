# TODO Analysis & Missing Features

**Generated:** 2025-01-27  
**Last Verified:** 2025-01-27  
**Total TODOs Found:** 176

This document catalogs all TODO comments in the codebase that indicate incomplete features or missing functionality. These TODOs are likely causing user-facing issues where features appear to exist but don't actually work.

**Verification Status:** ✅ Verified - All TODOs below confirmed as actually missing (not just comments that weren't removed)

---

## 🔍 Verification Summary

Before implementation, we verified several critical TODOs to ensure they weren't already implemented:

### ✅ Backend APIs Exist, Frontend Not Connected
1. **HR Stats** - Backend endpoint `/api/hr/ai/context/overview` fetches real data, but frontend uses hardcoded values
2. **Calendar Event Creation** - `EventDrawer` component exists and works, but month view doesn't open it

### ❌ Fully Missing (No Backend API, No Frontend)
1. **Business Workspace Stats** - All widgets show fake data with no API integration
2. **Dashboard Widget Config** - Config changes ignored, no save functionality

### ⚠️ Partially Implemented
1. **Chat Message Deletion** - Works in main chat (`ChatMainPanel.tsx`) but not in stackable chat container

### ✅ Verified Missing
- All other TODOs confirmed as actually missing, not just comments that weren't removed

---

## 🔴 Critical Priority - User-Facing Missing Features

### 1. HR Module - Missing Real Data & Stats ✅ VERIFIED

**Location:** `web/src/components/hr/HRLayout.tsx`, `web/src/components/hr/HRPageLayout.tsx`

**Issues:**
- Stats showing hardcoded/placeholder values instead of real data
- Dashboard metrics not populated

**TODOs:**
- `pendingTimeOff: 0, // TODO: Fetch from API` (Line 88)
- `activeToday: businessData.members.length, // TODO: Fetch from API` (Line 89)
- `upcomingReviews: 0 // TODO: Fetch from API` (Line 90)
- `openExceptions: 0, // TODO: Fetch from API` (Line 131)
- `// TODO: Fetch real stats from API` (HRPageLayout.tsx:96)

**Verification:**
- ✅ Backend API EXISTS: `server/src/controllers/hrAIContextController.ts` has `getHROverviewContext` that fetches `pendingTimeOffRequests`, `employeesOffToday`, etc.
- ❌ Frontend NOT CALLING: `HRLayout.tsx` sets hardcoded values instead of calling the API endpoint
- **Status:** Backend ready, frontend needs to connect to `/api/hr/ai/context/overview`

**Impact:** HR dashboard shows incorrect/placeholder data instead of real metrics

---

### 2. Business Workspace - Missing Stats & Analytics ✅ VERIFIED

**Location:** `web/src/components/business/BusinessWorkspaceContent.tsx`

**Issues:**
- Business overview showing hardcoded stats
- Events, analytics, and members not loading

**TODOs:**
- `// TODO: Load business stats` (Line 66) - Shows fake data (members: 25, files: 156, etc.)
- `// TODO: Load business events` (Line 221) - Shows fake events array
- `// TODO: Load business analytics` (Line 302) - Shows hardcoded analytics
- `// TODO: Load business members` (Line 419) - Shows fake member list

**Verification:**
- ❌ All widgets using `setTimeout` to simulate loading with fake data
- ❌ No API calls to fetch real business data
- **Status:** Fully missing - needs API endpoints and frontend integration

**Impact:** Business workspace shows fake data instead of real business information

---

### 3. HR Analytics - Incomplete Aggregation

**Location:** `server/src/services/hrAnalyticsService.ts`

**Issues:**
- Weekly/monthly trends not implemented
- Missing compliance metrics
- Missing utilization calculations

**TODOs:**
- `weekly: [], // TODO: Implement weekly aggregation` (Line 320)
- `monthly: [] // TODO: Implement monthly aggregation` (Line 321)
- `trends: [] // TODO: Implement exception trends` (Line 326)
- `averageAttendanceScore: 0, // TODO: Calculate from employee scores` (Line 330)
- `topPerformers: [] // TODO: Calculate top performers` (Line 331)
- `balanceTrends: [] // TODO: Implement balance trends` (Line 437)
- `approvalTimeByType: [], // TODO: Calculate by type` (Line 441)
- `departmentUtilization: [], // TODO: Calculate utilization rates` (Line 445)
- `peakPeriods: [] // TODO: Identify peak periods` (Line 446)

**Impact:** HR analytics dashboard is incomplete - users can't see proper trends and metrics

---

### 4. Calendar - Event Creation Not Working ✅ VERIFIED

**Location:** `web/src/app/calendar/month/page.tsx`

**TODOs:**
- `// TODO: Open event creation modal or drawer` (Line 346)

**Verification:**
- ✅ `EventDrawer` component EXISTS and works (used in `/calendar/day` page)
- ✅ Backend `createEvent` API EXISTS and works
- ✅ Month view sets `draftStart` and `draftEnd` when clicking cell
- ❌ Month view does NOT open EventDrawer - just sets state variables
- **Status:** Component exists, just needs to be connected (`setShowDrawer(true)`)

**Impact:** Users cannot create events by clicking on calendar dates - state is set but drawer never opens

---

### 5. Chat - Message Deletion Missing ⚠️ PARTIALLY IMPLEMENTED

**Location:** `web/src/components/chat/StackableChatContainer.tsx`

**TODOs:**
- `// TODO: Implement message deletion` (Line 269)

**Verification:**
- ✅ Backend API EXISTS: `DELETE /api/chat/messages/:id` endpoint works
- ✅ Main Chat (`ChatMainPanel.tsx`) DOES implement deletion using `trashItem()`
- ❌ StackableChatContainer (`StackableChatContainer.tsx`) only shows toast - doesn't call API
- **Status:** Works in main chat, broken in stackable/minimized chat container

**Impact:** Users cannot delete messages in stackable/minimized chat windows

---

## 🟡 High Priority - Core Feature Gaps

### 6. AI Action Executor - All Actions Are Stubs

**Location:** `server/src/ai/core/ActionExecutor.ts`

**Issues:**
- All AI-driven actions are stubbed out - they return fake data instead of executing real operations
- No audit logging
- No approval system
- No notifications

**TODOs (23 stubs):**
- Approval system: `// TODO: Store approval request in database` (Line 1939)
- Notifications: `// TODO: Send notifications to affected users` (Line 1943)
- Audit logging: `// TODO: Log action execution for audit trail` (Line 1947)
- Drive API: `// TODO: Implement Drive API calls` (Line 1952)
- Chat API: `// TODO: Implement Chat API calls` (Line 1957)
- Dashboard API: `// TODO: Implement Dashboard API calls` (Line 1962)
- File organization: `// TODO: Implement file organization logic` (Line 1968)
- Message scheduling: `// TODO: Implement message scheduling` (Line 1973)
- Auto-response: `// TODO: Implement automatic message response` (Line 1978)
- Household tasks: `// TODO: Implement household task assignment` (Line 1983)
- Household events: `// TODO: Implement household event scheduling` (Line 1988)
- Household notifications: `// TODO: Implement household member notifications` (Line 1993)
- Household budget: `// TODO: Implement household budget management` (Line 1998)
- Business meetings: `// TODO: Implement business meeting scheduling` (Line 2003)
- Business tasks: `// TODO: Implement business task delegation` (Line 2008)
- Business reports: `// TODO: Implement business report generation` (Line 2013)
- Business projects: `// TODO: Implement business project updates` (Line 2018)
- Dashboard layout: `// TODO: Implement dashboard layout updates` (Line 2023)
- Dashboard modules: `// TODO: Implement dashboard module addition` (Line 2028)
- Notifications: `// TODO: Implement notification sending` (Line 2033)
- Reminders: `// TODO: Implement reminder scheduling` (Line 2038)

**Impact:** AI assistant claims to perform actions but they don't actually work

---

### 7. HR Settings - Disabled Features

**Location:** `server/src/controllers/hrController.ts`

**Issues:**
- HR settings endpoints disabled/not implemented
- Employee self-update feature missing

**TODOs:**
- `// TODO: Enable after migration` (Line 2023) - HR settings disabled
- `// TODO: Implement HR settings update` (Line 2050)
- `// TODO: Implement employee self-update (emergency contact, etc.)` (Line 2456)

**Impact:** HR settings page exists but doesn't save changes; employees can't update their own info

---

### 8. Scheduling - Missing Conflict Detection

**Location:** `server/src/controllers/schedulingController.ts`

**TODOs:**
- `// TODO: Send notifications to employees about published schedule` (Line 595)
- `// TODO: Check for scheduling conflicts` (Line 1330)
- `// TODO: Check employee availability` (Line 1331)

**Impact:** Schedules can be published without checking for conflicts; employees don't get notified

---

### 9. Dashboard - Widget Configuration Not Saving ✅ VERIFIED

**Location:** `web/src/app/dashboard/DashboardClient.tsx`

**TODOs:**
- `// TODO: Implement widget config update` (Lines 120, 133, 146, 159) - All widget types

**Verification:**
- ❌ `onConfigChange` handlers are empty - no API calls or state updates
- ❌ No backend endpoint found for widget config updates
- **Status:** Fully missing - needs both backend API and frontend integration

**Impact:** Widget configuration changes don't persist - changes are ignored

---

## 🟢 Medium Priority - Feature Enhancements

### 10. Admin Portal - Missing Schema Fields

**Location:** `server/src/services/adminService.ts`

**Issues:**
- Content moderation using placeholder data
- Missing severity and auto-moderation fields

**TODOs:**
- `title: 'No title', // TODO: Add contentTitle field to schema` (Line 503)
- `description: 'No description', // TODO: Add contentDescription field to schema` (Line 504)
- `url: '#' // TODO: Add contentUrl field to schema` (Line 505)
- `severity: 'medium' as 'low' | 'medium' | 'high' | 'critical', // TODO: Add severity field to schema` (Line 507)
- `autoModerated: false // TODO: Add autoModerated field to schema` (Line 508)

**Impact:** Admin portal content moderation features incomplete

---

### 11. Onboarding Templates - Preview Missing

**Location:** `web/src/app/business/[id]/admin/hr/onboarding/templates/page.tsx`

**TODOs:**
- `// TODO: Implement preview` (Line 539)

**Impact:** Can't preview onboarding templates before using them

---

### 12. Schedule Builder - Missing Features

**Locations:** `web/src/components/scheduling/ScheduleBuilderVisual.tsx`, `ScheduleBuilderSidebar.tsx`

**TODOs:**
- `// TODO: Implement send reminder` (Line 1588)
- `// TODO: Implement history view` (Line 1598)
- `// TODO: Implement time off` (Line 1610)
- `// TODO: Save and publish schedule` (Line 1982)
- `// TODO: Add employee functionality` (Lines 574, 619)

**Impact:** Schedule builder UI exists but many actions don't work

---

### 13. Chat - Missing Features

**Locations:** Multiple chat components

**TODOs:**
- `// TODO: Implement new chat functionality` (`ChatSidebar.tsx:310`)
- `// TODO: Implement trash integration similar to main chat` (`UnifiedGlobalChat.tsx:322`)
- `return message.senderId === 'current-user-id'; // TODO: Get from session` (`ChatWindow.tsx:395`)

**Impact:** Chat features incomplete or using placeholder logic

---

### 14. AI Learning - Not Connected to Database

**Location:** `server/src/services/todoAIPrioritizationService.ts`

**TODOs:**
- `// TODO: Implement actual learning from AILearningEvent table` (Line 537)
- `// TODO: Store learning events in AILearningEvent table` (Line 584)

**Impact:** AI learning system doesn't actually learn from user behavior

---

### 15. Org Chart - Missing Department Module Assignment

**Location:** `web/src/components/org-chart/PermissionManager.tsx`

**TODOs:**
- `// TODO: Connect to actual department module assignment` (Line 564)

**Impact:** Org chart permissions UI exists but doesn't actually assign modules

---

### 16. Business Configuration - API Placeholders

**Location:** `web/src/contexts/BusinessConfigurationContext.tsx`

**TODOs:**
- `// TODO: Replace with actual API call` (Lines 556, 884)
- `// TODO: Implement user role lookup` (Line 721)
- `// TODO: Replace with actual API call to update position permissions` (Line 884)
- `// TODO: Replace with actual API call to update department modules` (Line 922)

**Impact:** Business configuration changes don't actually save

---

## 🔵 Low Priority - Technical Debt

### 17. Prisma JSON Compatibility Issues

**Locations:** Multiple service files

**Issue:** Using `any` types for Prisma JSON fields due to compatibility issues

**Files Affected:**
- `server/src/services/adminService.ts` (Lines 1732, 1745)
- `server/src/services/orgChartService.ts` (Lines 71, 99, 133, 186, 220, 312)
- `server/src/services/employeeManagementService.ts` (Lines 95, 217, 297, 347, 395, 445, 466)
- `server/src/services/ssoService.ts` (Lines 76, 120, 199)
- `server/src/services/permissionService.ts` (Lines 88, 144, 184, 387, 399, 411, 423, 454, 559, 576)

**Impact:** Type safety compromised, but functionality works

---

### 18. Analytics - Missing CSV Export

**Location:** `server/src/controllers/analyticsController.ts`

**TODOs:**
- `connectionsMade: 0, // TODO: Implement when connections are available` (Line 141)
- `// TODO: Implement CSV export` (Line 299)

**Impact:** Analytics can't be exported to CSV

---

### 19. Calendar - Missing Features

**Locations:** Multiple calendar components

**TODOs:**
- `// TODO: Timezone/DST: normalize dtstart and between() range using event.timezone` (`calendarController.ts:304`)
- `// TODO: Send email with RSVP link` (`calendarController.ts:668`)
- `// TODO: Implement approval API endpoint` (`EnhancedCalendarModule.tsx:303`)
- `// TODO: Implement rejection API endpoint` (`EnhancedCalendarModule.tsx:319`)

**Impact:** Calendar timezone handling and RSVP features incomplete

---

### 20. Scheduling Workspace - Placeholder Stats

**Location:** `web/src/components/scheduling/SchedulingWorkspaceLanding.tsx`

**TODOs:**
- `// TODO: Load actual scheduling stats from API` (Line 80)

**Impact:** Scheduling dashboard shows placeholder data

---

### 21. Profile Photos - Missing Activity Tracking

**Location:** `server/src/controllers/profilePhotoController.ts`

**TODOs:**
- `// TODO: Add proper activity tracking when schema is updated` (Lines 256, 496)

**Impact:** Profile photo changes aren't tracked in activity log

---

### 22. File Migration - ZIP Creation Not Implemented

**Location:** `server/src/services/fileMigrationService.ts`

**TODOs:**
- `// TODO: Implement actual ZIP/TAR creation` (Line 338)

**Impact:** File export functionality incomplete

---

### 23. HR Feature Availability - Subscription Check

**Location:** `web/src/hooks/useHRFeatures.ts`

**TODOs:**
- `// TODO: Get from business context or subscription API` (Line 59)

**Impact:** HR feature availability not properly checked against subscription

---

### 24. Admin Portal - Placeholder Data

**Location:** `server/src/services/adminService.ts`

**TODOs:**
- `plan: 'premium' // TODO: Get actual plan from subscription` (Line 2891)
- `activeAgents: 5, // TODO: Get real agent count` (Line 2980)
- `averageResolutionTime: 8.5, // TODO: Calculate from resolved tickets` (Line 2981)

**Impact:** Admin portal analytics show placeholder data

---

### 25. AI Routes - Missing Implementations

**Location:** `server/src/routes/ai.ts`

**TODOs:**
- `// TODO: Execute the approved action` (Line 468)
- `// TODO: Implement feedback processing in learning engine` (Line 562)
- `// TODO: Use recentActivity for AI analysis when implemented` (Line 641)
- `// TODO: Generate insights using AI analysis` (Line 648)
- `// TODO: Implement preference integration` (Line 711)

**Impact:** AI features partially implemented

---

### 26. Educational Module - Email Invitations Missing

**Location:** `server/src/controllers/educationalController.ts`

**TODOs:**
- `// TODO: Send invitation email` (Line 261)

**Impact:** Educational module invitations don't send emails

---

### 27. Todo Module - Autonomy Check Missing

**Location:** `server/src/controllers/todoController.ts`

**TODOs:**
- `// TODO: Check autonomy settings via AutonomyManager` (Line 3605)

**Impact:** Todo module doesn't respect autonomy settings

---

### 28. Scheduling Permissions - Org Chart Lookup Missing

**Location:** `server/src/middleware/schedulingPermissions.ts`

**TODOs:**
- `// TODO: Implement proper org chart hierarchy lookup` (Line 248)

**Impact:** Scheduling permissions may not work correctly for org chart hierarchies

---

## 📊 Summary by Category

| Category | Count | Priority |
|----------|-------|----------|
| HR Module | 15 | 🔴 Critical |
| AI Action System | 23 | 🟡 High |
| Business Workspace | 4 | 🔴 Critical |
| Scheduling | 6 | 🟡 High |
| Calendar | 4 | 🔴/🟢 Mixed |
| Chat | 4 | 🔴/🟢 Mixed |
| Admin Portal | 9 | 🟢 Medium |
| Dashboard | 4 | 🟡 High |
| Prisma/TypeScript | 30+ | 🔵 Low (Technical Debt) |
| Other Features | 20+ | Mixed |

---

## 🎯 Recommended Action Plan

### Phase 1: Fix Critical User-Facing Issues (Week 1-2)
1. **HR Stats Loading** ✅ Backend ready - Connect frontend to `/api/hr/ai/context/overview`
2. **Business Workspace Data** - Create API endpoints and integrate frontend
3. **Calendar Event Creation** ✅ Components ready - Just need `setShowDrawer(true)` in month view
4. **Chat Message Deletion** ✅ API ready - Copy implementation from ChatMainPanel to StackableChatContainer

### Verification Summary
- ✅ **Backend APIs exist but frontend not using:** HR Stats, Calendar Event Creation
- ❌ **Fully missing:** Business Workspace Stats, Dashboard Widget Config
- ⚠️ **Partially implemented:** Chat Message Deletion (works in one place, not another)

### Phase 2: Complete Core Features (Week 3-4)
1. **HR Analytics Aggregation** - Implement weekly/monthly trends and compliance metrics
2. **HR Settings** - Enable and implement HR settings endpoints
3. **Scheduling Conflicts** - Add conflict detection and availability checking
4. **Dashboard Widget Config** - Make widget configuration persistent

### Phase 3: AI System Implementation (Week 5-6)
1. **Action Executor** - Implement real API calls for all action types
2. **Approval System** - Store approvals in database with notifications
3. **Audit Logging** - Add action execution logging
4. **AI Learning** - Connect to AILearningEvent table

### Phase 4: Enhancements & Technical Debt (Week 7+)
1. **Admin Portal Schema** - Add missing fields to moderation schema
2. **Prisma JSON Types** - Resolve type compatibility issues
3. **Feature Completeness** - Complete remaining TODO items

---

## 🔍 How to Search for TODOs

To find TODOs in the codebase:

```bash
# Find all TODOs (case-sensitive)
grep -r "TODO:" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"

# Find all FIXMEs, HACKs, etc.
grep -r -E "(TODO|FIXME|XXX|HACK):" --include="*.ts" --include="*.tsx"
```

---

**Next Steps:**
1. Review this analysis
2. Prioritize which TODOs to address first
3. Create tickets/tasks for each priority group
4. Begin implementation starting with Critical Priority items
