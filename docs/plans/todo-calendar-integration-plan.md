# To-Do Module Calendar Integration Plan

## Overview
Integrate the To-Do module with the Calendar module to provide:
1. **Calendar View** - Display tasks in calendar format (month/week/day views)
2. **Task-to-Event Linking** - Create calendar events from tasks with due dates
3. **Calendar-to-Task Sync** - Show calendar events as tasks in To-Do module
4. **Personal Calendar Integration** - Connect with user's personal calendar
5. **Bidirectional Sync** - Keep tasks and events in sync

---

## Phase 1: Calendar View Component

### 1.1 Create TaskCalendar Component
**File**: `web/src/components/todo/TaskCalendar.tsx`

**Features**:
- Month, Week, and Day view modes
- Display tasks with due dates on calendar grid
- Color-code by priority (urgent=red, high=orange, medium=yellow, low=blue)
- Show task title and priority badge
- Click task to open TaskDetail panel
- Click empty date to create new task with that due date
- Navigation controls (previous/next month/week/day)
- Today button to jump to current date

**Data Requirements**:
- Tasks with `dueDate` field
- Filter tasks by `dashboardId` and `businessId`
- Group tasks by date for calendar rendering

**UI Components**:
- Month grid (7 columns × ~5 rows)
- Week timeline (7 days with time slots)
- Day timeline (single day with time slots)
- Task cards/events on calendar grid
- View mode toggle (Month/Week/Day)

---

## Phase 2: Task-to-Calendar Event Linking

### 2.1 Backend API Endpoints

**File**: `server/src/controllers/todoController.ts`

**New Functions**:
1. `linkTaskToEvent(taskId, eventId)` - Link existing task to existing calendar event
2. `createEventFromTask(taskId, calendarId?)` - Create calendar event from task
3. `unlinkTaskFromEvent(taskId, eventId)` - Remove link between task and event
4. `getTaskLinkedEvents(taskId)` - Get all calendar events linked to a task

**Routes**:
```typescript
// In server/src/routes/todo.ts
router.post('/tasks/:id/link-event', todoController.linkTaskToEvent);
router.post('/tasks/:id/create-event', todoController.createEventFromTask);
router.delete('/tasks/:id/unlink-event/:eventId', todoController.unlinkTaskFromEvent);
router.get('/tasks/:id/linked-events', todoController.getTaskLinkedEvents);
```

### 2.2 Task-to-Event Mapping Logic

**When creating event from task**:
- Use task `dueDate` as event `startAt`
- Calculate `endAt` based on:
  - Task `timeEstimate` (if provided) → add minutes to startAt
  - Default: 1 hour duration
- Use task `title` as event `title`
- Use task `description` as event `description`
- Use task `category` as event `location` (optional)
- Create event in user's **personal primary calendar** (contextType: PERSONAL, contextId: userId)
- Create `TaskEventLink` record to link them
- Set event `allDay = false` (unless task has no specific time)

**When linking existing task to existing event**:
- Verify user has access to both task and event
- Create `TaskEventLink` record
- Optionally sync task dueDate to event startAt (or vice versa)

### 2.3 Frontend Integration

**File**: `web/src/components/todo/TaskForm.tsx`

**Add to Task Form**:
- Checkbox: "Create calendar event" (only shown if dueDate is set)
- Option: "Link to existing calendar event" (dropdown of user's events)
- When task is saved with "Create calendar event" checked:
  - Call `createEventFromTask` API
  - Show success message with link to calendar event

**File**: `web/src/components/todo/TaskDetail.tsx`

**Add to Task Detail Panel**:
- Section: "Linked Calendar Events"
- Show list of linked events with:
  - Event title and date/time
  - Link to open event in Calendar module
  - Button to unlink event
- Button: "Create Calendar Event" (if not already linked)
- Button: "Link to Existing Event" (opens modal to select event)

---

## Phase 3: Calendar-to-Task Sync

### 3.1 Show Calendar Events as Tasks

**Option A: Virtual Tasks (Recommended)**
- Don't create Task records for calendar events
- Query calendar events when loading tasks
- Display events alongside tasks in list/board/calendar views
- Mark them visually as "Calendar Event" (different icon/badge)
- Clicking opens calendar event detail (not task detail)

**Option B: Auto-Create Tasks**
- When calendar event is created, optionally create a task
- Link them via `TaskEventLink`
- Sync changes bidirectionally

**Recommendation**: Use **Option A** (Virtual Tasks) for cleaner UX and less data duplication.

### 3.2 Calendar Events Query

**File**: `web/src/components/todo/TodoModule.tsx`

**Logic**:
```typescript
// When loading tasks, also load calendar events
const loadCalendarEvents = async () => {
  // Get user's personal primary calendar
  const calendars = await calendarAPI.listCalendars({ 
    contextType: 'PERSONAL' 
  });
  const primaryCalendar = calendars.data.find(c => c.isPrimary);
  
  if (primaryCalendar) {
    // Get events for current view date range
    const start = getViewStartDate(); // Based on current view
    const end = getViewEndDate();
    
    const events = await calendarAPI.listEvents({
      start: start.toISOString(),
      end: end.toISOString(),
      calendarIds: [primaryCalendar.id]
    });
    
    // Convert events to "virtual tasks" for display
    return events.data.map(event => ({
      id: `event-${event.id}`,
      title: event.title,
      dueDate: event.startAt,
      isCalendarEvent: true,
      eventId: event.id,
      calendarId: event.calendarId,
      // ... other event properties
    }));
  }
};
```

### 3.3 Display Calendar Events in Views

**List View**:
- Show calendar events mixed with tasks
- Different visual style (calendar icon, different color)
- Clicking opens calendar event (not task detail)

**Board View**:
- Show calendar events in appropriate status column based on date
- Visual distinction from regular tasks

**Calendar View**:
- Show calendar events alongside tasks
- Different styling to distinguish

---

## Phase 4: Personal Calendar Integration

### 4.1 Get User's Personal Calendar

**Logic**:
```typescript
// Get user's personal primary calendar
const getPersonalCalendar = async (userId: string) => {
  const calendars = await calendarAPI.listCalendars({
    contextType: 'PERSONAL',
    contextId: userId
  });
  
  // Find primary calendar or create one if missing
  let primaryCalendar = calendars.data.find(c => c.isPrimary);
  
  if (!primaryCalendar) {
    // Auto-provision primary calendar
    const result = await calendarAPI.autoProvision({
      contextType: 'PERSONAL',
      contextId: userId,
      isPrimary: true
    });
    primaryCalendar = result.data;
  }
  
  return primaryCalendar;
};
```

### 4.2 Calendar Context Awareness

**Personal Context**:
- Link tasks to personal calendar events
- Show personal calendar events in To-Do module

**Business Context**:
- Option to link tasks to business calendar events
- Show business calendar events (if user has access)

**Household Context**:
- Option to link tasks to household calendar events
- Show household calendar events (if user has access)

---

## Phase 5: Bidirectional Sync

### 5.1 Task Due Date → Calendar Event Start

**When task dueDate changes**:
- If task is linked to calendar event:
  - Update event `startAt` to match new dueDate
  - Recalculate event `endAt` based on timeEstimate
  - Update event via Calendar API

**When task is deleted**:
- Option: Delete linked calendar event (with confirmation)
- Option: Unlink event (keep event, remove link)

### 5.2 Calendar Event Start → Task Due Date

**When calendar event startAt changes**:
- If event is linked to task:
  - Update task `dueDate` to match new startAt
  - Update task via To-Do API

**When calendar event is deleted**:
- Option: Delete linked task (with confirmation)
- Option: Unlink task (keep task, remove link, clear dueDate?)

### 5.3 Sync Conflict Resolution

**When both are modified**:
- Last-write-wins (timestamp-based)
- Or: Show conflict resolution UI
- Or: Don't auto-sync, show warning badge

**Recommendation**: Start with **last-write-wins** for simplicity.

---

## Phase 6: Implementation Details

### 6.1 Database Schema (Already Exists)

The `TaskEventLink` model already exists in the schema:
```prisma
model TaskEventLink {
  id        String   @id @default(uuid())
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  taskId    String
  eventId   String   // Calendar event ID
  
  @@unique([taskId, eventId])
  @@index([taskId])
  @@index([eventId])
  @@map("task_event_links")
}
```

### 6.2 API Client Functions

**File**: `web/src/api/todo.ts`

**New Functions**:
```typescript
// Link task to existing calendar event
export async function linkTaskToEvent(
  token: string, 
  taskId: string, 
  eventId: string
): Promise<void>

// Create calendar event from task
export async function createEventFromTask(
  token: string,
  taskId: string,
  calendarId?: string
): Promise<{ task: Task; event: EventItem }>

// Unlink task from calendar event
export async function unlinkTaskFromEvent(
  token: string,
  taskId: string,
  eventId: string
): Promise<void>

// Get linked calendar events for a task
export async function getTaskLinkedEvents(
  token: string,
  taskId: string
): Promise<EventItem[]>
```

### 6.3 Calendar View Component Structure

**File**: `web/src/components/todo/TaskCalendar.tsx`

```typescript
interface TaskCalendarProps {
  tasks: Task[];
  calendarEvents?: EventItem[]; // Optional: show calendar events too
  onTaskSelect: (task: Task) => void;
  onTaskCreate: (dueDate: Date) => void;
  onEventSelect?: (event: EventItem) => void;
  viewMode: 'month' | 'week' | 'day';
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: 'month' | 'week' | 'day') => void;
}

export function TaskCalendar({ ... }: TaskCalendarProps) {
  // Month view: Grid of days with tasks
  // Week view: Timeline with tasks
  // Day view: Single day timeline with tasks
}
```

### 6.4 Integration Points

**TaskForm.tsx**:
- Add "Create Calendar Event" checkbox
- Add "Link to Event" dropdown
- Handle event creation/linking on save

**TaskDetail.tsx**:
- Show linked events section
- Add buttons to create/link/unlink events

**TodoModule.tsx**:
- Replace placeholder calendar view with TaskCalendar component
- Load calendar events alongside tasks
- Pass calendar events to TaskCalendar

---

## Phase 7: User Experience Flow

### 7.1 Creating Task with Calendar Event

1. User clicks "New Task"
2. Fills in task form:
   - Title: "Review proposal"
   - Due Date: Tomorrow, 2:00 PM
   - Checks "Create calendar event"
3. On save:
   - Task is created
   - Calendar event is created in personal calendar
   - Event is linked to task
   - Success message: "Task and calendar event created"

### 7.2 Viewing Tasks in Calendar

1. User switches to Calendar view in To-Do module
2. Sees month/week/day view with:
   - Tasks (colored by priority)
   - Calendar events (from personal calendar)
   - Both displayed on same calendar grid
3. Clicking task opens TaskDetail
4. Clicking calendar event opens Calendar event detail (or navigates to Calendar module)

### 7.3 Linking Existing Task to Event

1. User opens TaskDetail for task with due date
2. Clicks "Link to Existing Event"
3. Modal shows list of calendar events around that date
4. User selects event
5. Task and event are linked
6. Changes to task dueDate sync to event startAt

### 7.4 Syncing Changes

1. User changes task due date
2. If linked to event, event startAt updates automatically
3. User changes calendar event time
4. If linked to task, task dueDate updates automatically
5. Visual indicator shows sync status

---

## Phase 8: Technical Considerations

### 8.1 Performance

- **Lazy Load Calendar Events**: Only load events for visible date range
- **Cache Calendar Data**: Cache calendar list and events (5-minute TTL)
- **Debounce Sync Updates**: Don't sync on every keystroke, wait for save

### 8.2 Error Handling

- **Calendar Not Found**: Auto-provision primary calendar if missing
- **Event Creation Fails**: Show error, keep task, allow retry
- **Sync Fails**: Show warning badge, allow manual sync
- **Permission Denied**: Show message if user can't access calendar

### 8.3 Data Consistency

- **Cascade Deletes**: When task is deleted, unlink events (don't delete events)
- **Orphaned Links**: Clean up TaskEventLink records when event is deleted
- **Validation**: Ensure eventId exists before creating link

### 8.4 Multi-Context Support

- **Personal**: Link to personal calendar, show personal events
- **Business**: Option to link to business calendar, show business events
- **Household**: Option to link to household calendar, show household events

---

## Phase 9: Implementation Order

### Step 1: Calendar View Component (Foundation)
1. Create `TaskCalendar.tsx` with month view
2. Display tasks with due dates on calendar grid
3. Add navigation (prev/next month, today)
4. Add week and day views

### Step 2: Task-to-Event Linking (Backend)
1. Implement `createEventFromTask` API endpoint
2. Implement `linkTaskToEvent` API endpoint
3. Implement `unlinkTaskFromEvent` API endpoint
4. Test with Postman/curl

### Step 3: Task-to-Event Linking (Frontend)
1. Add "Create Calendar Event" to TaskForm
2. Add linked events section to TaskDetail
3. Test end-to-end flow

### Step 4: Calendar-to-Task Display
1. Load calendar events in TodoModule
2. Convert events to virtual tasks
3. Display in List/Board/Calendar views
4. Handle clicks to open calendar event

### Step 5: Bidirectional Sync
1. Implement task dueDate → event startAt sync
2. Implement event startAt → task dueDate sync
3. Add conflict resolution
4. Add visual sync indicators

### Step 6: Polish & Testing
1. Add loading states
2. Add error handling
3. Add success/error toasts
4. Test all flows
5. Performance optimization

---

## Phase 10: API Endpoints Summary

### To-Do Module Endpoints (New)
```
POST   /api/todo/tasks/:id/create-event
POST   /api/todo/tasks/:id/link-event
DELETE /api/todo/tasks/:id/unlink-event/:eventId
GET    /api/todo/tasks/:id/linked-events
```

### Calendar Module Endpoints (Existing - Reuse)
```
GET    /api/calendar?contextType=PERSONAL&contextId={userId}
GET    /api/calendar/events?start={start}&end={end}&calendarIds={ids}
POST   /api/calendar/events
PATCH  /api/calendar/events/:id
DELETE /api/calendar/events/:id
```

---

## Success Criteria

✅ **Calendar View**:
- Tasks display correctly in month/week/day views
- Navigation works smoothly
- Tasks are color-coded by priority
- Clicking tasks opens TaskDetail

✅ **Task-to-Event Linking**:
- Can create calendar event from task
- Can link task to existing event
- Can unlink task from event
- Links persist correctly

✅ **Calendar-to-Task Display**:
- Calendar events show in To-Do module views
- Events are visually distinct from tasks
- Clicking events opens calendar event detail

✅ **Bidirectional Sync**:
- Task dueDate changes update event startAt
- Event startAt changes update task dueDate
- Sync works reliably
- Conflicts are handled gracefully

✅ **Personal Calendar Integration**:
- Tasks link to personal calendar by default
- Personal calendar events show in To-Do module
- Works seamlessly across contexts

---

## Open Questions / Decisions Needed

1. **Sync Direction**: Should sync be automatic or require user confirmation?
   - **Recommendation**: Automatic with visual indicator

2. **Event Deletion**: When calendar event is deleted, should linked task be deleted too?
   - **Recommendation**: No, just unlink and clear dueDate (with user notification)

3. **Task Deletion**: When task is deleted, should linked calendar event be deleted?
   - **Recommendation**: No, just unlink (with user notification)

4. **All-Day Events**: How to handle tasks with due dates but no specific time?
   - **Recommendation**: Create all-day calendar events

5. **Recurring Tasks**: How to handle recurring tasks with calendar events?
   - **Recommendation**: Create recurring calendar event (RRULE) matching task recurrence

6. **Multiple Links**: Can a task link to multiple calendar events?
   - **Recommendation**: Yes, via multiple TaskEventLink records

7. **Calendar Selection**: Which calendar should events be created in?
   - **Recommendation**: User's personal primary calendar (default), with option to choose

---

**Status**: 📋 Planning Complete - Ready for Implementation  
**Estimated Effort**: 3-4 days  
**Priority**: High (Core Feature)

