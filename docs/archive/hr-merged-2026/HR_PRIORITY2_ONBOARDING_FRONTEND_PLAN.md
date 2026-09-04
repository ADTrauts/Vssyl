---

⚠️ **Architecture Notice**

This document is retained for historical context only. It is **not** current authority.

Archived from `memory-bank/` on 2026-09-03 (Batch 1A).

---

# Priority 2: Onboarding Frontend Completion - Implementation Plan

**Date**: January 2025  
**Status**: Planning  
**Priority**: High  
**Estimated Duration**: Week 3-4 (2 weeks)

---

## 🎯 Overview

Complete the frontend UI for the onboarding module. The backend is fully implemented with all services, routes, and API endpoints ready. The frontend currently has partial implementations that need to be completed and enhanced.

**Critical Requirement**: This implementation must integrate with other modules (Drive, Calendar, Chat, Scheduling) to create a cohesive platform experience. Modules should work together, not in isolation.

---

## 🔗 Module Integration Requirements

### Module Dependencies
- **Scheduling Module**:
  - **Requires HR Module** (Scheduling cannot be installed without HR)
  - **HR Module is standalone** (HR can work without Scheduling)
  - **Integration**: Time-off requests from HR should appear in Scheduling calendar
  - **Integration**: Scheduling can check HR employee data for shift assignments

- **Drive Module**:
  - **No dependency** (can be installed independently)
  - **Integration**: Use Drive for all document storage in onboarding
  - **Integration**: Onboarding documents should be stored in Drive folders

- **Calendar Module**:
  - **No dependency** (can be installed independently)
  - **Integration**: Show onboarding events (meetings, training) in Calendar
  - **Integration**: Sync onboarding task due dates to Calendar

- **Chat Module**:
  - **No dependency** (can be installed independently)
  - **Integration**: Enable direct HR conversations for onboarding questions
  - **Integration**: Chat notifications for onboarding task assignments

### Integration Points

1. **Document Storage (Drive)**:
   - All onboarding documents uploaded via Drive API
   - Use `uploadFile()` from `@/api/drive`
   - Store in business-specific Drive folders
   - Link documents to onboarding tasks via `metadata.driveFileId`

2. **Calendar Integration**:
   - Onboarding meetings/training tasks create Calendar events
   - Use `calendarAPI` from `@/api/calendar`
   - Show onboarding timeline in Calendar view
   - Sync task due dates as calendar reminders

3. **Chat Integration**:
   - Use `ChatContext` for HR conversations
   - Create direct conversations for onboarding questions
   - Use `useChat()` hook for messaging
   - Link chat conversations to onboarding tasks

4. **Scheduling Integration** (if installed):
   - Check if Scheduling module is installed before showing scheduling features
   - Time-off requests from onboarding should sync with Scheduling
   - Use Scheduling calendar to show employee availability during onboarding

### Module Detection Pattern

```typescript
// Check if module is installed
import { useModuleFeatures } from '@/hooks/useFeatureGating';

const { hasModule: hasScheduling } = useModuleFeatures('scheduling', businessId);
const { hasModule: hasDrive } = useModuleFeatures('drive', businessId);
const { hasModule: hasCalendar } = useModuleFeatures('calendar', businessId);
const { hasModule: hasChat } = useModuleFeatures('chat', businessId);

// Conditionally show features
{hasDrive && <DocumentUploadComponent />}
{hasCalendar && <CalendarSyncButton />}
{hasChat && <StartHRConversationButton />}
{hasScheduling && <TimeOffSyncIndicator />}
```

---

## ✅ Current State Assessment

### Backend Status: ✅ Complete
- ✅ `hrOnboardingService.ts` - Full service implementation
- ✅ API routes registered in `server/src/routes/hr.ts`
- ✅ Controllers implemented in `server/src/controllers/hrController.ts`
- ✅ Frontend API client (`web/src/api/hrOnboarding.ts`) - All functions available
- ✅ Database schema complete (templates, journeys, tasks)

### Frontend Status: 🟡 Partial
- ✅ **Template Management UI** - Exists in `OnboardingModuleSettings.tsx` (module settings page)
  - Create/edit templates ✅
  - Task template editor ✅
  - Document/equipment catalog management ✅
  - Template preview ✅
  - **Location**: Module settings (not easily accessible from HR workspace)

- 🟡 **Employee Onboarding Journey UI** - Basic implementation in `workspace/hr/me/page.tsx`
  - Journey status view ✅ (basic)
  - Task checklist with progress ✅ (basic)
  - Document upload interface ❌ (missing)
  - Equipment/uniform requests ❌ (missing)
  - Task completion workflow ✅ (basic)

- 🟡 **Manager Onboarding Approval UI** - Basic implementation in `workspace/hr/team/page.tsx`
  - Pending approvals list ✅ (basic)
  - Task approval workflow ✅ (basic)
  - Direct report onboarding status ❌ (missing detailed view)
  - Better filtering/sorting ❌ (missing)

---

## 📋 Implementation Tasks

### Task 1: Onboarding Template Management UI (Admin HR Settings)
**Location**: `web/src/app/business/[id]/admin/hr/onboarding/page.tsx` (NEW PAGE)

**Goal**: Create a dedicated admin page for managing onboarding templates, accessible from HR sidebar.

**Components to Create**:
1. **`OnboardingTemplatesList.tsx`** - Main list view
   - Display all templates (active/archived filter)
   - Template cards with: name, description, task count, last updated, default badge
   - Actions: Edit, Archive, Set as Default, Preview
   - Search/filter functionality

2. **`OnboardingTemplateEditor.tsx`** - Create/Edit template (can reuse/extend from module settings)
   - Template metadata (name, description, default flag)
   - Task sequence editor (drag-and-drop ordering)
   - Task template form (title, type, owner, due offset, requirements)
   - Template preview mode
   - Save/Cancel actions

3. **`OnboardingTemplatePreview.tsx`** - Preview template as employee would see it
   - Show task sequence
   - Display task details
   - Estimated timeline based on due offsets

**Features**:
- Create new template
- Edit existing template
- Archive template
- Set default template
- Preview template
- Duplicate template
- Template search/filter

**Integration**:
- Add "Onboarding Templates" to HR sidebar (Admin only)
- Link from HR dashboard
- Use existing API functions from `hrOnboarding.ts`

**Files to Create/Modify**:
- `web/src/app/business/[id]/admin/hr/onboarding/page.tsx` (NEW)
- `web/src/components/hr/onboarding/OnboardingTemplatesList.tsx` (NEW)
- `web/src/components/hr/onboarding/OnboardingTemplateEditor.tsx` (NEW - can extract from module settings)
- `web/src/components/hr/onboarding/OnboardingTemplatePreview.tsx` (NEW)
- `web/src/components/hr/HRSidebar.tsx` (MODIFY - add "Onboarding Templates" nav item)

---

### Task 2: Employee Onboarding Journey UI Enhancement
**Location**: `web/src/app/business/[id]/workspace/hr/me/page.tsx` (ENHANCE)

**Goal**: Complete the employee self-service onboarding view with full functionality.

**Components to Create/Enhance**:
1. **`EmployeeOnboardingJourneyView.tsx`** - Main journey display
   - Journey header (template name, start date, progress bar)
   - Status badge (In Progress, Completed, Cancelled)
   - Timeline view of tasks
   - Task filtering (All, Pending, In Progress, Completed, Blocked)

2. **`OnboardingTaskCard.tsx`** - Individual task display
   - Task title, description, type icon
   - Status badge
   - Due date display
   - Owner information
   - Action buttons (Start, Complete, Request Help)
   - Document upload button (if `requiresDocument`)
   - Equipment request button (if `taskType === 'EQUIPMENT'`)

3. **`OnboardingDocumentUpload.tsx`** - Document upload interface
   - **INTEGRATION**: Use Drive module's `uploadFile()` API
   - **INTEGRATION**: Store in business Drive folder (use `getOnboardingDocumentLibrary` to get folder)
   - File picker
   - Upload progress
   - Document preview
   - Link to Drive document library
   - Document requirements checklist
   - **Check**: Verify Drive module is installed before showing upload UI

4. **`OnboardingEquipmentRequest.tsx`** - Equipment/uniform request interface
   - Equipment catalog selection
   - Uniform size/color selection
   - Request submission
   - Request status tracking

5. **`OnboardingTaskCompletionModal.tsx`** - Task completion workflow
   - Mark task as complete
   - Add notes/comments
   - Upload documents (if required)
   - Submit for approval (if required)

**Features**:
- View all onboarding journeys
- View journey details with task checklist
- Filter tasks by status
- Complete tasks with notes
- Upload required documents
- Request equipment/uniforms
- Track progress (X of Y tasks completed)
- View task history/timeline

**Integration**:
- Enhance existing `me/page.tsx` onboarding section
- Add "My Onboarding" to HR sidebar (Employee role)
- Use existing API: `getMyOnboardingJourneys`, `completeMyOnboardingTask`
- **Drive Integration**: Use `uploadFile()` from `@/api/drive` for document uploads
- **Calendar Integration**: Show onboarding meetings/training in Calendar (if installed)
- **Chat Integration**: Add "Ask HR" button that opens Chat conversation (if installed)
- **Scheduling Integration**: Show time-off sync status (if Scheduling installed)

**Files to Create/Modify**:
- `web/src/components/hr/onboarding/EmployeeOnboardingJourneyView.tsx` (NEW)
- `web/src/components/hr/onboarding/OnboardingTaskCard.tsx` (NEW)
- `web/src/components/hr/onboarding/OnboardingDocumentUpload.tsx` (NEW)
- `web/src/components/hr/onboarding/OnboardingEquipmentRequest.tsx` (NEW)
- `web/src/components/hr/onboarding/OnboardingTaskCompletionModal.tsx` (NEW)
- `web/src/app/business/[id]/workspace/hr/me/page.tsx` (ENHANCE - replace basic implementation)
- `web/src/components/hr/HRSidebar.tsx` (MODIFY - ensure "My Onboarding" is visible)

---

### Task 3: Manager Onboarding Approval UI Enhancement
**Location**: `web/src/app/business/[id]/workspace/hr/team/page.tsx` (ENHANCE)

**Goal**: Complete the manager view for reviewing and approving team member onboarding tasks.

**Components to Create/Enhance**:
1. **`ManagerOnboardingDashboard.tsx`** - Manager overview
   - Summary stats (pending approvals, active journeys, overdue tasks)
   - Quick filters (All, Pending Approval, Overdue, My Team)
   - Team member list with onboarding status

2. **`TeamOnboardingTaskList.tsx`** - List of tasks requiring manager action
   - Group by employee or by task
   - Task cards with employee info
   - Status indicators
   - Due date warnings
   - Bulk actions (approve multiple)

3. **`OnboardingTaskApprovalModal.tsx`** - Task approval workflow
   - View task details
   - View employee submission (notes, documents)
   - Approve/Reject with comments
   - Request changes/resubmission
   - View task history

4. **`TeamMemberOnboardingStatus.tsx`** - Individual team member onboarding view
   - Employee profile
   - Active journey details
   - Task progress
   - All tasks (completed/pending)
   - Ability to start new journey for employee

**Features**:
- View all pending approvals
- Filter by employee, task type, status
- Approve/reject tasks with comments
- View team member onboarding progress
- Start onboarding journey for direct reports
- View overdue tasks
- Bulk approve tasks
- Export onboarding reports

**Integration**:
- Enhance existing `team/page.tsx` onboarding section
- Use existing API: `getTeamOnboardingTasks`, `completeTeamOnboardingTask`
- Add "Team Onboarding" to HR sidebar (Manager role)
- Link from manager dashboard
- **Chat Integration**: Quick "Message Employee" button using Chat module (if installed)
- **Calendar Integration**: View employee calendar to check availability for onboarding meetings (if installed)
- **Scheduling Integration**: Check employee shift schedule when assigning onboarding tasks (if installed)

**Files to Create/Modify**:
- `web/src/components/hr/onboarding/ManagerOnboardingDashboard.tsx` (NEW)
- `web/src/components/hr/onboarding/TeamOnboardingTaskList.tsx` (NEW)
- `web/src/components/hr/onboarding/OnboardingTaskApprovalModal.tsx` (NEW)
- `web/src/components/hr/onboarding/TeamMemberOnboardingStatus.tsx` (NEW)
- `web/src/app/business/[id]/workspace/hr/team/page.tsx` (ENHANCE - replace basic implementation)
- `web/src/components/hr/HRSidebar.tsx` (MODIFY - ensure "Team Onboarding" is visible)

---

### Task 4: Admin Onboarding Journey Management
**Location**: `web/src/app/business/[id]/admin/hr/onboarding/journeys/page.tsx` (NEW PAGE)

**Goal**: Allow HR admins to view and manage all onboarding journeys across the business.

**Components to Create**:
1. **`AdminOnboardingJourneysList.tsx`** - All journeys view
   - Filter by status, employee, template, date range
   - Journey cards with employee info, progress, status
   - Actions: View details, Start journey, Cancel journey

2. **`AdminOnboardingJourneyDetail.tsx`** - Journey detail view
   - Employee information
   - Template used
   - All tasks with status
   - Timeline view
   - Ability to manually complete tasks
   - Cancel journey option

3. **`StartOnboardingJourneyModal.tsx`** - Start journey for employee
   - Employee selector
   - Template selector
   - Start date picker
   - Custom metadata

**Features**:
- View all onboarding journeys
- Filter/search journeys
- Start journey for any employee
- View journey details
- Manually complete tasks (admin override)
- Cancel journeys
- Export journey data

**Integration**:
- Add "Onboarding Journeys" to HR sidebar (Admin only)
- Use API: `getOnboardingJourneys`, `startOnboardingJourney`
- Link from admin dashboard
- **Drive Integration**: View all onboarding documents in Drive folder
- **Calendar Integration**: See all onboarding events across business calendar (if installed)
- **Scheduling Integration**: Check if employee has shifts scheduled during onboarding period (if installed)

**Files to Create/Modify**:
- `web/src/app/business/[id]/admin/hr/onboarding/journeys/page.tsx` (NEW)
- `web/src/components/hr/onboarding/AdminOnboardingJourneysList.tsx` (NEW)
- `web/src/components/hr/onboarding/AdminOnboardingJourneyDetail.tsx` (NEW)
- `web/src/components/hr/onboarding/StartOnboardingJourneyModal.tsx` (NEW)
- `web/src/components/hr/HRSidebar.tsx` (MODIFY - add "Onboarding Journeys" nav item)
- `web/src/api/hrOnboarding.ts` (CHECK - ensure `startOnboardingJourney` API function exists)

---

### Task 5: HR Sidebar Integration
**Location**: `web/src/components/hr/HRSidebar.tsx` (MODIFY)

**Goal**: Add onboarding navigation items to HR sidebar based on user role.

**Navigation Items to Add**:
- **Admin**:
  - "Onboarding Templates" → `/business/[id]/admin/hr/onboarding`
  - "Onboarding Journeys" → `/business/[id]/admin/hr/onboarding/journeys`
  
- **Manager**:
  - "Team Onboarding" → `/business/[id]/workspace/hr/team?tab=onboarding` (or separate page)
  
- **Employee**:
  - "My Onboarding" → `/business/[id]/workspace/hr/me?tab=onboarding` (or separate page)

**Implementation**:
- Add navigation items to `navItems` array
- Set appropriate `roles` array for each item
- Ensure proper routing

**Files to Modify**:
- `web/src/components/hr/HRSidebar.tsx`

---

### Task 6: Cross-Module Integration Components
**Goal**: Create components that integrate with other modules (Drive, Calendar, Chat, Scheduling).

**Components to Create**:
1. **`OnboardingDriveIntegration.tsx`** - Drive module integration
   - Check if Drive module is installed
   - Get onboarding document folder
   - Upload documents to Drive
   - Link documents to tasks
   - Show document library browser

2. **`OnboardingCalendarIntegration.tsx`** - Calendar module integration
   - Check if Calendar module is installed
   - Create calendar events for onboarding meetings/training
   - Sync task due dates to calendar
   - Show onboarding timeline in calendar view

3. **`OnboardingChatIntegration.tsx`** - Chat module integration
   - Check if Chat module is installed
   - Create HR conversation for onboarding questions
   - Link chat conversations to tasks
   - Show chat notifications for task assignments

4. **`OnboardingSchedulingIntegration.tsx`** - Scheduling module integration
   - Check if Scheduling module is installed (requires HR)
   - Sync time-off requests with Scheduling calendar
   - Check employee availability during onboarding
   - Show scheduling conflicts

**Integration Utilities**:
- `useModuleIntegration.ts` - Hook to check module availability
- `getOnboardingDriveFolder()` - Get/create onboarding folder in Drive
- `createOnboardingCalendarEvent()` - Create calendar event for task
- `startOnboardingChat()` - Start HR conversation

**Files to Create**:
- `web/src/components/hr/onboarding/integrations/OnboardingDriveIntegration.tsx`
- `web/src/components/hr/onboarding/integrations/OnboardingCalendarIntegration.tsx`
- `web/src/components/hr/onboarding/integrations/OnboardingChatIntegration.tsx`
- `web/src/components/hr/onboarding/integrations/OnboardingSchedulingIntegration.tsx`
- `web/src/hooks/useModuleIntegration.ts`
- `web/src/utils/onboardingIntegrations.ts`

---

### Task 7: Shared Components & Utilities
**Goal**: Create reusable components and utilities for onboarding UI.

**Components to Create**:
1. **`OnboardingTaskStatusBadge.tsx`** - Status badge component
   - PENDING (gray)
   - IN_PROGRESS (blue)
   - BLOCKED (red)
   - COMPLETED (green)
   - CANCELLED (gray)

2. **`OnboardingTaskTypeIcon.tsx`** - Task type icon component
   - DOCUMENT (FileIcon)
   - EQUIPMENT (Package)
   - TRAINING (GraduationCap)
   - MEETING (Calendar)
   - FORM (Clipboard)
   - CUSTOM (CheckSquare)

3. **`OnboardingProgressBar.tsx`** - Progress indicator
   - Visual progress bar
   - Percentage display
   - Task count (X of Y)

4. **`OnboardingTimeline.tsx`** - Timeline view of tasks
   - Vertical timeline
   - Task milestones
   - Due dates
   - Completion dates

5. **`useOnboardingJourney.ts`** - Custom hook
   - Fetch journey data
   - Handle task completion
   - Handle task approval
   - Loading/error states

**Files to Create**:
- `web/src/components/hr/onboarding/OnboardingTaskStatusBadge.tsx`
- `web/src/components/hr/onboarding/OnboardingTaskTypeIcon.tsx`
- `web/src/components/hr/onboarding/OnboardingProgressBar.tsx`
- `web/src/components/hr/onboarding/OnboardingTimeline.tsx`
- `web/src/hooks/useOnboardingJourney.ts`

---

## 🎨 Design & UX Guidelines

### Visual Design
- **Consistent with HR module**: Use existing HR sidebar, card styles, color scheme
- **Task status colors**: Follow standard status color conventions
- **Progress indicators**: Clear visual feedback for completion status
- **Responsive design**: Mobile-friendly layouts

### User Experience
- **Clear navigation**: Easy access from HR sidebar
- **Contextual actions**: Actions available where they make sense
- **Feedback**: Toast notifications for all actions (success/error)
- **Loading states**: Spinners/skeletons during data fetching
- **Empty states**: Helpful messages when no data exists

### Accessibility
- **Keyboard navigation**: All interactive elements keyboard accessible
- **Screen reader support**: Proper ARIA labels
- **Color contrast**: Meet WCAG AA standards
- **Focus indicators**: Clear focus states

---

## 🔗 API Integration

### Cross-Module API Functions

**Drive Module** (`@/api/drive`):
- ✅ `uploadFile(token, file, folderId?, isChatFile?, dashboardId?)` - Upload documents
- ✅ `listFiles(token, folderId?, starred?)` - List documents
- ✅ `getOnboardingDocumentLibrary(businessId)` - Get onboarding folder (from HR API)

**Calendar Module** (`@/api/calendar`):
- ✅ `calendarAPI.createEvent(eventData)` - Create calendar events
- ✅ `calendarAPI.listEvents(params)` - List events
- ✅ `calendarAPI.listCalendars(params)` - List calendars

**Chat Module** (`@/contexts/ChatContext`):
- ✅ `useChat()` hook - Access chat functionality
- ✅ `createConversation(type, participantIds, name?)` - Create conversations
- ✅ `sendMessage(content, fileIds?, replyToId?, threadId?)` - Send messages

**Scheduling Module** (if installed):
- ⚠️ Check if Scheduling module is installed before using
- ⚠️ Time-off sync is handled by backend (`hrScheduleService.ts`)
- ⚠️ Frontend should check module availability before showing scheduling features

### Existing API Functions (from `hrOnboarding.ts`)
All required API functions already exist:
- ✅ `listOnboardingTemplates(businessId)`
- ✅ `createOnboardingTemplate(businessId, payload)`
- ✅ `updateOnboardingTemplate(businessId, templateId, payload)`
- ✅ `archiveOnboardingTemplate(businessId, templateId)`
- ✅ `getMyOnboardingJourneys(businessId)`
- ✅ `completeMyOnboardingTask(businessId, taskId, payload)`
- ✅ `getTeamOnboardingTasks(businessId)`
- ✅ `completeTeamOnboardingTask(businessId, taskId, payload)`
- ✅ `getOnboardingDocumentLibrary(businessId)`

### API Functions to Verify/Create
- ⚠️ `getOnboardingJourneys(businessId)` - Admin endpoint (verify exists)
- ⚠️ `startOnboardingJourney(businessId, payload)` - Admin endpoint (verify exists)

**Action**: Check `server/src/routes/hr.ts` and `server/src/controllers/hrController.ts` to confirm these endpoints exist. If not, add them.

---

## 📁 File Structure

```
web/src/
├── app/business/[id]/
│   ├── admin/hr/
│   │   └── onboarding/
│   │       ├── page.tsx (NEW - Template Management)
│   │       └── journeys/
│   │           └── page.tsx (NEW - Journey Management)
│   └── workspace/hr/
│       ├── me/page.tsx (ENHANCE - Employee Onboarding)
│       └── team/page.tsx (ENHANCE - Manager Onboarding)
├── components/hr/
│   ├── onboarding/ (NEW DIRECTORY)
│   │   ├── OnboardingTemplatesList.tsx
│   │   ├── OnboardingTemplateEditor.tsx
│   │   ├── OnboardingTemplatePreview.tsx
│   │   ├── EmployeeOnboardingJourneyView.tsx
│   │   ├── OnboardingTaskCard.tsx
│   │   ├── OnboardingDocumentUpload.tsx
│   │   ├── OnboardingEquipmentRequest.tsx
│   │   ├── OnboardingTaskCompletionModal.tsx
│   │   ├── ManagerOnboardingDashboard.tsx
│   │   ├── TeamOnboardingTaskList.tsx
│   │   ├── OnboardingTaskApprovalModal.tsx
│   │   ├── TeamMemberOnboardingStatus.tsx
│   │   ├── AdminOnboardingJourneysList.tsx
│   │   ├── AdminOnboardingJourneyDetail.tsx
│   │   ├── StartOnboardingJourneyModal.tsx
│   │   ├── OnboardingTaskStatusBadge.tsx
│   │   ├── OnboardingTaskTypeIcon.tsx
│   │   ├── OnboardingProgressBar.tsx
│   │   └── OnboardingTimeline.tsx
│   └── HRSidebar.tsx (MODIFY)
└── hooks/
    └── useOnboardingJourney.ts (NEW)
```

---

## ✅ Acceptance Criteria

### Template Management
- [ ] Admin can create new onboarding templates
- [ ] Admin can edit existing templates
- [ ] Admin can archive templates
- [ ] Admin can set default template
- [ ] Admin can preview template
- [ ] Template editor supports drag-and-drop task ordering
- [ ] All template fields are editable

### Employee Journey View
- [ ] Employee can view all their onboarding journeys
- [ ] Employee can see journey progress (X of Y tasks)
- [ ] Employee can view task checklist
- [ ] Employee can complete tasks
- [ ] Employee can upload required documents
- [ ] Employee can request equipment/uniforms
- [ ] Employee can see task due dates
- [ ] Employee can filter tasks by status

### Manager Approval View
- [ ] Manager can view all pending approvals
- [ ] Manager can filter by employee, status, task type
- [ ] Manager can approve/reject tasks with comments
- [ ] Manager can view team member onboarding status
- [ ] Manager can see overdue tasks
- [ ] Manager can start onboarding journey for direct reports

### Admin Journey Management
- [ ] Admin can view all onboarding journeys
- [ ] Admin can filter/search journeys
- [ ] Admin can start journey for any employee
- [ ] Admin can view journey details
- [ ] Admin can manually complete tasks (override)
- [ ] Admin can cancel journeys

### Integration
- [ ] All onboarding pages accessible from HR sidebar
- [ ] Navigation items show based on user role
- [ ] All pages use HRPageLayout for consistent sidebar
- [ ] Toast notifications for all actions
- [ ] Loading states during API calls
- [ ] Error handling with user-friendly messages
- [ ] **Drive Integration**: Documents uploaded via Drive API
- [ ] **Drive Integration**: Documents stored in business Drive folder
- [ ] **Calendar Integration**: Onboarding events appear in Calendar (if installed)
- [ ] **Chat Integration**: HR conversations available (if installed)
- [ ] **Scheduling Integration**: Time-off syncs with Scheduling (if installed)
- [ ] **Module Detection**: All features check module availability before showing
- [ ] **Graceful Degradation**: Features work without optional modules

---

## 🚀 Implementation Order

### Week 1: Foundation & Employee View
1. **Day 1-2**: Shared components (badges, icons, progress bar, timeline)
2. **Day 3-4**: Employee onboarding journey view (enhance existing)
3. **Day 5**: Document upload & equipment request components

### Week 2: Manager & Admin Views
1. **Day 1-2**: Manager onboarding approval UI (enhance existing)
2. **Day 3-4**: Admin template management & journey management
3. **Day 5**: Sidebar integration, testing, polish

---

## 📝 Notes

### Module Integration
- **Reuse existing code**: The `OnboardingModuleSettings.tsx` has a good template editor that can be extracted/reused
- **Drive integration**: Document uploads MUST use Drive API (`uploadFile()` from `@/api/drive`)
- **Calendar integration**: Onboarding meetings/training should create Calendar events (if Calendar installed)
- **Chat integration**: Enable HR conversations for onboarding questions (if Chat installed)
- **Scheduling integration**: Time-off requests sync with Scheduling (if Scheduling installed)
- **Module dependencies**: Scheduling requires HR, but HR is standalone
- **Module detection**: Always check module availability before showing integration features
- **Graceful degradation**: Features should work without optional modules (Drive, Calendar, Chat)

### Technical Requirements
- **API verification**: Verify admin endpoints exist before starting implementation
- **Role-based access**: Ensure all pages respect user roles (Admin/Manager/Employee)
- **Multi-tenant**: All queries must be scoped by `businessId`
- **Error handling**: Comprehensive error handling with user-friendly messages
- **Performance**: Consider pagination for large lists (templates, journeys, tasks)
- **Module checks**: Use `useModuleFeatures()` hook to check module availability
- **Conditional rendering**: Show integration features only if modules are installed

### Integration Patterns
```typescript
// Example: Document upload with Drive integration
import { uploadFile } from '@/api/drive';
import { useModuleFeatures } from '@/hooks/useFeatureGating';

const { hasModule: hasDrive } = useModuleFeatures('drive', businessId);

if (hasDrive) {
  const file = await uploadFile(token, fileData, folderId, false, dashboardId);
  // Link file to onboarding task
} else {
  // Show alternative or disable feature
}
```

---

**Last Updated**: January 2025  
**Next Steps**: Review plan, get approval, begin implementation

