> **Status:** Historical / deprecated — **not** current product, architecture, or authorization authority.
> **Archived:** 2026-09-04 (Memory Bank Batch 1C-4A)
> Do not use this document as living guidance. Prefer current Memory Bank ProductContexts, `docs/architecture/`, and domain status records.

---

# HR Module Enhancement Plan

**Date**: January 2025  
**Status**: In Progress - Priority 1 & 2 Complete  
**Focus**: Complete HR module missing features and polish existing functionality

**Completion Status**:
- ✅ **Priority 1: Analytics & Notifications** - COMPLETE (January 2025)
- ✅ **Priority 2: Onboarding Frontend Completion** - COMPLETE (January 2025)
- 🚧 **Priority 3: Shift Scheduling & Templates** - Next
- ⏳ **Priority 4: Geolocation & Advanced Attendance** - Pending
- ⏳ **Priority 5: Template Seeding & Best Practices** - Pending

---

## 🎯 Overview

The HR module has a solid foundation with core features implemented, but several important features are missing or incomplete. This plan outlines the work needed to bring the HR module to production-ready status.

---

## ✅ Current Status (What's Complete)

### Framework & Infrastructure
- ✅ Database schema (core, attendance, onboarding models)
- ✅ API routes structure (admin/team/me tiers)
- ✅ Permission system (three-tier access control)
- ✅ Feature gating (Business Advanced vs Enterprise)
- ✅ Frontend pages (admin, employee, manager views)
- ✅ AI context integration (3 providers)

### Core Features Implemented
- ✅ Employee directory and profiles
- ✅ Employee CRUD operations with validation
- ✅ CSV import/export
- ✅ Time-off management (request/approve/cancel workflow)
- ✅ Time-off calendar synchronization
- ✅ Attendance policies management
- ✅ Clock in/out functionality (web-based)
- ✅ Attendance exception workflow (manager resolution)
- ✅ Onboarding backend service (templates, journeys, tasks)
- ✅ Audit logging

---

## 🔄 Missing Features & Incomplete Work

### Priority 1: Analytics & Notifications (High Priority)

**Status**: ✅ **COMPLETE** - Analytics dashboards and notification hooks fully implemented  
**Impact**: Users can now see progress and get notified of important events

#### Analytics Implemented:
- [x] **Onboarding Progress Dashboard** ✅
  - Overall completion rates with percentage display
  - Average time to complete (in days)
  - Tasks by status breakdown
  - Department/position analytics with completion rates
  - Journey trends (started/completed over time)
  - Location: `/business/[id]/admin/hr/analytics` (Onboarding tab)
  - Files: `server/src/services/hrAnalyticsService.ts`, `web/src/components/hr/analytics/OnboardingAnalyticsDashboard.tsx`

- [x] **Attendance Analytics Dashboard** ✅
  - Daily attendance trends (clocked in/out, exceptions)
  - Exception patterns by type and status
  - Policy compliance metrics
  - Overview cards (total employees, active today, clocked in now, open exceptions)
  - Location: `/business/[id]/admin/hr/analytics` (Attendance tab)
  - Files: `server/src/services/hrAnalyticsService.ts`, `web/src/components/hr/analytics/AttendanceAnalyticsDashboard.tsx`

- [x] **Time-Off Analytics** ✅
  - Usage by type (PTO, Sick, Personal, etc.) with days used
  - Usage by department with employee counts
  - Approval time metrics (average approval time, pending overdue)
  - Request status breakdown (approved/pending/denied percentages)
  - Location: `/business/[id]/admin/hr/analytics` (Time-Off tab)
  - Files: `server/src/services/hrAnalyticsService.ts`, `web/src/components/hr/analytics/TimeOffAnalyticsDashboard.tsx`

#### Notifications Implemented:
- [x] **Onboarding Notifications** ✅
  - `hr_onboarding_task_approved` - Notifies employee when task approved by manager
  - `hr_onboarding_task_pending_approval` - Notifies manager when task needs approval
  - `hr_onboarding_journey_completed` - Notifies employee when all tasks completed
  - Location: `server/src/services/hrOnboardingService.ts` (in `completeOnboardingTask` function)
  - Integration: Global notification center with HR category

- [x] **Time-Off Notifications** ✅
  - `hr_time_off_request_submitted` - Notifies manager when request submitted
  - `hr_time_off_request_approved` - Notifies employee when approved
  - `hr_time_off_request_denied` - Notifies employee when denied
  - `hr_time_off_balance_low` - Warns employee when PTO balance ≤ 3 days
  - Location: `server/src/controllers/hrController.ts` (in `requestTimeOff` and `approveTeamTimeOff` functions)
  - Integration: Global notification center with HR category

- [x] **Attendance Notifications** ✅
  - `hr_attendance_exception_resolved` - Notifies employee when exception resolved by manager
  - Location: `server/src/services/hrAttendanceService.ts` (in `resolveAttendanceException` function)
  - Integration: Global notification center with HR category
  - Note: Exception creation notifications need to be added where exceptions are created (background jobs/policy enforcement)

**Implementation Details**:
- ✅ Leveraged existing `NotificationService` for in-app notifications
- ✅ Integrated with global notification center (`/notifications`)
- ✅ Added HR category with `UserCheck` icon
- ✅ Real-time WebSocket updates via existing notification socket
- ✅ Email/push notifications via existing services
- ✅ Developer rules added to `.cursor/rules/module-development.mdc` and `.cursor/rules/coding-standards.mdc`
- ✅ Naming convention: `[module]_[event]` format enforced
- ⏳ Slack webhook support (future enhancement)
- ⏳ Notification preference settings in HR module settings (future enhancement)

---

### Priority 2: Onboarding Frontend Completion (High Priority)

**Status**: ✅ **COMPLETE** - Full onboarding UI with templates, journeys, and cross-module integration  
**Impact**: Users can now fully use onboarding features

#### Frontend Components Implemented:
- [x] **Onboarding Template Management UI** ✅
  - Template list page with inline editing
  - Task template editor with sequence management
  - Template archive functionality
  - Template preview capabilities
  - Location: `/business/[id]/admin/hr/onboarding/templates`
  - Files: `web/src/app/business/[id]/admin/hr/onboarding/templates/page.tsx`, `web/src/components/hr/onboarding/TemplateEditor.tsx`

- [x] **Employee Onboarding Journey UI** ✅
  - Journey status view with progress bars
  - Task checklist with status badges and icons
  - Form task component for dynamic form rendering (`OnboardingFormTask.tsx`)
  - Document upload interface (Drive integration)
  - Equipment/uniform request component
  - Calendar integration for meetings/training
  - Chat integration for HR questions
  - Location: `/business/[id]/workspace/hr/me`
  - Files: `web/src/components/hr/onboarding/EmployeeOnboardingJourneyView.tsx`, `web/src/components/hr/onboarding/OnboardingTaskCard.tsx`

- [x] **Manager Onboarding Approval UI** ✅
  - Pending approvals dashboard (`ManagerOnboardingDashboard.tsx`)
  - Task approval workflow (`OnboardingTaskApprovalModal.tsx`)
  - Team onboarding task list (`TeamOnboardingTaskList.tsx`)
  - Direct report onboarding status
  - Chat integration for employee communication
  - Location: `/business/[id]/workspace/hr/team`
  - Files: `web/src/components/hr/onboarding/ManagerOnboardingDashboard.tsx`, `web/src/components/hr/onboarding/TeamOnboardingTaskList.tsx`

- [x] **Admin Onboarding Journey Management** ✅
  - Journey list page with filtering
  - Start new journey modal (`StartOnboardingJourneyModal.tsx`)
  - Journey progress tracking
  - Status filtering (all, in progress, completed, cancelled)
  - Location: `/business/[id]/admin/hr/onboarding/journeys`
  - Files: `web/src/app/business/[id]/admin/hr/onboarding/journeys/page.tsx`

- [x] **Onboarding Analytics UI** ✅ (see Priority 1)

**Cross-Module Integration**:
- ✅ **Drive Integration**: Document uploads stored in business Drive folders
  - Component: `OnboardingDriveIntegration.tsx`
  - Uses Drive API for file uploads
  - Automatic folder creation for onboarding documents
- ✅ **Calendar Integration**: Meetings and training sync to calendar
  - Component: `OnboardingCalendarIntegration.tsx`
  - Creates events for MEETING and TRAINING task types
  - Auto-provisions calendar if needed
- ✅ **Chat Integration**: HR conversations and notifications
  - Component: `OnboardingChatIntegration.tsx`
  - Initiates conversations with HR or specific employees
  - Auto-loads HR admin user ID
- ✅ **Scheduling Integration**: Availability checks and time-off sync
  - Component: `OnboardingSchedulingIntegration.tsx`
  - Shows scheduling sync status
  - Note: Scheduling module requires HR module (dependency enforced)

**Implementation Details**:
- ✅ Backend service: `server/src/services/hrOnboardingService.ts`
- ✅ Routes: Registered in `server/src/routes/hr.ts`
- ✅ React components: 20+ new components for onboarding UI
- ✅ Integration: Full integration with existing HR workspace layout (`HRPageLayout`, `HRSidebar`)
- ✅ Form handling: Dynamic form rendering based on task metadata
- ✅ Document storage: Form data and uploaded documents stored in task metadata

---

### Priority 3: Shift Scheduling & Templates (Medium Priority)

**Status**: Backend partial, UI missing  
**Impact**: Can't manage shift schedules for attendance tracking

#### Missing Features:
- [ ] **Shift Template Management**
  - Create/edit shift templates
  - Default shift times
  - Recurring shift patterns
  - Location: Admin HR attendance settings

- [ ] **Shift Assignment UI**
  - Assign shifts to employees
  - Bulk assignment tools
  - Shift calendar view
  - Location: Admin/Manager HR workspace

- [ ] **Shift Coverage Analysis**
  - Coverage gaps detection
  - Suggested assignments
  - Location: Manager HR workspace

**Implementation Notes**:
- Schema exists: `AttendanceShiftTemplate`, `AttendanceShiftAssignment`
- Backend service needs shift assignment methods
- Integrate with Scheduling module (future: sync shifts between modules)
- UI should mirror Scheduling module's shift builder (for consistency)

---

### Priority 4: Geolocation & Advanced Attendance (Medium Priority)

**Status**: Backend partial, UI missing  
**Impact**: Enterprise feature incomplete

#### Missing Features:
- [ ] **Geolocation Enforcement UI**
  - Geofence radius configuration
  - Location validation on clock-in
  - Violation handling UI
  - Location: Enterprise attendance settings

- [ ] **Variance Calculation & Display**
  - Show variance from expected time
  - Variance trend analytics
  - Exception auto-generation for large variances
  - Location: Attendance records view

- [ ] **Advanced Attendance Policies**
  - Multi-location policies
  - Time-based policy rules
  - Department-specific policies
  - Location: Admin attendance settings

**Implementation Notes**:
- Backend has geolocation support in `hrAttendanceService.ts`
- Need to add geofence validation on clock-in
- Add variance calculation to punch records
- Enterprise tier only (feature gating required)

---

### Priority 5: Template Seeding & Best Practices (Low Priority)

**Status**: Not implemented  
**Impact**: Users start from scratch, slower adoption

#### Missing Features:
- [ ] **Default Onboarding Templates**
  - Industry-specific templates (retail, tech, healthcare, etc.)
  - Role-specific templates (manager, employee, contractor)
  - Tier-based templates (Business Advanced vs Enterprise)
  - Location: Module settings or admin onboarding page

- [ ] **Best Practices Documentation**
  - Onboarding guide
  - Template examples
  - Integration guides
  - Location: Help center or module documentation

**Implementation Notes**:
- Create seed script: `server/src/scripts/seedOnboardingTemplates.ts`
- Store templates in database (marked as `isDefault: true`)
- Allow businesses to customize default templates
- Add template marketplace (future enhancement)

---

### Priority 6: Enterprise Features (Future)

**Status**: Not started  
**Impact**: Enterprise tier value incomplete

#### Missing Enterprise Features:
- [ ] **Payroll Processing**
  - Pay run creation
  - Pay stub generation
  - Tax calculations
  - Direct deposit management
  - Location: Enterprise HR admin

- [ ] **Recruitment & ATS**
  - Job posting management
  - Applicant tracking
  - Interview scheduling
  - Offer letter generation
  - Location: Enterprise HR admin

- [ ] **Performance Management**
  - Review cycles
  - Goal setting (OKRs)
  - 360-degree feedback
  - Performance analytics
  - Location: Enterprise HR admin

- [ ] **Benefits Administration**
  - Benefits enrollment
  - Plan management
  - COBRA administration
  - Open enrollment workflows
  - Location: Enterprise HR admin

**Implementation Notes**:
- These are major features requiring separate planning
- Should be implemented after core features are complete
- Each feature needs its own database schema, services, and UI

---

## 📋 Implementation Plan

### Phase 1: Analytics & Notifications (Week 1-2)
**Goal**: Complete analytics dashboards and notification system

**Tasks**:
1. Create onboarding analytics dashboard component
2. Create attendance analytics dashboard component
3. Create time-off analytics dashboard component
4. Integrate notification hooks in onboarding service
5. Integrate notification hooks in time-off service
6. Integrate notification hooks in attendance service
7. Add notification preferences to HR module settings
8. Test notification delivery (email, in-app)

**Deliverables**:
- 3 analytics dashboard components
- Notification integration in 3 services
- Notification preferences UI
- Documentation

---

### Phase 2: Onboarding Frontend (Week 3-4)
**Goal**: Complete onboarding UI for all user roles

**Tasks**:
1. Build onboarding template management UI (admin)
2. Build employee onboarding journey UI
3. Build manager onboarding approval UI
4. Integrate with existing HR workspace layout
5. Add document upload interface
6. Add equipment/uniform request interface
7. Test end-to-end onboarding workflow

**Deliverables**:
- 3 major UI components (template management, employee view, manager view)
- Integration with HR workspace
- End-to-end workflow tested

---

### Phase 3: Shift Scheduling (Week 5-6)
**Goal**: Complete shift template and assignment features

**Tasks**:
1. Build shift template management UI
2. Build shift assignment UI
3. Add shift calendar view
4. Add coverage analysis tools
5. Integrate with attendance policies
6. Test shift assignment workflow

**Deliverables**:
- Shift template management UI
- Shift assignment UI
- Coverage analysis tools
- Integration with attendance system

---

### Phase 4: Advanced Attendance Features (Week 7-8)
**Goal**: Complete geolocation and advanced attendance features

**Tasks**:
1. Build geolocation enforcement UI
2. Add geofence validation on clock-in
3. Build variance calculation and display
4. Add advanced policy configuration UI
5. Test geolocation features
6. Test variance calculations

**Deliverables**:
- Geolocation enforcement UI
- Variance calculation system
- Advanced policy configuration
- Enterprise feature gating

---

### Phase 5: Polish & Optimization (Week 9-10)
**Goal**: Polish existing features and optimize performance

**Tasks**:
1. Template seeding script
2. Best practices documentation
3. Performance optimization
4. UI/UX improvements
5. Accessibility audit
6. Mobile responsiveness
7. End-to-end testing

**Deliverables**:
- Template seeding system
- Documentation
- Performance improvements
- Accessibility improvements

---

## 🎯 Success Metrics

### Phase 1 Metrics:
- [ ] 3 analytics dashboards functional
- [ ] Notifications delivered within 5 seconds
- [ ] 100% notification delivery rate

### Phase 2 Metrics:
- [ ] Onboarding completion rate > 80%
- [ ] Average onboarding time < 7 days
- [ ] Manager approval time < 24 hours

### Phase 3 Metrics:
- [ ] Shift assignment time < 5 minutes
- [ ] Coverage accuracy > 95%
- [ ] Shift template reuse rate > 60%

### Phase 4 Metrics:
- [ ] Geolocation accuracy > 99%
- [ ] Variance detection accuracy > 95%
- [ ] Enterprise feature adoption > 40%

### Overall Metrics:
- [ ] HR module adoption rate > 70% (Business Advanced+)
- [ ] User satisfaction score > 4.5/5
- [ ] Feature completion rate > 90%

---

## 🔗 Related Files

### Backend Services:
- `server/src/services/hrOnboardingService.ts` - Onboarding logic
- `server/src/services/hrAttendanceService.ts` - Attendance logic
- `server/src/services/hrScheduleService.ts` - Calendar sync
- `server/src/services/notificationService.ts` - Notifications
- `server/src/services/emailNotificationService.ts` - Email notifications

### Frontend Components:
- `web/src/app/business/[id]/admin/hr/page.tsx` - Admin dashboard
- `web/src/app/business/[id]/workspace/hr/me/page.tsx` - Employee view
- `web/src/app/business/[id]/workspace/hr/team/page.tsx` - Manager view
- `web/src/hooks/useHRFeatures.ts` - Feature detection

### Database:
- `prisma/modules/hr/core.prisma` - Core models
- `prisma/modules/hr/attendance.prisma` - Attendance models
- `prisma/modules/hr/onboarding.prisma` - Onboarding models

---

## 📝 Notes

- All features must maintain multi-tenant isolation (businessId scoping)
- Enterprise features require proper feature gating
- Notifications should respect user preferences
- Analytics should be performant (consider caching)
- UI should match existing HR module design patterns
- Follow coding standards in `.cursor/rules/coding-standards.mdc`

---

**Last Updated**: January 2025  
**Next Review**: After Phase 1 completion

