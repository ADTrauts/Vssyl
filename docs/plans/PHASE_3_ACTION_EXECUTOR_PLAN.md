# Phase 3: Supporting Modules Action Executor Implementation Plan

## Overview
This plan details the implementation of action executors for the remaining three modules: **Dashboard**, **Household**, and **Business**. These are lower priority modules but complete the full suite of built-in module executors.

## Current Status

### ✅ Completed (Phase 1 & 2)
- Calendar, Drive, Chat, HR, Scheduling, Notifications, Tasks

### ⚠️ Remaining (Phase 3)
- **Dashboard** - Uses placeholder `callDashboardAPI()`
- **Household** - Uses placeholder helper methods
- **Business** - Uses placeholder helper methods

---

## Module 1: Dashboard Module

### Current Implementation
- Uses `callDashboardAPI()` placeholder
- Has `updateDashboardLayout()` and `addDashboardModule()` placeholder methods

### Available Controller Functions
- `dashboardController.ts`:
  - `updateDashboard` - Updates dashboard (name, layout, preferences)
  - `createDashboard` - Creates new dashboard
  - `getDashboardById` - Gets dashboard details

### Available Service Functions
- `dashboardService.ts`:
  - `updateDashboard(userId, dashboardId, data)` - Updates dashboard with layout
  - `createDashboard(userId, data)` - Creates dashboard

- `widgetService.ts`:
  - `createWidget(userId, dashboardId, data)` - Creates widget
  - `updateWidget(userId, widgetId, data)` - Updates widget
  - `deleteWidget(userId, widgetId)` - Deletes widget

### AI Actions to Implement

#### 1. `update_layout`
**Parameters:**
- `dashboardId` (required) - Dashboard to update
- `layout` (required) - Layout configuration object

**Implementation:**
```typescript
case 'update_layout': {
  const { dashboardId, layout } = parameters || {};
  
  if (!dashboardId || !layout) {
    return { success: false, error: 'dashboardId and layout are required' };
  }

  const { updateDashboard } = await import('../../services/dashboardService');
  const dashboard = await updateDashboard(userContext.userId, dashboardId, { layout });
  
  return { success: !!dashboard, result: dashboard };
}
```

#### 2. `create_widget`
**Parameters:**
- `dashboardId` (required) - Dashboard to add widget to
- `type` (required) - Widget type
- `config` (optional) - Widget configuration
- `position` (optional) - Widget position

**Implementation:**
```typescript
case 'create_widget': {
  const { dashboardId, type, config, position } = parameters || {};
  
  if (!dashboardId || !type) {
    return { success: false, error: 'dashboardId and type are required' };
  }

  const { createWidget } = await import('../../services/widgetService');
  const widget = await createWidget(userContext.userId, dashboardId, { type, config, position });
  
  return { success: !!widget, result: widget };
}
```

#### 3. `add_module` (Optional - May not be needed)
**Note:** Modules are installed at the business level, not dashboard level. This action may not be applicable. If needed, would use `BusinessModuleInstallation` via business controller.

**Decision:** Skip for now, or implement as business-level action if needed.

### Estimated Effort: 1-2 hours

---

## Module 2: Household Module

### Current Implementation
- Uses placeholder helper methods: `assignHouseholdTask()`, `scheduleHouseholdEvent()`, `notifyHouseholdMembers()`, `manageHouseholdBudget()`

### Available Controller Functions
- `householdController.ts`:
  - `inviteMember` - Invites member to household (can be used for notifications)
  - `updateMemberRole` - Updates member role
  - `removeMember` - Removes member

### Available Cross-Module Functions
- `todoController.ts`:
  - `createTask` - Can create tasks with `householdId` and `assignedToId`

- `calendarController.ts`:
  - `createEvent` - Can create events in household calendar (contextType: 'HOUSEHOLD')

- `NotificationService`:
  - `createNotification` - Can send notifications to household members

### AI Actions to Implement

#### 1. `assign_task`
**Parameters:**
- `householdId` (required) - Household context
- `memberId` (required) - User to assign task to
- `title` (required) - Task title
- `description` (optional) - Task description
- `dueDate` (optional) - Due date
- `priority` (optional) - Task priority

**Implementation:**
```typescript
case 'assign_task': {
  const { householdId, memberId, title, description, dueDate, priority } = parameters || {};
  
  if (!householdId || !memberId || !title) {
    return { success: false, error: 'householdId, memberId, and title are required' };
  }

  // Get dashboard for household
  const dashboard = await prisma.dashboard.findFirst({
    where: { householdId, userId: userContext.userId }
  });
  
  if (!dashboard) {
    return { success: false, error: 'Household dashboard not found' };
  }

  const { createTask } = await import('../../controllers/todoController');
  
  const mockReq = {
    user: { id: userContext.userId },
    body: {
      title,
      description,
      priority: priority || 'MEDIUM',
      dueDate: dueDate ? new Date(dueDate as string) : null,
      dashboardId: dashboard.id,
      householdId,
      assignedToId: memberId
    }
  } as any;
  
  let result: any = {};
  const mockRes = {
    json: (data: any) => { result = data; },
    status: (code: number) => ({ json: (data: any) => { result = { ...data, statusCode: code }; } })
  } as any;

  await createTask(mockReq, mockRes);

  return {
    success: !result.statusCode || result.statusCode === 200 || result.statusCode === 201,
    result: result
  };
}
```

#### 2. `schedule_event`
**Parameters:**
- `householdId` (required) - Household context
- `title` (required) - Event title
- `description` (optional) - Event description
- `startAt` (required) - Event start time
- `endAt` (required) - Event end time
- `participants` (optional) - Array of household member IDs

**Implementation:**
```typescript
case 'schedule_event': {
  const { householdId, title, startAt, endAt, description, participants } = parameters || {};
  
  if (!householdId || !title || !startAt || !endAt) {
    return { success: false, error: 'householdId, title, startAt, and endAt are required' };
  }

  // Get household calendar
  const calendar = await prisma.calendar.findFirst({
    where: {
      contextType: 'HOUSEHOLD',
      contextId: householdId,
      isPrimary: true
    }
  });
  
  if (!calendar) {
    return { success: false, error: 'Household calendar not found' };
  }

  const { createEvent } = await import('../../controllers/calendarController');
  
  const mockReq = {
    user: { id: userContext.userId },
    body: {
      calendarId: calendar.id,
      title,
      description,
      startAt: new Date(startAt as string),
      endAt: new Date(endAt as string),
      allDay: false,
      timezone: 'UTC',
      attendees: participants ? participants.map((p: string) => ({ userId: p })) : []
    }
  } as any;
  
  let result: any = {};
  const mockRes = {
    json: (data: any) => { result = data; },
    status: (code: number) => ({ json: (data: any) => { result = { ...data, statusCode: code }; } })
  } as any;

  await createEvent(mockReq, mockRes);

  return {
    success: !result.statusCode || result.statusCode === 200 || result.statusCode === 201,
    result: result
  };
}
```

#### 3. `notify_members`
**Parameters:**
- `householdId` (required) - Household context
- `message` (required) - Notification message
- `title` (optional) - Notification title

**Implementation:**
```typescript
case 'notify_members': {
  const { householdId, message, title } = parameters || {};
  
  if (!householdId || !message) {
    return { success: false, error: 'householdId and message are required' };
  }

  // Get all active household members
  const members = await prisma.householdMember.findMany({
    where: { householdId, isActive: true },
    select: { userId: true }
  });

  if (members.length === 0) {
    return { success: false, error: 'No active members found' };
  }

  const { NotificationService } = await import('../../services/notificationService');
  
  const results = [];
  for (const member of members) {
    try {
      await NotificationService.createNotification({
        userId: member.userId,
        type: 'household_notification',
        title: title || 'Household Notification',
        body: message
      });
      results.push({ userId: member.userId, success: true });
    } catch (error) {
      results.push({ userId: member.userId, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  const successful = results.filter(r => r.success).length;

  return {
    success: successful > 0,
    result: { notified: successful, total: members.length, results }
  };
}
```

#### 4. `manage_budget` (Optional - May not exist)
**Note:** Budget management may not be implemented yet. If not available, return "not implemented" error.

**Decision:** Check if budget functionality exists, implement if available, otherwise return appropriate error.

### Estimated Effort: 2-3 hours

---

## Module 3: Business Module

### Current Implementation
- Uses placeholder helper methods: `scheduleBusinessMeeting()`, `delegateBusinessTask()`, `generateBusinessReport()`, `updateBusinessProject()`

### Available Controller Functions
- `businessController.ts`:
  - `inviteMember` - Invites member to business
  - `updateBusinessMember` - Updates member (can be used for delegation)
  - `getBusinessAnalytics` - Gets business analytics (can be used for reports)

### Available Cross-Module Functions
- `calendarController.ts`:
  - `createEvent` - Can create events in business calendar (contextType: 'BUSINESS')

- `todoController.ts`:
  - `createTask` - Can create tasks with `businessId` and `assignedToId`
  - `updateTask` - Can update task assignment (delegation)

### AI Actions to Implement

#### 1. `schedule_meeting`
**Parameters:**
- `businessId` (required) - Business context
- `title` (required) - Meeting title
- `startAt` (required) - Meeting start time
- `endAt` (required) - Meeting end time
- `participants` (optional) - Array of business member IDs
- `agenda` (optional) - Meeting agenda/description

**Implementation:**
```typescript
case 'schedule_meeting': {
  const { businessId, title, startAt, endAt, participants, agenda } = parameters || {};
  
  if (!businessId || !title || !startAt || !endAt) {
    return { success: false, error: 'businessId, title, startAt, and endAt are required' };
  }

  // Get business calendar
  const calendar = await prisma.calendar.findFirst({
    where: {
      contextType: 'BUSINESS',
      contextId: businessId,
      isPrimary: true
    }
  });
  
  if (!calendar) {
    return { success: false, error: 'Business calendar not found' };
  }

  const { createEvent } = await import('../../controllers/calendarController');
  
  const mockReq = {
    user: { id: userContext.userId },
    body: {
      calendarId: calendar.id,
      title,
      description: agenda,
      startAt: new Date(startAt as string),
      endAt: new Date(endAt as string),
      allDay: false,
      timezone: 'UTC',
      attendees: participants ? participants.map((p: string) => ({ userId: p })) : []
    }
  } as any;
  
  let result: any = {};
  const mockRes = {
    json: (data: any) => { result = data; },
    status: (code: number) => ({ json: (data: any) => { result = { ...data, statusCode: code }; } })
  } as any;

  await createEvent(mockReq, mockRes);

  return {
    success: !result.statusCode || result.statusCode === 200 || result.statusCode === 201,
    result: result
  };
}
```

#### 2. `delegate_task`
**Parameters:**
- `taskId` (required) - Task to delegate
- `assigneeId` (required) - User to assign task to

**Implementation:**
```typescript
case 'delegate_task': {
  const { taskId, assigneeId } = parameters || {};
  
  if (!taskId || !assigneeId) {
    return { success: false, error: 'taskId and assigneeId are required' };
  }

  const { updateTask } = await import('../../controllers/todoController');
  
  const mockReq = {
    user: { id: userContext.userId },
    params: { id: taskId },
    body: { assignedToId: assigneeId }
  } as any;
  
  let result: any = {};
  const mockRes = {
    json: (data: any) => { result = data; },
    status: (code: number) => ({ json: (data: any) => { result = { ...data, statusCode: code }; } })
  } as any;

  await updateTask(mockReq, mockRes);

  return {
    success: !result.statusCode || result.statusCode === 200,
    result: result
  };
}
```

#### 3. `generate_report`
**Parameters:**
- `businessId` (required) - Business context
- `reportType` (optional) - Type of report (default: 'analytics')
- `timeRange` (optional) - Time range for report (default: '30d')

**Implementation:**
```typescript
case 'generate_report': {
  const { businessId, reportType, timeRange } = parameters || {};
  
  if (!businessId) {
    return { success: false, error: 'businessId is required' };
  }

  const { getBusinessAnalytics } = await import('../../controllers/businessController');
  
  const mockReq = {
    user: { id: userContext.userId },
    params: { id: businessId },
    query: { timeRange: timeRange || '30d' }
  } as any;
  
  let result: any = {};
  const mockRes = {
    json: (data: any) => { result = data; },
    status: (code: number) => ({ json: (data: any) => { result = { ...data, statusCode: code }; } })
  } as any;

  await getBusinessAnalytics(mockReq, mockRes);

  return {
    success: !result.statusCode || result.statusCode === 200,
    result: result
  };
}
```

#### 4. `update_project` (Optional - May not exist)
**Note:** Project management may not be implemented yet. If not available, return "not implemented" error.

**Decision:** Check if project functionality exists, implement if available, otherwise return appropriate error.

### Estimated Effort: 2-3 hours

---

## Implementation Order

### Step 1: Dashboard Module (1-2 hours)
1. Replace `executeDashboardAction()` placeholder
2. Implement `update_layout` using `dashboardService.updateDashboard`
3. Implement `create_widget` using `widgetService.createWidget`
4. Remove placeholder `callDashboardAPI()` method
5. Remove placeholder `updateDashboardLayout()` and `addDashboardModule()` methods

### Step 2: Household Module (2-3 hours)
1. Replace `executeHouseholdAction()` placeholder
2. Implement `assign_task` using `todoController.createTask` with household context
3. Implement `schedule_event` using `calendarController.createEvent` with household calendar
4. Implement `notify_members` using `NotificationService.createNotification` for all members
5. Check for `manage_budget` functionality - implement if available, otherwise return error
6. Remove placeholder helper methods

### Step 3: Business Module (2-3 hours)
1. Replace `executeBusinessAction()` placeholder
2. Implement `schedule_meeting` using `calendarController.createEvent` with business calendar
3. Implement `delegate_task` using `todoController.updateTask` to change assignment
4. Implement `generate_report` using `businessController.getBusinessAnalytics`
5. Check for `update_project` functionality - implement if available, otherwise return error
6. Remove placeholder helper methods

---

## Testing Checklist

For each module:
- [ ] Test each operation with valid parameters
- [ ] Test error handling (missing required parameters)
- [ ] Test with different user contexts (personal, business, household)
- [ ] Verify proper error messages
- [ ] Verify execution time tracking
- [ ] Verify affectedUsers array is populated correctly
- [ ] Test rollback availability flags

---

## Code Quality Standards

- ✅ Follow Tasks module pattern (direct controller imports)
- ✅ Use mock request/response objects
- ✅ Proper error handling with try/catch
- ✅ Parameter validation before execution
- ✅ Consistent return format (`ActionExecutionResult`)
- ✅ Execution time tracking
- ✅ Type safety (avoid `any` where possible)
- ✅ Remove placeholder methods after implementation

---

## Estimated Total Time: 5-8 hours

**Breakdown:**
- Dashboard: 1-2 hours
- Household: 2-3 hours
- Business: 2-3 hours

---

## Notes

- Some operations may require database queries to find related entities (e.g., household calendar, business calendar)
- Budget and project management features may not be implemented yet - handle gracefully
- All implementations should follow the established pattern from Phase 1 & 2
- Remove all placeholder methods after implementation
- Update this plan as implementation progresses

