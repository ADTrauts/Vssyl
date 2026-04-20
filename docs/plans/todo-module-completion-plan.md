# To-Do Module - Completion Plan

**Status**: Core features complete, partial/pending features to be implemented  
**Created**: January 2025  
**Updated**: January 2025 (Renamed from "Smart To-Do" to "To-Do", added Quick Tasks)  
**Goal**: Complete all partial and pending features in logical phases

---

## 🚀 Phase 0: Immediate Updates (Priority: Critical)
**Goal**: Rename module and add quick tasks feature  
**Estimated Time**: 1 day

### 0.1 Module Rename: "Smart To-Do" → "To-Do"
- [ ] **Backend**: Update module name in database
  - `server/src/startup/seedTodoModule.ts` - Update module name
  - `server/src/startup/registerBuiltInModules.ts` - Update AI context registration
- [ ] **Frontend**: Update all UI references
  - `web/src/components/todo/TodoModule.tsx` - Update header title
  - All component files with "Smart To-Do" references
- [ ] **Documentation**: Update all documentation
  - `memory-bank/todoProductContext.md` - Update title and references
  - `memory-bank/progress.md` - Update references
  - `memory-bank/activeContext.md` - Update references
  - `memory-bank/systemPatterns.md` - Update references
  - `docs/todo-module-visual-mockup.md` - Update references
  - `docs/todo-module-completion-plan.md` - This file

**Files to Modify**:
- `server/src/startup/seedTodoModule.ts`
- `server/src/startup/registerBuiltInModules.ts`
- `web/src/components/todo/TodoModule.tsx`
- All memory-bank files with "Smart To-Do"
- All docs files with "Smart To-Do"

**Acceptance Criteria**:
- All references to "Smart To-Do" changed to "To-Do"
- Module displays as "To-Do" in marketplace
- Module displays as "To-Do" in UI
- Documentation updated consistently

---

### 0.2 Quick Tasks Feature (Apple Reminders Style)
- [ ] **Frontend**: Quick add input bar
  - Always-visible text input at top of TodoModule
  - Placeholder: "New task..." or "Add a task..."
  - Press Enter to create task instantly
  - Optional: Natural language parsing (e.g., "Buy milk tomorrow" → creates task with due date)
  - Show in all views (List, Board, Calendar)
- [ ] **Backend**: Quick task creation endpoint (optional optimization)
  - `POST /api/todo/tasks/quick` - Minimal validation, fast creation
  - Or use existing `POST /api/todo/tasks` with minimal fields
- [ ] **Natural Language Parsing** (Optional Enhancement):
  - Parse due dates: "tomorrow", "next week", "Friday", "Jan 15"
  - Parse priorities: "urgent", "high priority"
  - Parse categories: "work", "personal", "shopping"
  - Use simple regex or lightweight NLP library

**Files to Create/Modify**:
- `web/src/components/todo/QuickTaskInput.tsx` - New component
- `web/src/components/todo/TodoModule.tsx` - Add quick input bar
- `web/src/utils/taskParser.ts` - New utility for natural language parsing (optional)
- `server/src/controllers/todoController.ts` - Add quick task endpoint (optional)

**UI Design**:
```
┌─────────────────────────────────────────────────────────────┐
│  To-Do                                                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ + New task...                                         │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  [List] [Board] [Calendar]                                  │
│  ...                                                        │
```

**Acceptance Criteria**:
- Quick add input bar always visible at top
- Press Enter creates task instantly
- Task appears immediately in current view
- Natural language parsing works (if implemented)
- Works in all views (List, Board, Calendar)

---

## 📊 Current Status Summary

### ✅ Complete Features
- Core CRUD operations
- List/Board/Calendar views (basic)
- AI context providers (4 endpoints)
- Calendar integration (automatic event creation)
- Task completion/reopening
- Multi-context support (personal/business/household)

### 🟡 Partial Features (Schema Ready, UI/Logic Pending)
- **Subtasks** - Schema ready, basic UI support
- **Task Dependencies** - Schema ready, UI pending
- **Recurring Tasks** - Schema ready, logic pending
- **Comments** - Schema ready, basic UI (no create/update)
- **Attachments** - Schema ready, UI pending
- **Time Tracking** - Schema ready (timeEstimate, actualTimeSpent)
- **Task Projects** - Schema ready, UI pending

### ❌ Pending Features
- **Drag-and-Drop (Board)** - Schema ready, UI pending
- **AI Prioritization** - Backend ready, AI logic pending
- **Smart Scheduling** - Backend ready, AI logic pending
- **Chat Integration** - Planned
- **Drive Integration** - Planned

---

## 🎯 Implementation Phases

### **Phase 1: Core Collaboration Features** (Priority: High)
**Note**: Quick Tasks (Phase 0.2) should be completed before Phase 1
**Goal**: Enable basic team collaboration on tasks  
**Estimated Time**: 2-3 days

#### 1.1 Comments System (Complete)
- [ ] **Backend**: Create/update/delete comment endpoints
  - `POST /api/todo/tasks/:id/comments` - Create comment
  - `PUT /api/todo/tasks/:id/comments/:commentId` - Update comment
  - `DELETE /api/todo/tasks/:id/comments/:commentId` - Delete comment
- [ ] **Frontend**: TaskDetail component
  - Wire up comment form submission
  - Add edit/delete actions for comment authors
  - Real-time comment updates (WebSocket optional)
- [ ] **API Client**: Add comment functions to `web/src/api/todo.ts`

**Files to Modify**:
- `server/src/controllers/todoController.ts` - Add comment endpoints
- `server/src/routes/todo.ts` - Register comment routes
- `web/src/components/todo/TaskDetail.tsx` - Complete comment UI
- `web/src/api/todo.ts` - Add comment API functions

**Acceptance Criteria**:
- Users can create comments on tasks
- Comment authors can edit/delete their comments
- Comments display with user avatars and timestamps
- Comments persist and load correctly

---

#### 1.2 Subtasks (Enhance)
- [ ] **Backend**: Enhance subtask endpoints
  - `POST /api/todo/tasks/:id/subtasks` - Create subtask
  - `PUT /api/todo/tasks/:id/subtasks/:subtaskId` - Update subtask
  - `DELETE /api/todo/tasks/:id/subtasks/:subtaskId` - Delete subtask
  - `POST /api/todo/tasks/:id/subtasks/:subtaskId/complete` - Complete subtask
- [ ] **Frontend**: TaskDetail component
  - Add subtask creation form
  - Display subtasks with checkboxes
  - Show completion progress (X/Y completed)
  - Allow inline editing of subtasks
- [ ] **UI Enhancements**:
  - Subtask completion updates parent task progress
  - Visual indicator when all subtasks complete
  - Drag-and-drop subtask reordering (optional)

**Files to Modify**:
- `server/src/controllers/todoController.ts` - Add subtask endpoints
- `server/src/routes/todo.ts` - Register subtask routes
- `web/src/components/todo/TaskDetail.tsx` - Enhance subtask UI
- `web/src/api/todo.ts` - Add subtask API functions

**Acceptance Criteria**:
- Users can create/edit/delete subtasks
- Subtasks display with completion checkboxes
- Parent task shows subtask completion progress
- Subtask completion updates in real-time

---

#### 1.3 Task Attachments (New)
- [ ] **Backend**: File attachment endpoints
  - `POST /api/todo/tasks/:id/attachments` - Upload attachment
  - `DELETE /api/todo/tasks/:id/attachments/:attachmentId` - Delete attachment
  - Use existing `storageService` for file uploads
- [ ] **Frontend**: TaskDetail component
  - File upload UI (drag-and-drop)
  - Display attachment list with icons
  - Download/delete attachment actions
  - Link to Drive files (future: Phase 4)
- [ ] **Integration**: Use Drive module's file upload patterns

**Files to Create/Modify**:
- `server/src/controllers/todoController.ts` - Add attachment endpoints
- `server/src/routes/todo.ts` - Register attachment routes
- `web/src/components/todo/TaskDetail.tsx` - Add attachment UI
- `web/src/api/todo.ts` - Add attachment API functions

**Acceptance Criteria**:
- Users can upload files as task attachments
- Attachments display with file icons and names
- Users can download and delete attachments
- File uploads use storage service (GCS/local)

---

### **Phase 2: Task Organization & Dependencies** (Priority: High)
**Goal**: Enable complex task organization and dependency management  
**Estimated Time**: 3-4 days

#### 2.1 Task Dependencies (New)
- [ ] **Backend**: Dependency management endpoints
  - `POST /api/todo/tasks/:id/dependencies` - Add dependency
  - `DELETE /api/todo/tasks/:id/dependencies/:dependsOnTaskId` - Remove dependency
  - `GET /api/todo/tasks/:id/dependencies` - Get all dependencies
  - Validate circular dependencies (prevent loops)
- [ ] **Frontend**: TaskDetail component
  - Dependency visualization (blocks/blocked by)
  - Add dependency UI (search/select tasks)
  - Visual dependency graph (simple list view)
  - Warning indicators for blocked tasks
- [ ] **UI Enhancements**:
  - Show dependency status in task list/board
  - Highlight blocked tasks
  - Prevent completing tasks with incomplete dependencies (optional)

**Files to Create/Modify**:
- `server/src/controllers/todoController.ts` - Add dependency endpoints
- `server/src/routes/todo.ts` - Register dependency routes
- `web/src/components/todo/TaskDetail.tsx` - Add dependency UI
- `web/src/components/todo/TaskItem.tsx` - Show dependency indicators
- `web/src/api/todo.ts` - Add dependency API functions

**Acceptance Criteria**:
- Users can add/remove task dependencies
- Dependencies display in task detail panel
- Circular dependencies are prevented
- Blocked tasks are visually indicated

---

#### 2.2 Task Projects (New)
- [ ] **Backend**: Project management endpoints
  - `GET /api/todo/projects` - List projects
  - `POST /api/todo/projects` - Create project
  - `PUT /api/todo/projects/:id` - Update project
  - `DELETE /api/todo/projects/:id` - Delete project
  - Filter tasks by project
- [ ] **Frontend**: Project management UI
  - Project sidebar/filter in TodoModule
  - Project creation/editing modal
  - Project color coding
  - Task assignment to projects
- [ ] **UI Enhancements**:
  - Project badges on tasks
  - Filter tasks by project
  - Project progress tracking

**Files to Create/Modify**:
- `server/src/controllers/todoController.ts` - Add project endpoints
- `server/src/routes/todo.ts` - Register project routes
- `web/src/components/todo/TodoModule.tsx` - Add project filter
- `web/src/components/todo/ProjectManager.tsx` - New component
- `web/src/components/todo/TaskForm.tsx` - Add project selection
- `web/src/api/todo.ts` - Add project API functions

**Acceptance Criteria**:
- Users can create/edit/delete projects
- Tasks can be assigned to projects
- Tasks filterable by project
- Projects display with color coding

---

#### 2.3 Recurring Tasks (Complete)
- [ ] **Backend**: Recurrence logic
  - RRULE parsing and validation
  - Automatic instance generation
  - Recurrence end date handling
  - Instance completion tracking
- [ ] **Frontend**: Recurrence UI
  - Recurrence rule builder in TaskForm
  - Common patterns (daily, weekly, monthly)
  - Custom RRULE input (advanced)
  - Recurring task indicators
- [ ] **Logic**:
  - Generate task instances based on RRULE
  - Handle instance completion
  - Prevent editing of generated instances (or allow with override)

**Files to Create/Modify**:
- `server/src/controllers/todoController.ts` - Add recurrence logic
- `server/src/services/todoRecurrenceService.ts` - New service
- `web/src/components/todo/TaskForm.tsx` - Add recurrence UI
- `web/src/components/todo/TaskItem.tsx` - Show recurrence indicator
- `web/src/api/todo.ts` - Add recurrence fields to API

**Acceptance Criteria**:
- Users can create recurring tasks with common patterns
- Task instances generate automatically
- Recurrence rules validate correctly
- Recurring tasks display with indicators

---

### **Phase 3: Drag-and-Drop & UX Enhancements** (Priority: Medium)
**Goal**: Improve task management UX with drag-and-drop  
**Estimated Time**: 2-3 days

#### 3.1 Board View Drag-and-Drop (New)
- [ ] **Frontend**: Implement drag-and-drop
  - Use `@dnd-kit/core` (same as Drive module)
  - Drag tasks between status columns
  - Visual feedback during drag
  - Optimistic updates
- [ ] **Backend**: Status update endpoint
  - `PUT /api/todo/tasks/:id` - Already exists, ensure it handles status updates
- [ ] **UI Enhancements**:
  - Drag handle on task cards
  - Column drop zones
  - Smooth animations
  - Prevent invalid drops

**Files to Modify**:
- `web/src/components/todo/TaskBoard.tsx` - Add drag-and-drop
- `web/src/components/todo/TaskItem.tsx` - Add drag handle
- `web/src/api/todo.ts` - Ensure updateTask handles status

**Dependencies**:
- `@dnd-kit/core` - Already installed (used in Drive)
- `@dnd-kit/sortable` - May need to install

**Acceptance Criteria**:
- Users can drag tasks between board columns
- Status updates automatically on drop
- Visual feedback during drag operation
- Invalid drops are prevented

---

#### 3.2 Time Tracking (Enhance)
- [ ] **Backend**: Time tracking endpoints
  - `POST /api/todo/tasks/:id/time` - Log time spent
  - `GET /api/todo/tasks/:id/time` - Get time tracking history
  - Calculate time spent vs estimate
- [ ] **Frontend**: Time tracking UI
  - Timer component in TaskDetail
  - Start/stop/pause timer
  - Manual time entry
  - Time tracking history
  - Time estimate vs actual comparison
- [ ] **Analytics**:
  - Time spent per task
  - Time estimate accuracy
  - Time spent by category/project

**Files to Create/Modify**:
- `server/src/controllers/todoController.ts` - Add time tracking endpoints
- `server/src/routes/todo.ts` - Register time tracking routes
- `web/src/components/todo/TaskDetail.tsx` - Add time tracking UI
- `web/src/components/todo/TimeTracker.tsx` - New component
- `web/src/api/todo.ts` - Add time tracking API functions

**Acceptance Criteria**:
- Users can start/stop/pause time tracking
- Time spent is logged and displayed
- Time estimate vs actual comparison works
- Time tracking history is accessible

---

### **Phase 4: AI-Powered Features** (Priority: Medium)
**Goal**: Implement AI prioritization and smart scheduling  
**Estimated Time**: 3-4 days

#### 4.1 AI Prioritization (New)
- [ ] **Backend**: AI prioritization service
  - Analyze task context (due date, dependencies, category)
  - Suggest priority levels
  - Learn from user priority adjustments
- [ ] **Frontend**: AI suggestions UI
  - Priority suggestion panel
  - Accept/dismiss suggestions
  - Bulk priority updates
- [ ] **Integration**: Use existing AI context system

**Files to Create/Modify**:
- `server/src/services/todoAIPrioritizationService.ts` - New service
- `server/src/controllers/todoController.ts` - Add priority suggestion endpoint
- `web/src/components/todo/AIPrioritySuggestions.tsx` - New component
- `web/src/components/todo/TodoModule.tsx` - Integrate suggestions panel

**Acceptance Criteria**:
- AI suggests priority levels for tasks
- Users can accept/dismiss suggestions
- Priority suggestions improve over time
- Suggestions appear in task list/board

---

#### 4.2 Smart Scheduling (New)
- [ ] **Backend**: Smart scheduling service
  - Analyze calendar availability
  - Suggest optimal task scheduling
  - Consider dependencies and priorities
  - Time estimate integration
- [ ] **Frontend**: Scheduling suggestions UI
  - Suggested due dates
  - Calendar integration for scheduling
  - Bulk scheduling suggestions
- [ ] **Integration**: Use Calendar module API

**Files to Create/Modify**:
- `server/src/services/todoSmartSchedulingService.ts` - New service
- `server/src/controllers/todoController.ts` - Add scheduling suggestion endpoint
- `web/src/components/todo/AISchedulingSuggestions.tsx` - New component
- `web/src/components/todo/TodoModule.tsx` - Integrate scheduling panel

**Acceptance Criteria**:
- AI suggests optimal due dates based on calendar
- Suggestions consider task dependencies
- Users can accept/dismiss scheduling suggestions
- Suggestions integrate with calendar events

---

### **Phase 5: Module Integrations** (Priority: Low)
**Goal**: Integrate with Chat and Drive modules  
**Estimated Time**: 2-3 days

#### 5.1 Chat Integration (New)
- [ ] **Backend**: Chat-to-task creation
  - Parse task creation from messages
  - Create tasks from chat messages
  - Task assignment notifications
- [ ] **Frontend**: Chat integration UI
  - "Create Task" button in chat messages
  - Task creation modal from chat
  - Task assignment notifications
- [ ] **Integration**: Use Chat module API

**Files to Create/Modify**:
- `server/src/services/todoChatIntegrationService.ts` - New service
- `server/src/controllers/todoController.ts` - Add chat integration endpoints
- `web/src/components/chat/ChatMessage.tsx` - Add task creation button
- `web/src/components/todo/TaskForm.tsx` - Support chat context

**Acceptance Criteria**:
- Users can create tasks from chat messages
- Task assignment sends notifications
- Tasks link back to originating chat messages

---

#### 5.2 Drive Integration (New)
- [ ] **Backend**: Drive file linking
  - Link tasks to Drive files
  - File attachment from Drive
  - Task context in Drive file details
- [ ] **Frontend**: Drive integration UI
  - "Link File" button in TaskDetail
  - Drive file picker modal
  - Display linked files
  - Open files from tasks
- [ ] **Integration**: Use Drive module API

**Files to Create/Modify**:
- `server/src/controllers/todoController.ts` - Enhance file linking (TaskFileLink exists)
- `web/src/components/todo/TaskDetail.tsx` - Add Drive file linking UI
- `web/src/components/todo/DriveFilePicker.tsx` - New component
- `web/src/api/todo.ts` - Add file linking functions

**Acceptance Criteria**:
- Users can link Drive files to tasks
- Linked files display in task detail
- Files can be opened from tasks
- Task context appears in Drive file details

---

## 📋 Implementation Checklist

### Phase 0: Immediate Updates (1 day)
- [ ] Module rename: "Smart To-Do" → "To-Do"
- [ ] Quick tasks feature (Apple Reminders style)

### Phase 1: Core Collaboration (2-3 days)
- [ ] Comments system (create/update/delete)
- [ ] Subtasks (enhance with full CRUD)
- [ ] Task attachments (file upload)

### Phase 2: Task Organization (3-4 days)
- [ ] Task dependencies (add/remove/visualize)
- [ ] Task projects (create/manage/filter)
- [ ] Recurring tasks (RRULE logic)

### Phase 3: Drag-and-Drop & UX (2-3 days)
- [ ] Board view drag-and-drop
- [ ] Time tracking (timer + history)

### Phase 4: AI Features (3-4 days)
- [ ] AI prioritization
- [ ] Smart scheduling

### Phase 5: Module Integrations (2-3 days)
- [ ] Chat integration
- [ ] Drive integration

**Total Estimated Time**: 13-18 days (including Phase 0)

---

## 🎯 Success Metrics

### Phase 1 Success
- Users can collaborate on tasks via comments
- Subtasks provide task breakdown capability
- File attachments enable document sharing

### Phase 2 Success
- Complex task workflows supported via dependencies
- Task organization improved with projects
- Recurring tasks automate repetitive work

### Phase 3 Success
- Task management UX significantly improved
- Time tracking provides productivity insights

### Phase 4 Success
- AI assists with task prioritization
- Smart scheduling optimizes task timing

### Phase 5 Success
- Tasks integrate seamlessly with Chat and Drive
- Cross-module workflows enabled

---

## 🔧 Technical Considerations

### Dependencies
- `@dnd-kit/core` - Already installed (Drive module)
- `@dnd-kit/sortable` - May need to install for board drag-and-drop
- `rrule` - May need for recurring task logic (or use native Date)

### Backend Patterns
- Follow existing controller patterns (see `todoController.ts`)
- Use `storageService` for file uploads (see Drive module)
- Use `logger` for error logging
- Validate all inputs (Zod schemas recommended)

### Frontend Patterns
- Follow existing component patterns (see `TaskDetail.tsx`)
- Use shared components from `shared/components`
- Use `toast` for user feedback
- Follow TypeScript standards (no `any` types)

### Database
- All schema models exist in `prisma/modules/todo/todo.prisma`
- No new migrations needed (schema is ready)
- Use Prisma client for all database operations

---

## 📝 Notes

- **Priority Order**: Phases are ordered by user value and dependencies
- **Incremental Delivery**: Each phase can be delivered independently
- **Testing**: Each phase should include manual testing before moving to next
- **Documentation**: Update `todoProductContext.md` after each phase

---

**Last Updated**: January 2025  
**Status**: Planning Complete - Ready for Implementation

