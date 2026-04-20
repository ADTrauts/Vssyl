<!--
To-Do Product Context
See README for the modular context pattern.
-->

# To-Do Product Context

## 1. Header & Purpose

**Purpose:**  
The To-Do module is an AI-powered task and to-do management system that adapts to personal and business contexts. It provides universal task management with prioritization, scheduling, and context-aware features. The module enables users to manage tasks, subtasks, dependencies, and collaborate on team tasks, all while leveraging Vssyl's AI capabilities for intelligent task suggestions and optimal scheduling.

**Cross-References:**  
- See also:  
  - [chatProductContext.md] (task assignment notifications, task comments)
  - [calendarProductContext.md] (task due dates, calendar integration)
  - [driveProductContext.md] (task attachments, file links)
  - [systemPatterns.md] (module architecture, context switching)
  - [designPatterns.md] (UI/UX patterns, component library)
  - [databaseContext.md] (Task model and relationships)
  - [aiContextSystem.md] (AI context integration)

## 2. Problem Space
- Users need a unified task management system that works for both personal and business contexts
- Existing task management tools don't integrate with other productivity modules
- Users struggle with task prioritization and optimal scheduling
- Team collaboration on tasks requires separate tools from personal task management
- No AI-powered assistance for task management and scheduling

## 3. User Experience Goals
- Seamless context switching between personal and business tasks
- Multiple views (List, Board, Calendar) for different workflows
- AI-powered prioritization and scheduling suggestions
- Intuitive task creation and management
- Real-time collaboration for business tasks
- Visual task organization with dependencies and subtasks
- Smart reminders and due date management

## 4. Core Features & Requirements

### 4a. Task Management
- Create, read, update, delete tasks
- Task status management (TODO, IN_PROGRESS, BLOCKED, REVIEW, DONE, CANCELLED)
- Priority levels (LOW, MEDIUM, HIGH, URGENT)
- Due dates and start dates
- Task completion tracking
- Task snoozing/deferral
- Task duplication

### 4b. Organization & Structure
- Subtasks and parent-child relationships
- Task projects (grouping)
- Categories and tags
- Task dependencies (blocks/blocked by)
- Recurring tasks (RRULE support)

### 4c. Context-Aware Features
- **Personal Context**: Personal tasks, errands, life admin, family task sharing
- **Business Context**: Work tasks, team assignment, department filtering, manager reporting
- **Household Context**: Family task sharing, household coordination

### 4d. Collaboration (Business)
- Task assignment to team members
- Task watchers (notifications)
- Comments and discussion threads
- Activity timeline

### 4e. Views & Visualization
- **List View**: Traditional task list with grouping and sorting
- **Board View**: Kanban board with drag-and-drop (5 columns: TODO, IN_PROGRESS, BLOCKED, REVIEW, DONE)
- **Calendar View**: Tasks displayed by due date with month/week/day views, shows both tasks and calendar events

### 4f. AI Integration
- AI-powered prioritization
- Optimal scheduling suggestions
- Time estimation
- Task breakdown suggestions
- Natural language task creation

### 4g. Integration Points
- **Calendar**: ✅ Automatic event creation for tasks with due dates, task-to-event linking, calendar view showing tasks and events, events visible in Calendar module, bidirectional sync (task updates sync to events)
- **Chat**: Create tasks from messages, assignment notifications, task comments
- **Drive**: Attach files to tasks, link tasks to Drive files

## 4a. Feature Checklist (Implementation Status)

| Feature                                 | Status      | Notes/Location                                    |
|-----------------------------------------|-------------|---------------------------------------------------|
| Database Schema                         | ✅          | Complete Prisma models (Task, TaskDependency, TaskComment, etc.) |
| Backend API (CRUD)                      | ✅          | `server/src/controllers/todoController.ts`        |
| AI Context Providers                   | ✅          | `server/src/controllers/todoAIContextController.ts` (4 providers) |
| API Routes                              | ✅          | `server/src/routes/todo.ts`                       |
| Module Registration                     | ✅          | Marketplace seeding (`server/src/startup/seedTodoModule.ts`) |
| AI Context Registration                 | ✅          | Registered in `registerBuiltInModules.ts`        |
| Frontend API Client                     | ✅          | `web/src/api/todo.ts`                             |
| Main Module Component                   | ✅          | `web/src/components/todo/TodoModule.tsx`         |
| Task List View                          | ✅          | `web/src/components/todo/TaskList.tsx`           |
| Task Item Component                     | ✅          | `web/src/components/todo/TaskItem.tsx`           |
| Task Detail Panel                       | ✅          | `web/src/components/todo/TaskDetail.tsx`         |
| Task Board View (Kanban)                | ✅          | `web/src/components/todo/TaskBoard.tsx`           |
| Task Form (Create/Edit)                 | ✅          | `web/src/components/todo/TaskForm.tsx`            |
| Task Completion                         | ✅          | Complete/reopen functionality                     |
| Priority Management                     | ✅          | 4 priority levels with color coding              |
| Status Management                       | ✅          | 6 status types                                    |
| Due Date Management                     | ✅          | With overdue detection                            |
| Dashboard Scoping                       | ✅          | Multi-tenant isolation                            |
| Business Context Support                | ✅          | Task assignment, business scoping                 |
| Quick Tasks                             | ✅          | Apple Reminders-style quick add input (Phase 0.2) |
| Subtasks                                | ✅          | Full CRUD, nested display, completion tracking (Phase 1.2) |
| Task Dependencies                       | ✅          | Add/remove dependencies, circular validation, visual indicators (Phase 2.1) |
| Recurring Tasks                         | ✅          | RRULE support, instance generation, parent control (Phase 2.3) |
| Comments                                | ✅          | Full CRUD, inline editing, user avatars (Phase 1.1) |
| Attachments                             | ✅          | File upload, download, delete, viewer modal (Phase 1.3) |
| Calendar View                           | ✅          | Month/week/day views with tasks and events        |
| Drag-and-Drop (Board)                   | ✅          | Board view status changes + Global trash bin integration (Phase 3.1) |
| AI Prioritization                       | ✅          | Full implementation with suggestions, analysis, execution, feedback. Accessible through main AI button (Phase 4.1) |
| Smart Scheduling                         | ✅          | Calendar availability analysis, optimal date suggestions, conflict detection. Accessible through main AI button (Phase 4.2) |
| Time Tracking                           | ✅          | Timer, manual entry, history, estimate vs actual comparison (Phase 3.2) |
| Task Projects                           | ✅          | Full CRUD, filtering, grouping, color coding (Phase 2.2) |
| Calendar Integration                    | ✅          | Automatic event creation, task-to-event linking   |
| Chat Integration                        | ✅          | Create tasks from messages, natural language parsing, message linking (Phase 5.1) |
| Drive Integration                        | ✅          | Link files, file picker, linked files display (Phase 5.2) |

## 5. Technical Architecture

### 5a. Database Schema
**Location**: `prisma/modules/todo/todo.prisma`

**Core Models**:
- `Task` - Main task model with full context support
- `TaskDependency` - Task dependency relationships
- `TaskAttachment` - File attachments
- `TaskComment` - Task comments and discussion
- `TaskWatcher` - Users watching tasks (business)
- `TaskFileLink` - Links to Drive files
- `TaskEventLink` - Links to Calendar events
- `TaskProject` - Project grouping (future)

**Key Features**:
- Multi-context support (dashboardId, businessId, householdId)
- Soft delete (trashedAt)
- Recurrence support (RRULE)
- Subtask hierarchy
- Dependency tracking

### 5b. Backend Architecture
**Controllers**:
- `server/src/controllers/todoController.ts` - Main CRUD operations
- `server/src/controllers/todoAIContextController.ts` - AI context providers

**Routes**:
- `server/src/routes/todo.ts` - API route definitions

**Endpoints**:
- `GET /api/todo/tasks` - List tasks with filters
- `POST /api/todo/tasks` - Create task (automatically creates calendar event if due date provided)
- `GET /api/todo/tasks/:id` - Get task details
- `PUT /api/todo/tasks/:id` - Update task (automatically syncs to linked calendar events)
- `DELETE /api/todo/tasks/:id` - Delete task (soft delete)
- `POST /api/todo/tasks/:id/complete` - Mark complete
- `POST /api/todo/tasks/:id/reopen` - Reopen task
- `POST /api/todo/tasks/:id/create-event` - Create calendar event from task
- `POST /api/todo/tasks/:id/link-event` - Link task to existing calendar event
- `DELETE /api/todo/tasks/:id/unlink-event/:eventId` - Unlink task from calendar event
- `GET /api/todo/tasks/:id/linked-events` - Get all calendar events linked to task
- `GET /api/todo/ai/context/overview` - Task overview for AI
- `GET /api/todo/ai/context/upcoming` - Upcoming tasks
- `GET /api/todo/ai/context/overdue` - Overdue tasks
- `GET /api/todo/ai/context/priority` - High priority tasks

### 5c. Frontend Architecture
**Components**:
- `web/src/app/todo/page.tsx` - Main page
- `web/src/components/todo/TodoModule.tsx` - Main module component
- `web/src/components/todo/TaskList.tsx` - List view
- `web/src/components/todo/TaskItem.tsx` - Task card/item
- `web/src/components/todo/TaskDetail.tsx` - Detail panel
- `web/src/components/todo/TaskBoard.tsx` - Kanban board view
- `web/src/components/todo/TaskForm.tsx` - Create/edit form
- `web/src/components/todo/TaskCalendar.tsx` - Calendar view (month/week/day)

**API Client**:
- `web/src/api/todo.ts` - Type-safe API functions

### 5d. AI Context Integration
**Registered Context Providers**:
1. `task_overview` - Task counts, status breakdown, completion rate
2. `upcoming_tasks` - Tasks due in next 7 days
3. `overdue_tasks` - Overdue tasks with days overdue
4. `priority_tasks` - High/urgent priority tasks

**AI Capabilities**:
- Answer questions about tasks ("show my tasks", "what's due today")
- Create tasks via natural language
- Prioritize tasks intelligently
- Suggest optimal scheduling

## 6. Module Installation & Availability

### 6a. Marketplace Registration
- **Module ID**: `todo`
- **Name**: `To-Do`
- **Category**: `PRODUCTIVITY`
- **Status**: `APPROVED` (visible in marketplace)
- **Pricing Tier**: `free` (no subscription required)
- **Contexts**: Personal, Business, Household

### 6b. Installation Process
1. Module seeds automatically on server startup
2. Appears in marketplace at `/modules`
3. Users can install for personal or business context
4. After installation, accessible at:
   - Personal: `/todo`
   - Business: `/business/[id]/workspace/todo`
   - Household: `/household/[id]/todo` (planned)

### 6c. Module Manifest
- Personal context: ✅ Enabled
- Business context: ✅ Enabled
- Household context: ✅ Enabled
- Requires org chart: ❌ No
- Minimum tier: `free`
- Permissions: `todo:read`, `todo:write`, `todo:assign`, `todo:delete`

## 7. User Workflows

### 7a. Personal Task Management
1. User installs module from marketplace
2. Navigates to `/todo`
3. Creates tasks with title, description, due date, priority
4. Views tasks in List or Board view
5. Completes tasks with one click
6. AI suggests priorities and optimal scheduling

### 7b. Business Task Management
1. Business admin installs module for business
2. Team members access at `/business/[id]/workspace/todo`
3. Managers assign tasks to team members
4. Team members see assigned tasks
5. Comments and collaboration on tasks
6. Task watchers receive notifications

### 7c. Task Creation Flow
1. Click "New Task" button
2. Fill in task form (title required, others optional)
3. Set priority, status, due date
4. Add category and tags
5. Set time estimate
6. Save task
7. Task appears in appropriate view

## 8. Recent Enhancements (January 2025)

### Phase 3.2: Time Tracking ✅
- Timer component with start/stop functionality
- Manual time entry with date, duration, and description
- Time history display with total time and estimate vs actual comparison
- One active timer per user with warnings for other active timers
- TaskTimeLog model for detailed time tracking

### Phase 4.1: AI Prioritization ✅
- Backend service (`todoAIPrioritizationService.ts`) with scoring algorithm
- Priority suggestions with confidence scores and reasoning
- Priority analysis endpoint for specific tasks
- Execute priority changes (with autonomy check)
- Feedback system for learning from user actions
- **Unified AI Access**: All AI features accessible through main AI button (no separate buttons)
- AI chat integration with To-Do specific prompts ("Prioritize my tasks", "Optimize task priorities")
- Context-aware prompts shown when AI button clicked in To-Do module

### Phase 4.2: Smart Scheduling ✅
- Backend service (`todoSmartSchedulingService.ts`) with calendar availability analysis
- Scheduling suggestions based on calendar conflicts, dependencies, priorities
- Optimal due date suggestions with confidence scores
- Conflict detection with existing calendar events
- Execute scheduling changes (with autonomy check)
- **Unified AI Access**: All AI features accessible through main AI button (no separate buttons)
- AI chat integration with To-Do specific prompts ("Optimize task scheduling")
- Context-aware prompts shown when AI button clicked in To-Do module

### AI Integration Refactor (Post-Phase 5.2) ✅
- **Removed Separate AI Buttons**: Removed Sparkles (priority) and Clock (scheduling) buttons from To-Do module header
- **Removed Sidebar Components**: Removed `AIPrioritySuggestions.tsx` and `AISchedulingSuggestions.tsx` sidebar components
- **Main AI Button Integration**: All AI features now accessible through main AI button at top of page
- **Context-Aware Detection**: AI button detects To-Do module and shows relevant prompts automatically
- **Pathname Fallback**: AI dropdown detects module from URL pathname if moduleContext not provided
- **Quick Actions**: Prompts shown when no conversation, compact quick action buttons shown during active conversations
- **Consistent UX**: Matches pattern used by Scheduling module for unified AI experience across all modules

### Phase 5.1: Chat Integration ✅
- Backend service (`todoChatIntegrationService.ts`) for message-to-task conversion
- Create tasks directly from chat messages with automatic parsing
- Natural language parsing extracts title, description, priority, due date
- Message-to-task linking for traceability
- "Create Task" button in chat message context menu
- API endpoints for task creation and message parsing

### Phase 5.2: Drive Integration ✅
- Backend endpoints for linking/unlinking Drive files to tasks
- Drive file picker component with folder navigation and search
- Linked files display in task detail panel
- Open files directly from tasks
- Exclude already-linked files from picker
- File details fetched from Drive API

## 9. Future Enhancements

### Remaining Enhancements
- Bidirectional sync (calendar event changes update task due dates)
- Calendar-to-task sync (show calendar events as tasks in To-Do module)
- Business calendar integration (link tasks to business calendar events)
- Visual dependency graph
- Advanced filters and search
- Task templates
- Time tracking analytics and reporting

## 10. Known Limitations
- Bidirectional sync not yet implemented (calendar event changes don't update task due dates)
- Calendar-to-task sync not yet implemented (calendar events don't show as tasks)
- Business calendar integration pending (currently only personal calendar)
- Time tracking analytics and reporting pending (basic tracking complete)
- Visual dependency graph not yet implemented

## 10. Success Metrics
- Tasks created per user
- Task completion rate
- Average tasks per dashboard
- View usage (list vs board vs calendar)
- AI suggestion acceptance rate
- Team collaboration usage (business)

---

**Last Updated**: January 2025  
**Status**: ✅ Core Features Complete + Calendar Integration + Phase 0-5.2 Features + AI Integration Refactor - Marketplace Ready  
**Version**: 2.1.0

## 11. Calendar Integration Details (January 2025)

### 11a. Automatic Event Creation
- **When**: Tasks with due dates automatically create calendar events
- **Where**: User's personal primary calendar (auto-provisioned if missing)
- **Event Details**: 
  - Title: Task title
  - Description: Task description
  - Location: Task category
  - Start: Task due date
  - End: Due date + time estimate (or 1 hour default)
  - Reminder: 10 minutes before (default)

### 11b. Event Synchronization
- **Task Updates**: When task title, description, category, or due date changes, linked calendar events are automatically updated
- **No Duplicates**: System checks for existing linked events before creating new ones
- **Event Updates**: Existing events are updated rather than creating duplicates

### 11c. Calendar View
- **Component**: `TaskCalendar.tsx` with month/week/day views
- **Display**: Shows both tasks (with due dates) and calendar events
- **Integration**: Loads events from user's personal primary calendar
- **Visual Distinction**: Tasks and events are visually distinct in calendar view

### 11d. Context Filtering Fixes
- **Issue**: Calendar module wasn't showing events created from tasks
- **Root Cause**: Calendar pages were passing formatted context strings (`PERSONAL:dashboardId`) instead of dashboard IDs
- **Fix**: Updated `contextFilter` in month/week/day pages to pass dashboard IDs directly
- **Backend**: Backend resolves dashboard IDs to `PERSONAL:userId` context automatically

### 11e. API Endpoints
- `POST /api/todo/tasks/:id/create-event` - Create calendar event from task
- `POST /api/todo/tasks/:id/link-event` - Link task to existing calendar event
- `DELETE /api/todo/tasks/:id/unlink-event/:eventId` - Unlink task from calendar event
- `GET /api/todo/tasks/:id/linked-events` - Get all calendar events linked to task

### 11f. Helper Function
- **Function**: `ensureTaskCalendarEvent(taskId, userId)` in `todoController.ts`
- **Purpose**: Automatically creates or updates calendar events for tasks with due dates
- **Called From**: `createTask()` and `updateTask()` controllers
- **Error Handling**: Logs errors but doesn't fail task creation/update if calendar event creation fails

