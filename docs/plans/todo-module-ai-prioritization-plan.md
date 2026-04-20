# Phase 4.1: AI Prioritization for To-Do Module - Comprehensive Plan

**Status**: Planning  
**Created**: January 2025  
**Goal**: Implement robust AI-powered task prioritization that integrates with the existing extensive AI system, provides contextual suggestions, and can actually execute priority changes autonomously (not just suggest).

---

## 🎯 Overview

This phase will create a comprehensive AI prioritization system that:
1. **Analyzes** task context (due dates, dependencies, time estimates, categories, projects)
2. **Suggests** priority levels with reasoning
3. **Executes** priority changes autonomously (based on user autonomy settings)
4. **Learns** from user corrections and patterns
5. **Integrates** with the existing Digital Life Twin, Autonomous Action Executor, and AI Context System
6. **Provides** visual feedback with blinking AI logo (like scheduling module)
7. **Offers** contextual suggestions panel with actionable prompts

---

## 🔍 Analysis of Existing AI System

### Current AI Infrastructure

#### 1. **Digital Life Twin Core** (`server/src/ai/core/DigitalLifeTwinCore.ts`)
- **Purpose**: Main AI engine that processes queries and determines actions
- **Task Support**: Already has `createTaskAction` method (line 611-614)
- **Action Types**: Can create schedule, communication, file, task, and analysis actions
- **Integration Point**: We'll extend `createTaskAction` to include priority analysis

#### 2. **Autonomous Action Executor** (`server/src/ai/actions/AutonomousActionExecutor.ts`)
- **Purpose**: Actually executes actions (not just suggests)
- **Task Execution**: Has `executeCreateTask` method (line 270-293) - **CAN CREATE TASKS**
- **Current Limitation**: Only creates tasks, doesn't update priorities
- **Integration Point**: Add `updateTaskPriority` action type and execution method

#### 3. **Action Executor** (`server/src/ai/core/ActionExecutor.ts`)
- **Purpose**: Module-specific action execution
- **Task Support**: Has `executeTasksAction` method (line 187)
- **Integration Point**: Extend to handle priority updates, bulk operations

#### 4. **Autonomy Manager** (`server/src/ai/autonomy/AutonomyManager.ts`)
- **Purpose**: Determines if actions can execute autonomously or need approval
- **Features**: Risk assessment, confidence scoring, approval workflows
- **Integration Point**: Configure autonomy levels for priority changes (low risk = high autonomy)

#### 5. **AI Context System** (`server/src/controllers/todoAIContextController.ts`)
- **Current Providers**: `overview`, `upcoming`, `overdue`, `priority`
- **Integration Point**: Add new context provider: `priority_analysis` for AI prioritization engine

#### 6. **Scheduling AI Pattern** (`web/src/components/scheduling/SchedulingAIAssistant.tsx`)
- **Blinking Logo**: Context-aware pulsing animation in `GlobalHeaderTabs.tsx` (line 361-395)
- **Suggested Prompts**: Shows contextual action buttons when AI assistant opens
- **Auto-Execution**: Can actually generate schedules (not just suggest)
- **Integration Point**: Replicate this pattern for To-Do module

---

## 🏗️ Architecture Design

### System Flow

```
User Opens To-Do Module
    ↓
AI Logo Blinks (if suggestions available)
    ↓
User Clicks AI Logo
    ↓
AIChatDropdown Opens with To-Do Context
    ↓
AI Analyzes Tasks (via priority_analysis context provider)
    ↓
AI Generates Priority Suggestions
    ↓
[Autonomy Check]
    ├─ High Autonomy + Low Risk → Execute Automatically
    ├─ Medium Autonomy → Show Approval Request
    └─ Low Autonomy → Show Suggestions Only
    ↓
User Reviews/Approves
    ↓
Priority Changes Executed
    ↓
Learning Event Recorded
```

### Component Architecture

```
To-Do Module
├─ TodoModule.tsx
│   ├─ AI Logo (blinks when suggestions available)
│   └─ AIPrioritySuggestions Panel (optional sidebar)
│
├─ AIChatDropdown (Global)
│   └─ To-Do Context Integration
│       ├─ Module-specific prompts
│       ├─ Priority analysis results
│       └─ Action buttons
│
└─ Backend AI System
    ├─ todoAIPrioritizationService.ts (NEW)
    │   ├─ analyzeTaskPriorities()
    │   ├─ generatePrioritySuggestions()
    │   ├─ calculatePriorityScore()
    │   └─ learnFromUserCorrections()
    │
    ├─ todoAIContextController.ts (EXTEND)
    │   └─ getPriorityAnalysisContext() (NEW)
    │
    ├─ todoController.ts (EXTEND)
    │   ├─ POST /api/todo/ai/prioritize (NEW)
    │   ├─ POST /api/todo/ai/prioritize/execute (NEW)
    │   └─ GET /api/todo/ai/prioritize/suggestions (NEW)
    │
    └─ AI System Integration
        ├─ DigitalLifeTwinCore (EXTEND createTaskAction)
        ├─ AutonomousActionExecutor (ADD updateTaskPriority)
        └─ ActionExecutor (EXTEND executeTasksAction)
```

---

## 📋 Implementation Plan

### Phase 4.1.1: Backend - Priority Analysis Service

**File**: `server/src/services/todoAIPrioritizationService.ts` (NEW)

**Functions**:
1. `analyzeTaskPriorities(tasks, context)` - Main analysis engine
   - Analyzes due dates (overdue = higher priority)
   - Considers dependencies (blocked tasks = lower priority)
   - Evaluates time estimates vs. deadlines
   - Checks project importance
   - Reviews category patterns
   - Considers user's historical priority patterns

2. `calculatePriorityScore(task, context)` - Scoring algorithm
   - Due date urgency (days until due)
   - Dependency status (blocked vs. ready)
   - Time estimate vs. available time
   - Project priority (if in project)
   - Category importance (learned from user)
   - Historical patterns (user's past priority choices)

3. `generatePrioritySuggestions(tasks, userId, businessId)` - Suggestion generator
   - Returns array of suggestions with:
     - `taskId`: Task to update
     - `currentPriority`: Current priority level
     - `suggestedPriority`: AI-suggested priority
     - `confidence`: 0-1 confidence score
     - `reasoning`: Human-readable explanation
     - `factors`: Array of factors influencing suggestion

4. `learnFromUserCorrections(userId, corrections)` - Learning system
   - Records when user accepts/rejects suggestions
   - Updates user-specific priority patterns
   - Improves future suggestions

**Priority Scoring Algorithm**:
```typescript
Priority Score = (
  DueDateUrgency * 0.30 +      // Overdue = 1.0, 1 day = 0.9, 7 days = 0.5, etc.
  DependencyStatus * 0.20 +    // Blocked = -0.3, Ready = 0.2
  TimePressure * 0.20 +        // Estimate vs. time until due
  ProjectImportance * 0.15 +    // Project priority (if applicable)
  CategoryWeight * 0.10 +       // Learned category importance
  HistoricalPattern * 0.05      // User's past choices for similar tasks
)

Priority Mapping:
- Score >= 0.8 → URGENT
- Score >= 0.6 → HIGH
- Score >= 0.4 → MEDIUM
- Score < 0.4 → LOW
```

---

### Phase 4.1.2: Backend - AI Context Provider Extension

**File**: `server/src/controllers/todoAIContextController.ts` (EXTEND)

**New Function**: `getPriorityAnalysisContext`
- **Endpoint**: `GET /api/todo/ai/context/priority-analysis`
- **Purpose**: Provides task data formatted for AI prioritization analysis
- **Returns**:
  ```typescript
  {
    summary: {
      totalTasks: number,
      needsPrioritization: number,  // Tasks with MEDIUM or no priority
      overdueCount: number,
      blockedCount: number
    },
    details: {
      tasks: Array<{
        id, title, priority, dueDate, status,
        dependencies: { blocked: boolean, blocking: number },
        timeEstimate, actualTimeSpent,
        project: { id, name, priority },
        category,
        createdAt
      }>
    }
  }
  ```

---

### Phase 4.1.3: Backend - API Endpoints

**File**: `server/src/controllers/todoController.ts` (EXTEND)

**New Endpoints**:

1. **GET `/api/todo/ai/prioritize/suggestions`**
   - Returns priority suggestions for current tasks
   - Calls `todoAIPrioritizationService.generatePrioritySuggestions()`
   - Returns suggestions with confidence scores

2. **POST `/api/todo/ai/prioritize/analyze`**
   - Analyzes specific tasks and returns priority recommendations
   - Accepts `taskIds` array (optional - analyzes all if not provided)
   - Returns detailed analysis with reasoning

3. **POST `/api/todo/ai/prioritize/execute`**
   - Executes priority changes (with autonomy check)
   - Accepts `suggestions` array with `taskId` and `newPriority`
   - Checks autonomy settings via `AutonomyManager`
   - If approved: Updates priorities via Prisma
   - If needs approval: Creates `AIApprovalRequest`
   - Records learning events

4. **POST `/api/todo/ai/prioritize/feedback`**
   - Records user feedback on suggestions
   - Accepts `suggestionId`, `accepted`, `actualPriority` (if different)
   - Updates learning model

---

### Phase 4.1.4: Backend - AI System Integration

#### A. Extend Digital Life Twin Core

**File**: `server/src/ai/core/DigitalLifeTwinCore.ts` (EXTEND)

**Modify**: `createTaskAction` method (line 611-614)
- Add priority analysis when task-related queries detected
- Include priority suggestions in action data
- Set `requiresApproval` based on autonomy settings

**New Method**: `createPriorityAction`
- Detects priority-related queries ("prioritize my tasks", "what should I focus on")
- Calls `todoAIPrioritizationService.generatePrioritySuggestions()`
- Creates action with suggestions and execution plan

#### B. Extend Autonomous Action Executor

**File**: `server/src/ai/actions/AutonomousActionExecutor.ts` (EXTEND)

**Add**: `updateTaskPriority` action type
- New case in `performAction` switch (line 168)
- New method: `executeUpdateTaskPriority(action, template)`
- Actually updates task priorities in database via Prisma
- Handles bulk updates
- Records success/failure

#### C. Implement Action Executor (To-Do Module)

**File**: `server/src/ai/core/ActionExecutor.ts` (IMPLEMENT)

**Current Status**: `executeTasksAction` is a TODO stub (line 490-504)

**Pattern to Follow**: Use Scheduling module as reference (line 731-886)
- Scheduling imports controller functions directly: `import('../../controllers/schedulingController')`
- Calls controller functions with mock req/res objects
- Returns proper `ActionExecutionResult` format

**Implementation**:
```typescript
private async executeTasksAction(action: AIAction, userContext: UserContext): Promise<ActionExecutionResult> {
  try {
    const { operation, parameters } = action;

    switch (operation) {
      case 'update_priority': {
        // Import todoController directly
        const { updateTask } = await import('../../controllers/todoController');
        
        const mockReq = {
          user: { id: userContext.userId },
          params: { id: parameters.taskId },
          body: { priority: parameters.newPriority }
        } as any;
        
        let result: any = {};
        const mockRes = {
          json: (data: any) => { result = data; },
          status: (code: number) => ({ json: (data: any) => { result = { ...data, statusCode: code }; } })
        } as any;

        await updateTask(mockReq, mockRes);

        return {
          actionId: action.id,
          success: !result.statusCode || result.statusCode === 200,
          result: result,
          metadata: {
            executionTime: 0,
            module: 'todo',
            operation: 'update_priority',
            affectedUsers: [],
            rollbackAvailable: true
          }
        };
      }

      case 'bulk_update_priority': {
        // Handle multiple priority updates
        const { taskIds, newPriority } = parameters;
        const results = [];
        
        for (const taskId of taskIds) {
          // Call updateTask for each task
          // ... similar to above
        }

        return {
          actionId: action.id,
          success: true,
          result: { updated: results.length },
          metadata: { ... }
        };
      }

      case 'create_task': {
        const { createTask } = await import('../../controllers/todoController');
        // ... similar pattern
      }

      case 'complete_task': {
        const { completeTask } = await import('../../controllers/todoController');
        // ... similar pattern
      }

      default:
        return {
          actionId: action.id,
          success: false,
          error: `Unknown todo operation: ${operation}`,
          metadata: { ... }
        };
    }
  } catch (error) {
    // Error handling
  }
}
```

**Operations to Support**:
- `update_priority` - Update single task priority
- `bulk_update_priority` - Update multiple task priorities
- `create_task` - Create new task
- `update_task` - Update task fields
- `complete_task` - Mark task as done
- `reopen_task` - Reopen completed task

---

### Phase 4.1.5: Frontend - AI Logo Blinking

**File**: `web/src/components/GlobalHeaderTabs.tsx` (EXTEND)

**Add**: To-Do module detection (similar to scheduling)
- Detect when user is in To-Do module (`pathname.includes('/todo')`)
- Set `isInTodo` state
- Show pulsing animation when:
  - User is in To-Do module
  - AI suggestions are available (poll `/api/todo/ai/prioritize/suggestions`)
  - AI dropdown is not open

**Animation**: Same pattern as scheduling (pulse-ring, color-wave, glow-pulse)

---

### Phase 4.1.6: Frontend - AI Chat Integration

**File**: `web/src/components/header/AIChatDropdown.tsx` (EXTEND)

**Add**: To-Do module context support
- Detect To-Do module context (similar to scheduling)
- Show To-Do-specific suggested prompts:
  ```typescript
  const TODO_PROMPTS = [
    { icon: Zap, text: 'Prioritize my tasks', action: 'prioritize' },
    { icon: Lightbulb, text: 'What should I focus on today?', action: 'focus' },
    { icon: TrendingUp, text: 'Optimize task priorities', action: 'optimize' },
    { icon: AlertCircle, text: 'Show overdue tasks', action: 'overdue' },
  ];
  ```
- Pass To-Do context to AI endpoint:
  ```typescript
  moduleContext: isInTodo ? {
    module: 'todo',
    dashboardId: currentDashboardId,
    businessId: businessId,
  } : undefined
  ```

---

### Phase 4.1.7: Frontend - Priority Suggestions Panel

**File**: `web/src/components/todo/AIPrioritySuggestions.tsx` (NEW)

**Component Features**:
- Sidebar panel (similar to ProjectManager)
- Shows AI-generated priority suggestions
- Each suggestion shows:
  - Task title
  - Current priority (badge)
  - Suggested priority (badge)
  - Reasoning (collapsible)
  - Confidence score (visual indicator)
  - Action buttons: "Apply", "Dismiss", "View Task"
- Bulk actions: "Apply All", "Dismiss All"
- Auto-refresh when tasks change
- Shows when suggestions are available (badge count)

**Integration**: Add to `TodoModule.tsx` as optional sidebar

---

### Phase 4.1.8: Frontend - API Client

**File**: `web/src/api/todo.ts` (EXTEND)

**New Functions**:
```typescript
// Get priority suggestions
export async function getPrioritySuggestions(
  dashboardId: string,
  businessId?: string,
  token: string
): Promise<PrioritySuggestion[]>

// Analyze tasks for prioritization
export async function analyzeTaskPriorities(
  taskIds?: string[],
  token: string
): Promise<PriorityAnalysis>

// Execute priority changes
export async function executePriorityChanges(
  suggestions: Array<{ taskId: string; newPriority: TaskPriority }>,
  token: string
): Promise<{ success: boolean; updated: number; requiresApproval?: boolean }>

// Provide feedback on suggestions
export async function submitPriorityFeedback(
  suggestionId: string,
  accepted: boolean,
  actualPriority?: TaskPriority,
  token: string
): Promise<{ success: boolean }>
```

---

### Phase 4.1.9: Frontend - Real-time Suggestion Detection

**File**: `web/src/components/todo/TodoModule.tsx` (EXTEND)

**Add**:
- Poll for AI suggestions on mount and task changes
- Set state when suggestions available
- Trigger AI logo blinking via custom event (similar to scheduling)
- Show notification badge when suggestions ready

**Event System**:
```typescript
// Dispatch event when suggestions available
window.dispatchEvent(new CustomEvent('todoAISuggestionsAvailable', {
  detail: { count: suggestions.length }
}));

// GlobalHeaderTabs listens for this event
window.addEventListener('todoAISuggestionsAvailable', (e) => {
  setHasTodoSuggestions(e.detail.count > 0);
});
```

---

## 🎨 UI/UX Design

### AI Logo Blinking Pattern
- **Location**: Global header (same as scheduling)
- **Trigger**: User in To-Do module + suggestions available
- **Animation**: 
  - Pulsing ring (expanding glow)
  - Rotating color wave (purple gradient)
  - Glow pulse on button
- **Stop**: When AI dropdown opens or user leaves To-Do module

### Priority Suggestions Panel
- **Layout**: Right sidebar (similar to ProjectManager)
- **Header**: "AI Priority Suggestions" with badge count
- **Suggestion Card**:
  ```
  ┌─────────────────────────────────────┐
  │ Task Title                          │
  │ Current: [MEDIUM] → Suggested: [HIGH] │
  │ Confidence: ████████░░ 80%           │
  │ ▼ Reasoning                         │
  │   • Due in 2 days                   │
  │   • Blocking 3 other tasks           │
  │   • High project priority           │
  │ [Apply] [Dismiss] [View Task]      │
  └─────────────────────────────────────┘
  ```

### AI Chat Integration
- **Suggested Prompts**: Show when To-Do context detected
- **Context-Aware Responses**: AI uses To-Do context providers
- **Action Execution**: Show "Execute" button when AI suggests priority changes
- **Approval Flow**: Show approval request modal if needed

---

## 🔄 Autonomous Execution Flow

### Autonomy Levels for Priority Changes

**Low Risk Actions** (High Autonomy):
- Changing MEDIUM → HIGH (within same day)
- Changing LOW → MEDIUM
- Bulk updates (3+ tasks) require approval

**Medium Risk Actions** (Medium Autonomy):
- Changing MEDIUM → URGENT
- Changing HIGH → LOW
- Requires approval if affects >5 tasks

**High Risk Actions** (Low Autonomy):
- Changing URGENT → LOW
- Bulk priority reductions
- Always requires approval

### Approval Request Format
```typescript
{
  actionType: 'update_task_priority',
  module: 'todo',
  parameters: {
    taskId: 'xxx',
    currentPriority: 'MEDIUM',
    newPriority: 'HIGH',
    reasoning: 'Due in 2 days and blocking 3 tasks'
  },
  requiresApproval: true,
  approvalReason: 'Changing priority to HIGH based on urgency',
  confidence: 0.85
}
```

---

## 📊 Learning System

### User Pattern Tracking
- Record when user accepts/rejects suggestions
- Track actual priority choices vs. AI suggestions
- Learn category-specific patterns:
  - "User always prioritizes 'work' tasks HIGH"
  - "User never prioritizes 'personal' tasks URGENT"
- Learn time-based patterns:
  - "User prioritizes tasks due today as URGENT"
  - "User doesn't prioritize tasks due >1 week"

### Learning Data Storage
- Use existing `AILearningEvent` table
- Store: `suggestionId`, `accepted`, `actualPriority`, `factors`
- Aggregate patterns in `UserAIContextCache`

---

## 🔌 Integration Points

### 1. Digital Life Twin Integration
- **Query Examples**:
  - "Prioritize my tasks" → Calls `createPriorityAction`
  - "What should I focus on?" → Analyzes and suggests
  - "Update task priorities" → Executes priority changes

### 2. Autonomous Action System
- **Action Type**: `update_task_priority`
- **Autonomy Check**: Via `AutonomyManager.evaluateAutonomy()`
- **Execution**: Via `AutonomousActionExecutor.executeUpdateTaskPriority()`

### 3. AI Context System
- **New Provider**: `priority_analysis`
- **Usage**: AI calls this when user asks priority-related questions
- **Response**: Structured task data for AI analysis

### 4. Existing To-Do Features
- **Dependencies**: Consider blocking status in priority calculation
- **Projects**: Use project importance in scoring
- **Time Tracking**: Use time estimates vs. actual time
- **Recurring Tasks**: Handle parent/instance relationships

---

## 📝 API Endpoints Summary

### New Endpoints
1. `GET /api/todo/ai/prioritize/suggestions` - Get suggestions
2. `POST /api/todo/ai/prioritize/analyze` - Analyze specific tasks
3. `POST /api/todo/ai/prioritize/execute` - Execute priority changes
4. `POST /api/todo/ai/prioritize/feedback` - Submit user feedback
5. `GET /api/todo/ai/context/priority-analysis` - AI context provider

### Extended Endpoints
- `/api/ai/twin` - Already supports task queries, will use new context
- `/api/ai/actions/execute` - Will handle `update_task_priority` actions
- `/api/ai/autonomous/suggest` - Will suggest priority actions

---

## 🧪 Testing Strategy

### Unit Tests
- Priority scoring algorithm accuracy
- Suggestion generation logic
- Learning system pattern recognition

### Integration Tests
- AI context provider responses
- Autonomous action execution
- Approval workflow

### Manual Testing
- AI logo blinking in To-Do module
- Suggestion panel functionality
- Priority changes execution
- Learning from user corrections

---

## 📈 Success Metrics

### User Experience
- ✅ AI logo blinks when suggestions available
- ✅ Users can see priority suggestions with reasoning
- ✅ Users can apply suggestions with one click
- ✅ AI learns from user corrections
- ✅ Suggestions improve over time

### Technical
- ✅ Priority suggestions generated in <2 seconds
- ✅ Autonomy system correctly evaluates risk
- ✅ Priority changes execute successfully
- ✅ Learning events recorded properly
- ✅ AI context provider returns accurate data

### Business Value
- ✅ Users save time on task prioritization
- ✅ Tasks are prioritized more effectively
- ✅ Overdue tasks reduced
- ✅ User satisfaction with AI assistance

---

## 🚀 Implementation Order

1. **Backend Service** (4.1.1) - Priority analysis engine
2. **AI Context Provider** (4.1.2) - Extend context system
3. **API Endpoints** (4.1.3) - REST API for suggestions
4. **AI System Integration** (4.1.4) - Connect to Digital Life Twin
5. **Frontend API Client** (4.1.8) - API functions
6. **AI Logo Blinking** (4.1.5) - Visual feedback
7. **AI Chat Integration** (4.1.6) - Context-aware prompts
8. **Suggestions Panel** (4.1.7) - UI component
9. **Real-time Detection** (4.1.9) - Polling and events

---

## 🔮 Future Enhancements (Post-4.1)

### Phase 4.1.5: Advanced Features
- **Smart Scheduling Integration**: Suggest due dates based on priorities
- **Time Blocking**: Auto-schedule high-priority tasks in calendar
- **Dependency-Aware Prioritization**: Consider task chains
- **Team Prioritization**: For business contexts
- **Priority Templates**: Save and apply priority patterns

---

## 📚 Files to Create/Modify

### New Files
- `server/src/services/todoAIPrioritizationService.ts`
- `web/src/components/todo/AIPrioritySuggestions.tsx`
- `docs/todo-module-ai-prioritization-plan.md` (this file)

### Modified Files
- `server/src/controllers/todoAIContextController.ts` - Add priority-analysis provider
- `server/src/controllers/todoController.ts` - Add prioritization endpoints
- `server/src/routes/todo.ts` - Register new routes
- `server/src/ai/core/DigitalLifeTwinCore.ts` - Extend task actions
- `server/src/ai/actions/AutonomousActionExecutor.ts` - Add priority update execution
- `server/src/ai/core/ActionExecutor.ts` - **IMPLEMENT** `executeTasksAction` (currently TODO stub)
- `web/src/components/GlobalHeaderTabs.tsx` - Add To-Do blinking logic
- `web/src/components/header/AIChatDropdown.tsx` - Add To-Do prompts
- `web/src/components/todo/TodoModule.tsx` - Add suggestions panel, polling
- `web/src/api/todo.ts` - Add prioritization API functions
- `memory-bank/todoProductContext.md` - Document AI features
- `memory-bank/activeContext.md` - Update current focus

---

## ✅ Acceptance Criteria

### Must Have
- [ ] AI logo blinks in To-Do module when suggestions available
- [ ] Priority suggestions generated with confidence scores
- [ ] Suggestions show reasoning (due dates, dependencies, etc.)
- [ ] Users can apply suggestions individually or in bulk
- [ ] Priority changes execute via autonomous action system
- [ ] Autonomy system evaluates risk correctly
- [ ] Learning system records user feedback
- [ ] AI context provider returns priority analysis data
- [ ] AI chat shows To-Do-specific prompts
- [ ] Suggestions panel displays in TodoModule

### Nice to Have
- [ ] Real-time suggestion updates (WebSocket)
- [ ] Priority change history/undo
- [ ] Batch priority operations
- [ ] Priority templates/presets
- [ ] Team-wide priority suggestions (business context)

---

**Estimated Time**: 3-4 days  
**Priority**: High (enables AI-powered task management)  
**Dependencies**: Existing AI system (all components already built)

---

**Last Updated**: January 2025  
**Status**: Ready for Implementation

