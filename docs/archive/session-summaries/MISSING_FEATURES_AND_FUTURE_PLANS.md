> **Status:** Historical / deprecated — **not** current product, architecture, or authorization authority.
> **Archived:** 2026-09-04 (Memory Bank Batch 1C-4A)
> Do not use this document as living guidance. Prefer current Memory Bank ProductContexts, `docs/architecture/`, and domain status records.

---

# Missing Features & Future Plans Analysis

**Date**: January 2025  
**Status**: Comprehensive Review Complete - **VERIFIED WITH CODEBASE**  
**Purpose**: Identify all missing features and future plans that need implementation

**Verification Method**: Cross-referenced memory bank documentation with actual codebase implementation

---

## 🎯 Quick Status Overview

### ✅ Completed Major Modules
- To-Do Module (Phases 0-5.2) - Complete
- HR Module (Phases 1-2) - Production deployed
- Scheduling Module - Fully functional
- Chat Module - Core features complete
- Drive Module - Core features complete
- Calendar Module (Phases 1-2) - Complete
- Admin Portal - Rebuild complete, testing in progress
- Analytics - ✅ Implemented (Admin, Personal, Business, Chat)
- Notifications - ✅ Implemented (Complete system with real-time updates)
- Marketplace - ✅ UI implemented (Backend complete)
- Dashboard Widgets - ✅ Drag-and-drop system implemented
- Global Search - ✅ Fully implemented

### ⏸️ Paused/In Progress
- Admin Portal E2E Tests - Unit/Integration complete, E2E tests pending
- Console Migration (Phase 2) - Rolled back, deferred

---

## 📦 Modules

### Admin Portal

#### ✅ Implemented Features
- User management (complete CRUD operations)
- Content moderation system
- Impersonation functionality
- Analytics dashboard (`web/src/app/admin-portal/analytics/page.tsx`)
- Billing management (`web/src/app/admin-portal/billing/page.tsx`)
- Support ticket system
- Security monitoring

#### ⏸️ Missing Features
- **E2E Tests** (Priority 1.1 - PAUSED)
  - **Status**: Unit and Integration tests complete (64 tests), **Admin Portal E2E tests specifically missing**
  - **Verified**: E2E tests exist for Drive, Chat, and Auth modules (`tests/e2e/`), but NOT for admin portal
  - **Missing**: E2E tests with Playwright specifically for admin portal workflows and security
  - **Location**: `memory-bank/progress.md` (lines 4-34)
  - **Code Verification**: 
    - ✅ E2E tests exist: `tests/e2e/drive/`, `tests/e2e/chat/`, `tests/e2e/auth.spec.ts`
    - ❌ No admin portal E2E tests found

#### 🔮 Future Features
- **Location**: `memory-bank/adminPortalFutureFeaturesPlan.md`
- Advanced analytics dashboards
- Enhanced user management tools
- Advanced security monitoring
- Custom reporting capabilities

---

### Analytics Module

#### ✅ Implemented Features
- **Admin Portal Analytics**: `web/src/app/admin-portal/analytics/page.tsx` (user growth, revenue, engagement, system metrics)
- **Personal Analytics**: `web/src/app/profile/analytics/page.tsx` (user activity tracking)
- **Business Analytics**: `web/src/app/business/[id]/workspace/analytics/page.tsx` (business metrics)
- **Chat Analytics**: `web/src/components/ChatAnalytics.tsx` (chat module analytics)
- **Backend Controller**: `server/src/controllers/analyticsController.ts`

#### ⚠️ Potentially Missing
- Custom reports and advanced filtering (per `analyticsProductContext.md`)
- Export/import functionality (CSV, PDF)
- Analytics widgets for dashboard integration
- More user-facing analytics dashboards

#### 🔮 Future Features
- Advanced filtering and boolean search operators
- Search analytics
- Performance optimization (intelligent caching, indexing)
- User experience enhancements (keyboard shortcuts, mobile optimization)

---

### Billing & Payment System

#### ✅ Implemented Features
- **Database Schema**: `prisma/modules/billing/subscriptions.prisma` (Subscription, ModuleSubscription, UsageRecord, Invoice models)
- **Stripe Integration**: `server/src/services/stripeService.ts`, `server/src/services/paymentService.ts`
- **Subscription Services**: `server/src/services/subscriptionService.ts`, `server/src/services/moduleSubscriptionService.ts`
- **Backend Controllers**: `server/src/controllers/billingController.ts` (full CRUD operations)
- **Backend Routes**: `server/src/routes/billing.ts` (all endpoints registered)
- **Frontend UI**: `web/src/components/BillingModal.tsx`, `web/src/app/admin-portal/billing/page.tsx`
- **Business Billing**: Integrated in business admin page

#### ⚠️ Potentially Missing (Phase 4.4)
- **Location**: `memory-bank/phase4-payment-tier-plans.md`
- Usage tracking UI enhancements
- Advanced analytics dashboards
- Enterprise custom pricing workflows
- Payment method management UI
- Invoice generation and download
- Automated billing workflows

#### Implementation Status
1. **Phase 4.1**: ✅ Foundation - Database, Stripe, basic subscriptions **COMPLETE**
2. **Phase 4.2**: ✅ Standard Tier - Backend and UI exist, may need verification
3. **Phase 4.3**: ⚠️ Enterprise Tier - Backend exists, may need UI enhancements
4. **Phase 4.4**: ⚠️ Advanced Features - May be missing analytics and automation

---

### Calendar Module

#### ✅ Implemented Features
- Phase 1 (Core + Tabs binding) - Complete
- Phase 2 (Recurrence + Sharing) - Complete
  - RRULE/EXDATE with exceptions
  - Calendar sharing
  - Attendees/RSVP
  - ICS Import/Export
  - Real-time collaboration
  - RSVP UI improvements

#### ⏳ Missing Features

**Phase 3: Availability + Assistant (Next Priority)**
- **Status**: Planned, not started
- **Missing**:
  - Free-busy checking
  - Multi-user availability
  - Scheduling suggestions
  - Working hours/focus/OOO settings
  - Travel time calculation
- **Location**: `memory-bank/calendarProductContext.md` (line 50)

**Phase 4: Integrations + Booking (Planned)**
- **Status**: Planned, not started
- **Missing**:
  - Google/Microsoft sync (OAuth, webhooks)
  - ICS subscriptions
  - Booking links
  - Resource calendars
- **Location**: `memory-bank/calendarProductContext.md` (line 52)

**Phase 5: AI, Analytics, Polish (Planned)**
- **Status**: Planned, not started
- **Missing**:
  - Natural language event creation
  - Conflict hints
  - Year analytics/heatmap
  - Print/export functionality
  - Mobile polish
- **Location**: `memory-bank/calendarProductContext.md` (line 54)

#### 🏢 Enterprise Enhancements (Planned)
- **Location**: `memory-bank/enterpriseModuleStrategy.md`
- Resource booking (conference rooms, equipment)
- Advanced scheduling (AI-powered suggestions, cross-timezone)
- Enterprise integrations (Google Workspace/Office 365, Zoom/Teams)
- Compliance & audit (attendance tracking, recording policies)

---

### Chat Module

#### ✅ Implemented Features
- Core messaging and threading
- Real-time updates via WebSocket
- File sharing integration
- Reactions and read receipts
- Message editing and deletion
- Enterprise features (classification, governance, retention, moderation)
- Global floating chat with dashboard tabs

#### 🔄 Partial Features
- **Status**: Core complete, some features partial
- **Missing**:
  - Complete accessibility (keyboard navigation, screen reader support)
  - Mobile/PWA optimization (responsive layout started)
  - Enhanced file preview functionality
  - Real-time notification delivery via WebSocket
- **Location**: `memory-bank/chatProductContext.md` (lines 109-194)

#### 🏢 Enterprise Enhancements (Planned)
- **Location**: `memory-bank/enterpriseModuleStrategy.md`
- Message retention & archiving
- Compliance & moderation (AI-powered filtering)
- Advanced security (E2E encryption, message signing)
- Analytics & insights (communication patterns, productivity)

#### 🔮 Future Features
- ChatWidget Enhancement: Household chat channels
- Educational Module integration
- Enhanced mobile experience

---

### Dashboard Module

#### ✅ Implemented Features
- Global navigation and layout (`web/src/app/dashboard/DashboardLayout.tsx`)
- Responsive design (mobile/tablet support)
- Sidebar customization (collapsible, reorderable modules)
- **Widget System**: Drag-and-drop widget system (`web/src/app/dashboard/DashboardClient.tsx`)
- Widget persistence and management

#### 🔄 Partial Features
- Basic widget support, needs more module types
- Basic real-time updates, needs more module integration
- Basic accessibility support, needs more testing
- Drive and Chat integrated, more modules coming

#### 🔮 Future Features
- **Location**: `memory-bank/futureIdeas.md`
- Advanced block customization (resize, content selection)
- Multiple/savable dashboard layouts per context
- Cross-context data visualization widgets
- AI-powered recommendations for modules and dashboard layouts
- Widget expansion for all completed modules

#### 🏢 Enterprise Enhancements (Planned)
- **Location**: `memory-bank/enterpriseModuleStrategy.md`
- Custom widget builder
- Advanced analytics (real-time BI, predictive analytics)
- AI-powered insights (pattern recognition, anomaly detection)
- Compliance dashboard (real-time monitoring, risk assessment)

---

### Drive/File Hub Module

#### ✅ Implemented Features
- Complete file/folder CRUD operations
- Sharing and permissions (files AND folders)
- Share links with ShareLinkModal
- File previews and details panel
- Search functionality
- Activity log
- Real-time updates (basic socket integration)
- Drag-and-drop (files to folders, trash)
- Global trash integration
- Pinned items functionality

#### 🔄 Partial Features
- **Status**: Core complete, some features partial
- **Missing**:
  - Advanced filtering (basic search implemented)
  - Enhanced real-time updates (basic socket integration)
  - Complete accessibility features
  - Enhanced Chat integration (basic file sharing only)
- **Location**: `memory-bank/driveProductContext.md` (lines 72-78)

#### 🔮 Future Features
- **Location**: `memory-bank/driveProductContext.md` (lines 134-142)
- Advanced file previews
- Enhanced sharing (link expiration, password protection)
- Better mobile experience
- Performance optimizations
- Advanced accessibility
- Integration with more modules
- Complete drag-and-drop implementation
- Bulk operations with multi-select

#### 🏢 Enterprise Enhancements (Planned)
- **Location**: `memory-bank/enterpriseModuleStrategy.md`
- Advanced sharing (granular permissions, expiration, password protection)
- Audit logs & compliance reporting
- Data Loss Prevention (DLP)
- Advanced version control (branching, merging, diff highlighting)

---

### Global Search

#### ✅ Implemented Features
- **Global Search Bar**: `web/src/components/GlobalSearchBar.tsx`
- **Search Context**: `web/src/contexts/GlobalSearchContext.tsx`
- **Search Controller**: `server/src/controllers/searchController.ts`
- **Module Search Providers**: Chat, Dashboard, Member search providers exist
- **Cross-Module Search Results**: Implemented via provider registry
- **Search History and Suggestions**: Implemented in GlobalSearchContext
- **Deep Linking**: Search results include URLs for navigation

#### ⚠️ Potentially Missing
- Additional module providers (Drive, Calendar, To-Do, etc.)

---

### HR Module

#### ✅ Implemented Features
- Employee directory and profiles
- Time-off management (request/approve/cancel workflow)
- Attendance tracking (policies, punch lifecycle, manager exceptions)
- Manager approval hierarchy
- Calendar integration (time-off sync)
- Audit logging
- Employee self-service portal
- Manager team view
- **Onboarding Backend**: Service exists (`server/src/services/hrOnboardingService.ts`), routes registered

#### 🔄 Missing Features

**Analytics & Notifications (Pending)**
- **Status**: Backend ready, UI pending
- **Missing**:
  - Dashboards for onboarding progress
  - Approval/overdue notifications (email/Slack hooks)
  - Onboarding metrics capture
- **Location**: `memory-bank/progress.md` (lines 574-580)

**Template Seeding (Pending)**
- **Status**: Not implemented
- **Missing**:
  - Default onboarding templates by industry/tier
  - Document best practices
  - Starter onboarding blueprints
- **Location**: `memory-bank/progress.md` (line 575)

**Onboarding Frontend**
- **Status**: Backend exists, need to verify full UI implementation
- **Missing**: Full employee/manager onboarding UI

#### 🔮 Future Features

**Training & Learning Module (Next Module)**
- **Status**: Design phase
- **Missing**:
  - Complete module design
  - Database schema
  - API endpoints
  - Frontend components
- **Location**: `memory-bank/progress.md` (line 576)

#### 🏢 Enterprise Features (Not Implemented)
- **Location**: `memory-bank/hrProductContext.md`
- **Missing** (Enterprise tier only):
  - Clock in/out tracking
  - Geolocation attendance
  - Full payroll processing
  - Recruitment & ATS
  - Performance management
  - Benefits administration
  - Advanced reports & analytics
  - Compliance tracking

---

### Marketplace Module

#### ✅ Implemented Features
- **Data Model & API**: Complete Prisma models, controllers
- **Module Submission**: `/modules/submit` endpoint
- **Admin Review/Approval**: `/modules/submissions/*` endpoints
- **Developer/Reviewer Roles**: Via roles/permissions
- **Module Search/Discovery**: `/modules/marketplace` endpoint
- **Install/Update/Delete**: Complete functionality
- **UI**: Basic modules page (`web/src/app/modules/page.tsx`)

#### ❌ Missing Features
- Security Policy & Monitoring
- Notifications
- Analytics & Reporting
- Compliance & Audit
- Module Runtime (MVP) - iframe-based runtime host

#### 🔮 Future Features
- **Location**: `memory-bank/futureIdeas.md`
- Ratings and reviews for modules
- Ability for users to favorite/bookmark modules
- Trial/demo mode for modules
- Marketplace revenue sharing and analytics for module creators

---

### Notifications Module

#### ✅ Implemented Features
- **Central Notification Service**: Complete CRUD API with filtering/pagination
- **In-App Notification Center**: Full UI with real-time updates (`web/src/app/notifications/page.tsx`)
- **Push Notifications**: Web Push API with service worker and VAPID
- **Email Notifications**: SMTP integration with HTML templates
- **User Preferences**: Complete settings page with channel management
- **Real-Time Delivery**: WebSocket integration with live updates
- **Persistent Storage/State**: Database models with comprehensive API
- **Module Integration**: Chat, Drive, Business modules integrated
- **Notification Badge**: `web/src/components/NotificationBadge.tsx`

#### 🔄 Partial Features
- Audit Log: Basic logging, advanced features pending

#### 🔮 Future Features
- **Location**: `memory-bank/futureIdeas.md`
- Unified notification center enhancements
- Per-module notification controls
- AI-driven notification prioritization
- Third-party notification integrations (SMS, external services)

---

### Presence Module

#### ✅ Implemented Features
- **Real-Time Presence**: usePresence, WebSocket, API
- **PresenceIndicator UI**: PresenceIndicator.tsx
- **Thread-Specific Status**: usePresence, threadPresence API
- **Activity Tracking**: usePresence (mousemove, keydown, etc.)
- **Last Seen Info**: PresenceIndicator, API

#### ❌ Missing Features
- **Global Presence**: Not yet implemented (only thread-specific exists)
- **Analytics Integration**: Not yet implemented

#### 🔮 Future Features
- Global presence tracking (across all modules)
- Presence-based notifications and analytics
- Custom status messages (e.g., "In a meeting")
- Integration with external presence systems (calendar, SSO)

---

### Scheduling Module

#### ✅ Implemented Features
- Complete schedule builder with drag-and-drop
- Shift management and templates
- Shift swap requests (request, approve, deny workflow)
- Employee schedule viewing
- Availability tracking (backend)
- Schedule publishing
- Auto-save functionality
- Build tools sidebar (Employees, Positions, Stations)
- When I Work-style visualization
- AI context integration (3 context providers)

#### ⏳ Missing Features
- **Location**: `memory-bank/schedulingProductContext.md` (lines 364-368)
- Cancel swap request functionality
- Open shifts claiming UI (backend ready)
- Availability management UI (backend ready)
- HR module integration (time-off → availability blocking, schedules → expected attendance)
- Real-time updates via WebSockets for schedule changes

---

### To-Do Module

#### ✅ Implemented Features
- Complete task management (CRUD, status, priority)
- Subtasks and dependencies
- Task projects and recurring tasks
- Comments and attachments
- Time tracking (timer, manual entry, history)
- AI prioritization and smart scheduling
- Calendar integration (automatic event creation)
- Chat integration (create tasks from messages)
- Drive integration (link files to tasks)
- Multiple views (List, Board, Calendar)
- AI context providers (4 registered)

#### 🔮 Future Enhancements
- **Location**: `memory-bank/todoProductContext.md` (lines 307-321)
- Bidirectional sync (calendar event changes update task due dates)
- Calendar-to-task sync (show calendar events as tasks)
- Business calendar integration (currently only personal calendar)
- Visual dependency graph
- Advanced filters and search
- Task templates
- Time tracking analytics and reporting

---

### Testing Infrastructure

#### ✅ Implemented Features
- **Unit Tests**: Vitest setup with 42 tests passing (admin portal)
- **Integration Tests**: 22 tests passing (user management, moderation, analytics)
- **Testing Infrastructure**: Complete (Vitest, Supertest, test helpers, database setup)
- **Testing UI**: Admin portal test runner with backend API integration
- **E2E Tests**: Exist for Drive (`tests/e2e/drive/`), Chat (`tests/e2e/chat/`), Auth (`tests/e2e/auth.spec.ts`)
- **Playwright Configuration**: `playwright.config.ts` exists

#### ❌ Missing Features
- **Admin Portal E2E Tests**: No admin portal E2E tests found
- **Testing Dashboard**: Planned (centralized dashboard for test results)
- Expanded E2E test coverage

#### 🔮 Future Features
- E2E and visual regression testing expansion
- Centralized test dashboard for real-time insights
- Performance and load testing
- Test analytics and reporting

---

## 🌐 Platform-Wide Features

### Phase 3: Integrations & Advanced Features
- **Location**: `memory-bank/roadmap.md` (lines 89-106)
- **Status**: Partially complete
- **Missing**:
  - Global presence across modules (thread-specific exists)
  - Educational Module: Complete educational institution management
  - Business Module: Enhanced work collaboration tools

### Phase 4: Extensibility & Ecosystem
- **Location**: `memory-bank/roadmap.md` (lines 107-111)
- **Status**: Planned
- **Missing**:
  - Third-party module support
  - Advanced admin tools (God Mode, impersonation, org/billing management)
  - Team/shared dashboards
  - Mobile/PWA support

### Phase 5: Migration, QA, and Launch
- **Location**: `memory-bank/roadmap.md` (lines 113-117)
- **Status**: Planned
- **Missing**:
  - Data migration scripts and validation
  - Full regression and performance testing
  - Staged rollout, user onboarding, and feedback
  - Documentation, training, and support resources

---

## 💡 Future Ideas (From futureIdeas.md)

### Onboarding Enhancements
- Enhanced onboarding with progressive disclosure
- "Getting started" dashboard or checklist
- More onboarding templates for different user/org types

### Accessibility
- Accessibility deep dive and audit tools
- Enhanced keyboard navigation
- Improved screen reader support

---

## 🔧 Technical Debt & Infrastructure

### Console Migration (Phase 2) - DEFERRED
- **Status**: Rolled back due to automated script errors
- **Location**: `memory-bank/progress.md` (line 641)
- **Issue**: 3749 errors from automated script
- **Decision**: Deferred - focus on feature development

### Database Migration Issues
- **Location**: `memory-bank/progress.md` (lines 554-579)
- **Issue**: Scheduling tables created with `db push` instead of migrations
- **Action Needed**: Create proper migration file for scheduling tables
- **Recommendation**: Add migration validation to catch missing tables early

---

## 📊 Priority Recommendations

### High Priority (Ready for Implementation)
1. **Admin Portal E2E Tests** - Testing infrastructure ready, just needs Playwright tests
2. **HR Analytics & Notifications** - Backend ready, needs UI implementation
3. **Calendar Phase 3 (Availability)** - Next priority per roadmap
4. **Scheduling Module TODOs** - Backend ready, needs UI (open shifts, availability management)

### Medium Priority (Planned Features)
1. **Enterprise Module Enhancements** - Strategy documented, needs implementation
2. **To-Do Module Enhancements** - Bidirectional sync, business calendar integration
3. **Chat Module Enhancements** - Complete accessibility, mobile optimization
4. **Drive Module Enhancements** - Advanced filtering, enhanced real-time updates

### Low Priority (Future Ideas)
1. **Marketplace Enhancements** - Ratings, favorites, trials
2. **Dashboard Enhancements** - Advanced customization, multiple layouts
3. **Onboarding Enhancements** - Progressive disclosure, templates
4. **Accessibility Deep Dive** - Audit tools and improvements

---

## 📝 Notes

- **Verification Method**: This analysis cross-references memory bank documentation with actual codebase implementation
- **Status indicators**:
  - ✅ Complete / Implemented (verified in codebase)
  - 🔄 In Progress / Partial
  - ⏸️ Paused
  - ⏳ Planned / TODO
  - ❌ Not Implemented (verified missing from codebase)
  - ⚠️ Needs Verification (documented but not fully verified)
  - 🔮 Future / Planned (documented as future enhancement)
  - 🏢 Enterprise (enterprise-tier features)
- All locations reference memory-bank files with line numbers where applicable
- Features are organized by module for easy reference
- **Code Verification**: Features marked as "verified" have been confirmed to exist in the codebase

---

## 🔍 Verification Summary

### Features Verified as Implemented (Previously Thought Missing):
1. ✅ **Global Search** - Full implementation found
2. ✅ **Payment/Billing System** - Backend and UI exist (may need Phase 4.4 enhancements)
3. ✅ **Analytics** - Fully implemented (Admin, Personal, Business, Chat analytics)
4. ✅ **Notifications** - Complete system with real-time updates
5. ✅ **Marketplace UI** - Modules page exists with browsing/management
6. ✅ **Dashboard Widgets** - Drag-and-drop widget system implemented
7. ✅ **Onboarding Backend** - Service and routes exist
8. ✅ **E2E Tests** - Exist for Drive, Chat, Auth modules

### Features Verified as Missing:
1. ❌ **Admin Portal E2E Tests** - No admin portal E2E tests found (other modules have them)
2. ❌ **Global Presence** - Thread-specific exists, global presence across modules missing
3. ⚠️ **Payment/Billing Phase 4.4** - Advanced features may be missing (needs deeper review)
4. ⚠️ **Onboarding Frontend** - Backend exists, need to verify full UI implementation

### Features Needing Deeper Verification:
1. ⚠️ **Payment/Billing Advanced Features** - Backend exists, need to verify all Phase 4.4 features
2. ⚠️ **Global Search Module Providers** - Core exists, need to verify all modules have providers
3. ⚠️ **Onboarding Frontend** - Backend service exists, need to verify full employee/manager UI
4. ⚠️ **Marketplace Runtime** - UI exists, need to verify module runtime/iframe implementation

---

**Last Updated**: January 2025  
**Verification Date**: January 2025  
**Verification Method**: Cross-referenced memory bank files with codebase search and file inspection  
**Files Reviewed**: 25+ memory bank files, verified against actual codebase implementation  
**Next Review**: After major feature implementations or roadmap updates

## 📊 Verification Statistics

- **Memory Bank Files Reviewed**: 25+ files
- **Codebase Searches Performed**: 15+ semantic searches
- **Files Verified**: 50+ code files checked
- **Features Reclassified**: 8 features (from "missing" to "implemented")
- **Accuracy Improvement**: Significant - many documented "missing" features actually exist
