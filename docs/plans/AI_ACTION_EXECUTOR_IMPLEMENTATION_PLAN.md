# AI Action Executor Implementation Plan

## Overview
This plan outlines the implementation of action executors for all modules in the AI system. Currently, only the **Tasks/To-Do** module has a fully implemented executor that directly calls controller functions. All other modules need implementation.

## Current Status

### ✅ Fully Implemented
- **Tasks/To-Do** - Direct controller calls (`todoController`)

### ⚠️ Partially Implemented (TODOs)
- **Drive** - Uses `callDriveAPI()` (needs real implementation)
- **Chat** - Uses `callChatAPI()` (needs real implementation)
- **Notifications** - Uses helper methods (needs real implementation)
- **Scheduling** - Partially implemented
- **Household** - Uses helper methods (needs real implementation)
- **Business** - Uses helper methods (needs real implementation)
- **Dashboard** - Uses `callDashboardAPI()` (needs real implementation)

### ❌ Not Implemented
- **Calendar** - Returns error "Calendar module not yet implemented"
- **HR** - Not registered in executor map

---

## Implementation Strategy

### Pattern to Follow (Tasks Module Example)
```typescript
case 'create_task': {
  const { title, description, priority, dueDate, dashboardId, businessId } = parameters || {};
  
  // Directly import and call controller
  const { createTask } = await import('../../controllers/todoController');
  
  // Create mock request/response
  const mockReq = {
    user: { id: userContext.userId },
    body: { title, description, priority, dueDate, dashboardId, businessId }
  } as any;
  
  let result: any = {};
  const mockRes = {
    json: (data: any) => { result = data; },
    status: (code: number) => ({ json: (data: any) => { result = { ...data, statusCode: code }; } })
  } as any;
  
  // Execute controller
  await createTask(mockReq, mockRes);
  
  return {
    actionId: action.id,
    success: !result.statusCode || result.statusCode === 200 || result.statusCode === 201,
    result: result,
    metadata: { ... }
  };
}
```

---

## Module Implementation Plans

### 1. Calendar Module ⚠️ HIGH PRIORITY

**Current Status**: Not implemented (returns error)

**Controller**: `calendarController.ts`

**Available Operations**:
- `createEvent` - Create calendar event
- `updateEvent` - Update existing event
- `deleteEvent` - Delete event
- `rsvpEvent` - RSVP to event
- `createCalendar` - Create new calendar
- `listEventsInRange` - Get events in date range
- `checkConflicts` - Check for scheduling conflicts
- `getFreeBusy` - Get free/busy times

**AI Actions to Implement**:
```typescript
case 'create_event': {
  // Import calendarController.createEvent
  // Extract: title, description, startAt, endAt, calendarId, participants
  // Call createEvent with mockReq/mockRes
}

case 'update_event': {
  // Import calendarController.updateEvent
  // Extract: eventId, updates (title, startAt, endAt, etc.)
  // Call updateEvent
}

case 'delete_event': {
  // Import calendarController.deleteEvent
  // Extract: eventId
  // Call deleteEvent
}

case 'rsvp_event': {
  // Import calendarController.rsvpEvent
  // Extract: eventId, response (ACCEPTED/DECLINED/TENTATIVE)
  // Call rsvpEvent
}

case 'check_conflicts': {
  // Import calendarController.checkConflicts
  // Extract: startAt, endAt, calendarIds
  // Call checkConflicts
}
```

**Files to Modify**:
- `server/src/ai/core/ActionExecutor.ts` - Implement `executeCalendarAction()`

**Estimated Effort**: 2-3 hours

---

### 2. Drive/File Hub Module ⚠️ HIGH PRIORITY

**Current Status**: Uses `callDriveAPI()` (TODO)

**Controllers**: 
- `fileController.ts` - File operations
- `folderController.ts` - Folder operations

**Available Operations**:
- `uploadFile` - Upload file
- `deleteFile` - Delete file
- `moveFile` - Move file to folder
- `shareFile` - Share file with users
- `createFolder` - Create folder
- `updateFolder` - Update folder
- `deleteFolder` - Delete folder

**AI Actions to Implement**:
```typescript
case 'upload_file': {
  // Import fileController.uploadFile
  // Extract: file (buffer), fileName, folderId, dashboardId
  // Call uploadFile
}

case 'create_folder': {
  // Import folderController.createFolder
  // Extract: name, parentFolderId, dashboardId
  // Call createFolder
}

case 'move_file': {
  // Import fileController.moveFile
  // Extract: fileId, targetFolderId
  // Call moveFile
}

case 'share_file': {
  // Import fileController.shareFile (or folderController.shareFolder)
  // Extract: fileId/folderId, userIds, permission (VIEW/EDIT)
  // Call share function
}

case 'organize_files': {
  // Import fileController and folderController
  // Extract: criteria (by date, type, etc.)
  // Implement file organization logic
}
```

**Files to Modify**:
- `server/src/ai/core/ActionExecutor.ts` - Replace `executeDriveAction()` with real implementation

**Estimated Effort**: 3-4 hours

---

### 3. Chat Module ⚠️ HIGH PRIORITY

**Current Status**: Uses `callChatAPI()` (TODO)

**Controller**: `chatController.ts`

**Available Operations**:
- `createConversation` - Create new conversation
- `sendMessage` - Send message in conversation
- `updateConversation` - Update conversation details
- `deleteConversation` - Delete conversation

**AI Actions to Implement**:
```typescript
case 'send_message': {
  // Import chatController.sendMessage
  // Extract: conversationId, content, attachments
  // Call sendMessage
}

case 'create_conversation': {
  // Import chatController.createConversation
  // Extract: participants, title, type (DIRECT/GROUP)
  // Call createConversation
}

case 'respond_to_message': {
  // Import chatController.sendMessage
  // Extract: conversationId, messageId (to reply to), content
  // Call sendMessage with reply context
}

case 'schedule_message': {
  // This might need a new service or scheduled job
  // Store message with scheduled time, execute later
}
```

**Files to Modify**:
- `server/src/ai/core/ActionExecutor.ts` - Replace `executeChatAction()` with real implementation

**Estimated Effort**: 2-3 hours

---

### 4. HR Module ❌ NEW

**Current Status**: Not registered in executor map

**Controller**: `hrController.ts`

**Available Operations** (need to verify):
- Employee management
- Time-off requests
- Attendance tracking
- Employee directory

**AI Actions to Implement**:
```typescript
// First, add to moduleExecutors map:
hr: this.executeHRAction.bind(this),

// Then implement:
private async executeHRAction(action: AIAction, userContext: UserContext) {
  switch (operation) {
    case 'create_time_off_request': {
      // Import hrController function for time-off
      // Extract: employeeId, startDate, endDate, type, reason
      // Call controller
    }
    
    case 'approve_time_off': {
      // Import hrController approval function
      // Extract: requestId, approved
      // Call controller
    }
    
    case 'clock_in': {
      // Import hrController clock in function
      // Extract: employeeId, location
      // Call controller
    }
    
    case 'clock_out': {
      // Import hrController clock out function
      // Extract: employeeId
      // Call controller
    }
  }
}
```

**Files to Modify**:
- `server/src/ai/core/ActionExecutor.ts` - Add `hr` to `moduleExecutors` and implement `executeHRAction()`

**Estimated Effort**: 2-3 hours (need to verify HR controller functions first)

---

### 5. Scheduling Module ⚠️ PARTIAL

**Current Status**: Partially implemented (has `generate_schedule`)

**Controller**: `schedulingController.ts`

**Available Operations** (need to verify):
- Create schedule
- Create shift
- Update shift
- Delete shift
- Assign employee to shift

**AI Actions to Implement**:
```typescript
case 'create_shift': {
  // Import schedulingController.createShift
  // Extract: scheduleId, employeeId, startTime, endTime, positionId
  // Call controller
}

case 'update_shift': {
  // Import schedulingController.updateShift
  // Extract: shiftId, updates
  // Call controller
}

case 'assign_employee': {
  // Import schedulingController.assignEmployee
  // Extract: shiftId, employeeId
  // Call controller
}

case 'generate_schedule': {
  // Already implemented, verify it works correctly
}
```

**Files to Modify**:
- `server/src/ai/core/ActionExecutor.ts` - Complete `executeSchedulingAction()`

**Estimated Effort**: 2-3 hours

---

### 6. Notifications Module ⚠️ MEDIUM PRIORITY

**Current Status**: Uses helper methods (TODO)

**Controller**: `notificationController.ts` or `advancedNotificationController.ts`

**Available Operations** (need to verify):
- Send notification
- Schedule notification
- Mark as read
- Create notification preference

**AI Actions to Implement**:
```typescript
case 'send_notification': {
  // Import notificationController
  // Extract: userId, title, message, type, priority
  // Call controller
}

case 'schedule_reminder': {
  // Import notificationController or create scheduled job
  // Extract: userId, message, scheduledTime
  // Store and execute at scheduled time
}
```

**Files to Modify**:
- `server/src/ai/core/ActionExecutor.ts` - Replace `executeNotificationsAction()` with real implementation

**Estimated Effort**: 1-2 hours

---

### 7. Dashboard Module ⚠️ LOW PRIORITY

**Current Status**: Uses `callDashboardAPI()` (TODO)

**Controller**: `dashboardController.ts`

**Available Operations** (need to verify):
- Create widget
- Update layout
- Add module to dashboard

**AI Actions to Implement**:
```typescript
case 'create_widget': {
  // Import dashboardController or widgetController
  // Extract: type, position, config
  // Call controller
}

case 'update_layout': {
  // Import dashboardController
  // Extract: dashboardId, layout (grid positions)
  // Call controller
}

case 'add_module': {
  // Import moduleController or dashboardController
  // Extract: dashboardId, moduleId
  // Call controller
}
```

**Files to Modify**:
- `server/src/ai/core/ActionExecutor.ts` - Replace `executeDashboardAction()` with real implementation

**Estimated Effort**: 1-2 hours

---

### 8. Household Module ⚠️ LOW PRIORITY

**Current Status**: Uses helper methods (TODO)

**Controller**: `householdController.ts`

**Available Operations** (need to verify):
- Assign task
- Schedule event
- Notify members
- Manage budget

**AI Actions to Implement**:
```typescript
case 'assign_task': {
  // Import householdController
  // Extract: householdId, memberId, task details
  // Call controller
}

case 'schedule_event': {
  // Import householdController or calendarController
  // Extract: householdId, event details
  // Call controller
}

case 'notify_members': {
  // Import householdController or notificationController
  // Extract: householdId, message
  // Call controller
}
```

**Files to Modify**:
- `server/src/ai/core/ActionExecutor.ts` - Replace `executeHouseholdAction()` with real implementation

**Estimated Effort**: 2-3 hours

---

### 9. Business Module ⚠️ LOW PRIORITY

**Current Status**: Uses helper methods (TODO)

**Controller**: `businessController.ts`

**Available Operations** (need to verify):
- Schedule meeting
- Delegate task
- Generate report
- Update project

**AI Actions to Implement**:
```typescript
case 'schedule_meeting': {
  // Import calendarController or businessController
  // Extract: businessId, participants, time, agenda
  // Call controller
}

case 'delegate_task': {
  // Import todoController or businessController
  // Extract: taskId, assigneeId
  // Call controller
}

case 'generate_report': {
  // Import analyticsController or businessController
  // Extract: businessId, reportType, dateRange
  // Call controller
}
```

**Files to Modify**:
- `server/src/ai/core/ActionExecutor.ts` - Replace `executeBusinessAction()` with real implementation

**Estimated Effort**: 2-3 hours

---

## Implementation Priority

### Phase 1: Critical Modules (High Priority)
1. **Calendar** - Most commonly used, currently broken
2. **Drive/File Hub** - Core functionality, widely used
3. **Chat** - Communication is essential

**Estimated Time**: 7-10 hours

### Phase 2: Important Modules (Medium Priority)
4. **HR** - Business-critical for enterprise users
5. **Scheduling** - Complete partial implementation
6. **Notifications** - Enhance user experience

**Estimated Time**: 5-8 hours

### Phase 3: Supporting Modules (Low Priority)
7. **Dashboard** - Nice to have
8. **Household** - Niche use case
9. **Business** - Generic operations

**Estimated Time**: 5-8 hours

---

## Implementation Checklist

### For Each Module:
- [ ] Review controller functions available
- [ ] Identify which operations make sense for AI actions
- [ ] Add module to `moduleExecutors` map (if not present)
- [ ] Implement `execute[Module]Action()` method
- [ ] Add operation cases (create, update, delete, etc.)
- [ ] Import controller functions directly
- [ ] Create mock request/response objects
- [ ] Handle errors gracefully
- [ ] Return proper `ActionExecutionResult`
- [ ] Test with sample AI queries
- [ ] Update documentation

### Testing Strategy:
1. Test each operation individually
2. Test error handling (missing parameters, invalid IDs)
3. Test with different user contexts (personal, business)
4. Test autonomy settings (requires approval vs auto-execute)
5. Verify actions are logged correctly

---

## Code Quality Standards

### Follow Tasks Module Pattern:
- ✅ Direct controller imports (not API calls)
- ✅ Mock request/response objects
- ✅ Proper error handling
- ✅ Consistent return format
- ✅ Type safety (avoid `any` where possible)
- ✅ Clear operation names
- ✅ Parameter validation

### Error Handling:
```typescript
try {
  // Execute action
  await controllerFunction(mockReq, mockRes);
  
  return {
    actionId: action.id,
    success: !result.statusCode || result.statusCode === 200,
    result: result,
    metadata: { ... }
  };
} catch (error) {
  return {
    actionId: action.id,
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
    metadata: { ... }
  };
}
```

---

## Next Steps

1. **Start with Calendar Module** (highest priority, currently broken)
2. **Verify controller functions** for each module before implementing
3. **Implement one module at a time** to maintain code quality
4. **Test thoroughly** before moving to next module
5. **Update this plan** as implementation progresses

---

## Notes

- Some modules might need new controller functions if they don't exist
- Some operations (like `schedule_message`) might need background job infrastructure
- Consider adding action logging/audit trail for all executed actions
- May need to handle file uploads differently (buffers vs files)
- Consider rate limiting for AI-initiated actions

---

## Third-Party Developer Integration

### Current Problem

The `ActionExecutor` currently has a **hardcoded map** of module executors:

```typescript
const moduleExecutors = {
  drive: this.executeDriveAction.bind(this),
  chat: this.executeChatAction.bind(this),
  // ... hardcoded modules only
};
```

**This means third-party modules cannot execute actions through the AI system.**

### Solution: Dynamic Action Executor Registry

We need to create a **plugin system** that allows third-party modules to register their action executors.

#### Architecture Design

**1. Create Action Executor Registry Service**

```typescript
// server/src/ai/core/ActionExecutorRegistry.ts

export interface ModuleActionExecutor {
  moduleId: string;
  execute: (action: AIAction, userContext: UserContext) => Promise<ActionExecutionResult>;
  supportedOperations: string[];
}

export class ActionExecutorRegistry {
  private executors: Map<string, ModuleActionExecutor> = new Map();
  
  /**
   * Register an action executor for a module
   * Called during module installation/activation
   */
  register(executor: ModuleActionExecutor): void {
    this.executors.set(executor.moduleId, executor);
    console.log(`✅ Registered action executor for module: ${executor.moduleId}`);
  }
  
  /**
   * Get executor for a module
   */
  get(moduleId: string): ModuleActionExecutor | undefined {
    return this.executors.get(moduleId);
  }
  
  /**
   * Check if module has executor registered
   */
  has(moduleId: string): boolean {
    return this.executors.has(moduleId);
  }
  
  /**
   * List all registered modules
   */
  listModules(): string[] {
    return Array.from(this.executors.keys());
  }
}

// Singleton instance
export const actionExecutorRegistry = new ActionExecutorRegistry();
```

**2. Update ActionExecutor to Use Registry**

```typescript
// server/src/ai/core/ActionExecutor.ts

import { actionExecutorRegistry } from './ActionExecutorRegistry';

export class ActionExecutor {
  // ... existing code ...
  
  private async executeByModule(action: AIAction, userContext: UserContext): Promise<ActionExecutionResult> {
    // First, check if module has registered executor (third-party)
    const registeredExecutor = actionExecutorRegistry.get(action.module);
    if (registeredExecutor) {
      // Check if operation is supported
      if (!registeredExecutor.supportedOperations.includes(action.operation)) {
        throw new Error(`Operation '${action.operation}' not supported by module '${action.module}'`);
      }
      return registeredExecutor.execute(action, userContext);
    }
    
    // Fall back to built-in executors
    const moduleExecutors = {
      drive: this.executeDriveAction.bind(this),
      chat: this.executeChatAction.bind(this),
      // ... existing built-in modules
    };
    
    const executor = moduleExecutors[action.module as keyof typeof moduleExecutors];
    if (!executor) {
      throw new Error(`No executor found for module: ${action.module}`);
    }
    
    return executor(action, userContext);
  }
}
```

**3. API Endpoint for Third-Party Registration**

```typescript
// server/src/routes/modules.ts (or new route)

/**
 * POST /api/modules/:moduleId/ai/actions/register
 * Register action executor for third-party module
 */
router.post('/:moduleId/ai/actions/register', authenticateJWT, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user?.id;
    
    // Verify module is installed and user has permission
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    // Verify user has permission to register (module owner/admin)
    // ... permission check ...
    
    // Register executor (this would be called from module's installation script)
    // Note: Actual executor function would need to be provided via webhook or file upload
    // For now, we'll use a callback URL pattern
    
    const { executorUrl, supportedOperations } = req.body;
    
    // Store executor configuration
    await prisma.module.update({
      where: { id: moduleId },
      data: {
        manifest: {
          ...module.manifest,
          aiActionExecutor: {
            executorUrl, // URL to call for action execution
            supportedOperations,
            registeredAt: new Date()
          }
        }
      }
    });
    
    res.json({ success: true, message: 'Action executor registered' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});
```

**4. Webhook-Based Execution (For External Modules)**

For modules hosted externally, use webhook pattern:

```typescript
// When AI wants to execute action for third-party module
const module = await prisma.module.findUnique({ where: { id: action.module } });
const executorConfig = module.manifest?.aiActionExecutor;

if (executorConfig?.executorUrl) {
  // Call external webhook
  const response = await fetch(executorConfig.executorUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${moduleApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: action.operation,
      parameters: action.parameters,
      userId: userContext.userId,
      context: userContext
    })
  });
  
  return await response.json();
}
```

**5. In-Process Execution (For Installed Modules)**

For modules installed in the same codebase:

```typescript
// Module provides executor function during installation
// server/src/modules/third-party/[moduleId]/actionExecutor.ts

export async function executeAction(
  action: AIAction,
  userContext: UserContext
): Promise<ActionExecutionResult> {
  const { operation, parameters } = action;
  
  switch (operation) {
    case 'create_item':
      // Import and call module's controller
      const { createItem } = await import('../controllers/itemController');
      // ... execute ...
      break;
    // ... more operations
  }
}

// During module installation:
import { actionExecutorRegistry } from '@/ai/core/ActionExecutorRegistry';
import { executeAction } from './actionExecutor';

actionExecutorRegistry.register({
  moduleId: 'your-module',
  execute: executeAction,
  supportedOperations: ['create_item', 'update_item', 'delete_item']
});
```

### Third-Party Developer Requirements

**Add to Module Development Rules:**

#### Mandatory: AI Action Executor Integration

Every module that wants AI to execute actions **MUST**:

1. **Define Supported Operations**
   ```typescript
   const SUPPORTED_OPERATIONS = [
     'create_item',
     'update_item',
     'delete_item',
     // ... list all operations AI can execute
   ];
   ```

2. **Implement Action Executor**
   ```typescript
   // Option A: In-process (module installed in codebase)
   export async function executeAction(
     action: AIAction,
     userContext: UserContext
   ): Promise<ActionExecutionResult> {
     // Import your controllers
     // Execute based on action.operation
     // Return ActionExecutionResult
   }
   
   // Option B: Webhook (external module)
   // Provide executorUrl that accepts POST requests
   // Must return ActionExecutionResult format
   ```

3. **Register During Installation**
   ```typescript
   // During module installation/activation
   import { actionExecutorRegistry } from '@/ai/core/ActionExecutorRegistry';
   
   actionExecutorRegistry.register({
     moduleId: 'your-module',
     execute: executeAction,
     supportedOperations: SUPPORTED_OPERATIONS
   });
   ```

4. **Document Operations in AI Context**
   ```typescript
   const YOUR_MODULE_AI_CONTEXT: ModuleAIContext = {
     // ... existing context ...
     actions: [
       {
         name: 'create_item',
         description: 'Creates a new item in the module',
         permissions: ['module:write'],
         // AI will use this to generate actions
       }
     ]
   };
   ```

### Implementation Checklist for Third-Party Support

- [ ] Create `ActionExecutorRegistry` service
- [ ] Update `ActionExecutor` to check registry first, then built-in
- [ ] Add API endpoint for executor registration
- [ ] Add webhook support for external modules
- [ ] Update module development rules documentation
- [ ] Create example third-party module with action executor
- [ ] Add validation for executor registration
- [ ] Add security checks (permissions, rate limiting)
- [ ] Add logging/audit trail for third-party executions
- [ ] Update marketplace review process to check executor registration

### Security Considerations

1. **Permission Validation**: Verify user has permission to execute action
2. **Rate Limiting**: Limit AI-initiated actions per module
3. **Input Validation**: Validate all parameters before execution
4. **Audit Logging**: Log all third-party action executions
5. **Sandboxing**: Consider sandboxing for external webhook executors
6. **API Keys**: Require API keys for webhook-based executors

### Documentation Updates Needed

1. **Module Development Rules** (`.cursor/rules/module-development.mdc`)
   - Add "AI Action Executor" section
   - Include code examples
   - Add to mandatory checklist

2. **Module AI Context Guide** (`docs/archive/guides-merged-2026/MODULE_AI_CONTEXT_GUIDE.md`; patterns in `memory-bank/aiContextSystem.md`)
   - Add section on action executors
   - Explain when actions are executed vs just described

3. **Developer Portal**
   - Add action executor registration UI
   - Show registered executors
   - Test executor functionality

---

## Updated Implementation Priority

### Phase 0: Foundation (NEW - Required for Third-Party)
1. **Action Executor Registry** - Create registry system
2. **Update ActionExecutor** - Support dynamic registration
3. **API Endpoints** - Registration and execution endpoints
4. **Documentation** - Update developer guides

**Estimated Time**: 4-6 hours

### Phase 1: Critical Modules (High Priority)
1. **Calendar** - Most commonly used, currently broken
2. **Drive/File Hub** - Core functionality, widely used
3. **Chat** - Communication is essential

**Estimated Time**: 7-10 hours

### Phase 2: Important Modules (Medium Priority)
4. **HR** - Business-critical for enterprise users
5. **Scheduling** - Complete partial implementation
6. **Notifications** - Enhance user experience

**Estimated Time**: 5-8 hours

### Phase 3: Supporting Modules (Low Priority)
7. **Dashboard** - Nice to have
8. **Household** - Niche use case
9. **Business** - Generic operations

**Estimated Time**: 5-8 hours

**Total Estimated Time**: 21-32 hours (including Phase 0)

