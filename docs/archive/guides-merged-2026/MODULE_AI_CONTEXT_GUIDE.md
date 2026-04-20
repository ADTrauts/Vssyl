# 🤖 Module AI Context Guide for Developers

## Overview

The **Module AI Context Registry** system allows your module to be intelligently understood and queried by Vssyl's AI system. When users ask questions like "show my files" or "what meetings do I have today," the AI automatically detects which modules are relevant and fetches context only from those modules.

This guide explains how to make your module AI-aware.

---

## 🎯 Why Make Your Module AI-Aware?

### Without AI Context:
```
User: "Show my recent project files"
AI: ❌ Doesn't know which module handles "files"
Result: Generic response or no action
```

### With AI Context:
```
User: "Show my recent project files"
AI: ✅ Detects "files" keyword → Queries Drive module
AI: ✅ Fetches recent files from Drive context provider
Result: Smart, accurate response with actual data
```

---

## 📋 Implementation Checklist

- [ ] **Step 1:** Define AI context metadata for your module
- [ ] **Step 2:** Create context provider API endpoints
- [ ] **Step 3:** Register your module's AI context
- [ ] **Step 4:** (Optional) Implement action executor for AI to execute actions
- [ ] **Step 5:** Test with AI queries
- [ ] **Step 6:** Monitor performance in admin portal

---

## 🛠️ Step 1: Define AI Context Metadata

Create a comprehensive AI context definition that describes what your module does and how the AI should interact with it.

### Required Fields

```typescript
import { ModuleAIContext } from '@vssyl/shared/types/module-ai-context';

const YOUR_MODULE_AI_CONTEXT: ModuleAIContext = {
  // REQUIRED: Clear description of module's purpose
  purpose: "What your module does in one sentence",
  
  // REQUIRED: Module category
  category: "productivity | communication | business | household | entertainment | utilities",
  
  // REQUIRED: Keywords that trigger your module
  keywords: [
    "keyword1",
    "keyword2",
    "synonym1",
    "synonym2"
  ],
  
  // REQUIRED: Natural language patterns users might say
  patterns: [
    "show my *",
    "find * in module",
    "what's my *"
  ],
  
  // REQUIRED: Core concepts your module deals with
  concepts: [
    "concept1",
    "concept2",
    "concept3"
  ],
  
  // REQUIRED: Entities your module manages
  entities: [
    {
      name: "item",
      pluralName: "items",
      description: "What this entity represents"
    }
  ],
  
  // REQUIRED: Actions users can perform
  actions: [
    {
      name: "action-name",
      description: "What this action does",
      permissions: ["module:read", "module:write"]
    }
  ],
  
  // REQUIRED: Context provider endpoints (see Step 2)
  contextProviders: [
    {
      name: "providerName",
      endpoint: "/api/your-module/ai/context/provider-name",
      cacheDuration: 900000, // 15 minutes in ms
      description: "What this provider returns"
    }
  ],
  
  // OPTIONAL: Queryable data endpoints
  queryableData: [
    {
      dataType: "dataTypeName",
      endpoint: "/api/your-module/ai/query/data-type",
      description: "Dynamic queries supported",
      parameters: { param1: "type", param2: "type" }
    }
  ],
  
  // OPTIONAL: Relationships to other modules
  relationships: [
    {
      module: "other-module-id",
      type: "integrates | depends-on | extends",
      description: "How they relate"
    }
  ]
};
```

---

## 📊 Step 1 Example: Project Management Module

```typescript
const PROJECT_MANAGEMENT_AI_CONTEXT: ModuleAIContext = {
  purpose: "Manage projects, tasks, milestones, and team collaboration for business workflows",
  category: "business",
  
  keywords: [
    "project", "projects", "task", "tasks", "milestone", "milestones",
    "deadline", "sprint", "kanban", "board", "team", "assignment",
    "progress", "status", "deliverable", "roadmap"
  ],
  
  patterns: [
    "my projects",
    "project status *",
    "tasks for *",
    "what's due *",
    "team progress on *",
    "upcoming deadlines",
    "projects for client *",
    "assign * to *"
  ],
  
  concepts: [
    "project management",
    "task tracking",
    "team collaboration",
    "deadlines",
    "milestones",
    "project lifecycle",
    "agile workflows"
  ],
  
  entities: [
    {
      name: "project",
      pluralName: "projects",
      description: "A project with goals, tasks, and team members"
    },
    {
      name: "task",
      pluralName: "tasks",
      description: "An actionable item within a project"
    },
    {
      name: "milestone",
      pluralName: "milestones",
      description: "A significant checkpoint in a project timeline"
    }
  ],
  
  actions: [
    {
      name: "create-project",
      description: "Create a new project",
      permissions: ["projects:create"]
    },
    {
      name: "assign-task",
      description: "Assign a task to a team member",
      permissions: ["projects:assign"]
    },
    {
      name: "update-status",
      description: "Update project or task status",
      permissions: ["projects:update"]
    }
  ],
  
  contextProviders: [
    {
      name: "activeProjects",
      endpoint: "/api/projects/ai/context/active",
      cacheDuration: 600000, // 10 minutes
      description: "Get user's active projects with recent updates"
    },
    {
      name: "upcomingDeadlines",
      endpoint: "/api/projects/ai/context/deadlines",
      cacheDuration: 300000, // 5 minutes
      description: "Get upcoming project deadlines and milestones"
    }
  ],
  
  queryableData: [
    {
      dataType: "projectStatus",
      endpoint: "/api/projects/ai/query/status",
      description: "Get status of a specific project",
      parameters: { projectId: "string" }
    }
  ],
  
  relationships: [
    {
      module: "calendar",
      type: "integrates",
      description: "Project deadlines sync with calendar events"
    },
    {
      module: "chat",
      type: "integrates",
      description: "Team discussions linked to project context"
    }
  ]
};
```

---

## 🔌 Step 2: Create Context Provider Endpoints

Context providers are API endpoints that return real-time data about your module's content. The AI system calls these endpoints when it needs live data.

### Endpoint Requirements

1. **Authentication Required**: Use `authenticateJWT` middleware
2. **Return Format**: Structured JSON with `success`, `context`, and `metadata` fields
3. **Performance**: Respond quickly (< 500ms recommended)
4. **Error Handling**: Gracefully handle errors and return helpful messages

### Template: Context Provider Controller

```typescript
// controllers/yourModuleAIContextController.ts

import { Request, Response } from 'express';
import { prisma } from '../index';

/**
 * GET /api/your-module/ai/context/provider-name
 * 
 * Returns context data for AI queries
 */
export async function getYourContextProvider(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // Fetch your module's data
    const yourData = await prisma.yourModel.findMany({
      where: { userId },
      take: 10,
      orderBy: { updatedAt: 'desc' }
    });
    
    // Format for AI consumption
    const context = {
      items: yourData.map(item => ({
        id: item.id,
        name: item.name,
        // Include relevant fields only
        relevantField: item.field
      })),
      summary: {
        total: yourData.length,
        // Aggregate info the AI can use
      }
    };
    
    res.json({
      success: true,
      context,
      metadata: {
        provider: 'your-module',
        endpoint: 'provider-name',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error in getYourContextProvider:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch context',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

### Register Routes

```typescript
// routes/yourModule.ts

import { Router } from 'express';
import { getYourContextProvider } from '../controllers/yourModuleAIContextController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Your existing routes...

// AI Context Provider Endpoints
router.get('/ai/context/provider-name', authenticateJWT, getYourContextProvider);

export default router;
```

---

## 📡 Step 3: Register Your Module's AI Context

### Option A: Registration API (Recommended for Third-Party Modules)

```typescript
// When your module is installed/enabled

import axios from 'axios';

async function registerModuleAIContext(moduleId: string, moduleName: string) {
  try {
    const response = await axios.post(
      `/api/modules/${moduleId}/ai/context`,
      YOUR_MODULE_AI_CONTEXT,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Module AI context registered:', response.data);
  } catch (error) {
    console.error('❌ Failed to register AI context:', error);
  }
}

// Call during module installation
await registerModuleAIContext('your-module-id', 'Your Module Name');
```

### Option B: Registration Script (For Built-in Modules)

```typescript
// scripts/register-your-module.ts

import { moduleAIContextService } from '../server/src/ai/services/ModuleAIContextService';

async function main() {
  await moduleAIContextService.registerModuleContext(
    'your-module-id',
    'Your Module Name',
    YOUR_MODULE_AI_CONTEXT
  );
  
  console.log('✅ Module registered successfully');
}

main();
```

---

## ⚡ Step 4: (Optional) Implement AI Action Executor

### Why Action Executors?

By default, the AI can **describe** what actions to take, but cannot **execute** them. Action executors allow the AI to actually perform operations in your module.

**Without Action Executor:**
```
User: "Create a task to buy milk"
AI: "I can help you create a task. You'll need to go to the To-Do module and click 'New Task'..."
Result: User must manually create the task
```

**With Action Executor:**
```
User: "Create a task to buy milk"
AI: "I'll create that task for you."
Result: Task is automatically created ✅
```

### When to Implement

- ✅ **Implement if**: Your module has CRUD operations (create, update, delete)
- ✅ **Implement if**: Users might ask AI to perform actions
- ⚠️ **Skip if**: Your module is read-only (viewing data only)

### Implementation Steps

#### 1. Define Supported Operations

```typescript
// In your module's action executor file
export const SUPPORTED_OPERATIONS = [
  'create_item',
  'update_item',
  'delete_item',
  'update_priority',
  // ... list all operations
];
```

#### 2. Create Action Executor Function

```typescript
// server/src/modules/your-module/actionExecutor.ts

import { AIAction, UserContext } from '@/ai/core/DigitalLifeTwinService';
import { ActionExecutionResult } from '@/ai/core/ActionExecutor';

export async function executeAction(
  action: AIAction,
  userContext: UserContext
): Promise<ActionExecutionResult> {
  const { operation, parameters } = action;
  const startTime = Date.now();

  try {
    switch (operation) {
      case 'create_item': {
        // Import your controller directly
        const { createItem } = await import('../controllers/itemController');
        
        // Create mock Express request/response
        const mockReq = {
          user: { id: userContext.userId },
          body: {
            title: parameters.title,
            description: parameters.description,
            dashboardId: parameters.dashboardId,
            businessId: parameters.businessId || null,
          }
        } as any;
        
        let result: any = {};
        const mockRes = {
          json: (data: any) => { result = data; },
          status: (code: number) => ({ 
            json: (data: any) => { result = { ...data, statusCode: code }; } 
          })
        } as any;
        
        // Execute your controller
        await createItem(mockReq, mockRes);
        
        return {
          actionId: action.id,
          success: !result.statusCode || result.statusCode === 200 || result.statusCode === 201,
          result: result,
          metadata: {
            executionTime: Date.now() - startTime,
            module: 'your-module',
            operation: 'create_item',
            affectedUsers: action.affectedUsers || [],
            rollbackAvailable: true
          }
        };
      }
      
      // Add more cases for other operations
      default:
        return {
          actionId: action.id,
          success: false,
          error: `Unknown operation: ${operation}`,
          metadata: {
            executionTime: Date.now() - startTime,
            module: 'your-module',
            operation,
            affectedUsers: [],
            rollbackAvailable: false
          }
        };
    }
  } catch (error) {
    return {
      actionId: action.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      metadata: {
        executionTime: Date.now() - startTime,
        module: 'your-module',
        operation: action.operation,
        affectedUsers: [],
        rollbackAvailable: false
      }
    };
  }
}
```

#### 3. Register Action Executor

**Option A: Automatic Registration via Manifest (Recommended)**

Include the executor configuration in your module's manifest. It will be automatically registered when your module is approved:

```typescript
// In your module submission manifest:
{
  aiContext: {
    // ... your AI context ...
  },
  aiActionExecutor: {
    // For webhook-based executors (external modules):
    executorUrl: 'https://your-module.com/api/ai/execute',
    supportedOperations: ['create_item', 'update_item', 'delete_item'],
    apiKey: 'optional-api-key', // Optional, for webhook authentication
    timeout: 30000 // Optional, milliseconds (default: 30000)
  }
}
```

**Option B: Manual Registration (For In-Process Modules)**

If your module is installed in the Vssyl codebase, you can register directly:

```typescript
// During module installation/activation
import { actionExecutorRegistry } from '@/ai/core/ActionExecutorRegistry';
import { executeAction, SUPPORTED_OPERATIONS } from './actionExecutor';

// Register the executor
actionExecutorRegistry.register({
  moduleId: 'your-module',
  executorType: 'in-process',
  executor: executeAction,
  supportedOperations: SUPPORTED_OPERATIONS
});
```

**Note**: For third-party modules submitted to the marketplace, use Option A (manifest). The executor will be automatically registered when the module is approved by an admin.

#### 4. Document Actions in AI Context

Make sure your `ModuleAIContext` includes the actions:

```typescript
const YOUR_MODULE_AI_CONTEXT: ModuleAIContext = {
  // ... existing context ...
  actions: [
    {
      name: 'create_item',
      description: 'Creates a new item in the module',
      permissions: ['module:write'],
    },
    {
      name: 'update_item',
      description: 'Updates an existing item',
      permissions: ['module:write'],
    }
  ]
};
```

### Webhook Pattern (For External Modules)

If your module is hosted externally, include the webhook URL in your manifest:

```typescript
// In your module submission manifest:
{
  aiContext: {
    // ... your AI context ...
  },
  aiActionExecutor: {
    executorUrl: 'https://your-module.com/api/ai/execute',
    supportedOperations: ['create_item', 'update_item', 'delete_item'],
    apiKey: 'your-api-key', // Optional, for authentication
    timeout: 30000 // Optional, milliseconds
  }
}
```

**Your webhook endpoint must:**
- **Method**: POST
- **Headers**: `Authorization: Bearer {apiKey}` (if apiKey provided)
- **Body**: 
  ```json
  {
    "action": "create_item",
    "parameters": { "title": "...", "description": "..." },
    "userId": "user-id",
    "context": { ... },
    "actionId": "action-id",
    "requiresApproval": false,
    "reasoning": "...",
    "affectedUsers": []
  }
  ```
- **Return**: `ActionExecutionResult` format:
  ```json
  {
    "actionId": "action-id",
    "success": true,
    "result": { ... },
    "metadata": {
      "executionTime": 123,
      "module": "your-module",
      "operation": "create_item",
      "affectedUsers": [],
      "rollbackAvailable": false
    }
  }
  ```

The executor will be automatically registered when your module is approved.

### Best Practices

- ✅ **Import controllers directly** - Don't use HTTP API calls
- ✅ **Validate parameters** - Check required fields before execution
- ✅ **Handle errors gracefully** - Always return proper error responses
- ✅ **Test thoroughly** - Test each operation with valid and invalid inputs
- ✅ **Document operations** - List all supported operations clearly

### See Also

- **Complete Guide**: `.cursor/rules/module-development.mdc` - "AI Action Executor Integration" section
- **Implementation Plan**: `docs/plans/AI_ACTION_EXECUTOR_IMPLEMENTATION_PLAN.md`
- **Example**: Tasks module (`server/src/ai/core/ActionExecutor.ts` - `executeTasksAction`)

---

## 🧪 Step 5: Test Your Module's AI Integration

### 4.1 Test Module Detection

```bash
# Test if your module is detected for relevant queries
curl -X POST https://your-api.com/api/ai/analyze-query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "show my projects"
  }'

# Expected response:
{
  "analysis": {
    "matchedModules": [
      {
        "moduleId": "your-module-id",
        "moduleName": "Your Module",
        "relevance": "high",
        "matchedKeywords": ["projects"]
      }
    ]
  }
}
```

### 4.2 Test Context Provider

```bash
# Test your context provider endpoint
curl https://your-api.com/api/your-module/ai/context/provider-name \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: JSON with your module's context data
```

### 4.3 Test End-to-End AI Query

```bash
# Test full AI query that should use your module
curl -X POST https://your-api.com/api/ai/twin \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "what projects am I working on?",
    "context": {}
  }'

# Check response metadata for:
# - Your module in "relevantModules"
# - Your context provider in "contextProvidersFetched"
```

---

## 📊 Step 6: Monitor Performance

### Admin Portal

Navigate to: **Admin Portal → AI Learning → Module Analytics**

Monitor:
- **Query Success Rate**: % of queries successfully resolved by your module
- **Avg. Response Time**: How fast your context providers respond
- **Cache Hit Rate**: % of context served from cache vs. live fetch
- **User Satisfaction**: Feedback on AI responses involving your module

### Performance Optimization Tips

1. **Cache Aggressively**: Set appropriate `cacheDuration` for context providers
2. **Limit Data**: Return only essential fields in context responses
3. **Index Database**: Ensure database queries are fast
4. **Monitor Logs**: Check for errors in AI context fetching

---

## 🎨 Best Practices

### Keywords

✅ **Do:**
- Include synonyms and variations
- Use lowercase
- Think about how users naturally speak
- Include plural forms

❌ **Don't:**
- Use too generic keywords (e.g., "get", "show")
- Duplicate keywords from other modules
- Use technical jargon users won't say

### Patterns

✅ **Do:**
- Use `*` as wildcard for flexible matching
- Cover common question formats
- Think about user intent, not exact phrasing

❌ **Don't:**
- Make patterns too specific
- Forget about different ways to ask the same thing

### Context Providers

✅ **Do:**
- Return recent/relevant data only (limit to 10-20 items)
- Use appropriate cache durations (5-15 minutes for dynamic data)
- Include summary/aggregate data
- Handle errors gracefully

❌ **Don't:**
- Return all user data (AI doesn't need everything)
- Cache for too long if data changes frequently
- Expose sensitive data without permission checks

---

## 🔐 Security Considerations

### 1. Authentication

All context provider endpoints **MUST** use the `authenticateJWT` middleware:

```typescript
router.get('/ai/context/data', authenticateJWT, yourHandler);
```

### 2. Authorization

Verify the user has permission to access the data:

```typescript
// Check if user owns the resource
const resource = await prisma.yourModel.findFirst({
  where: { id: resourceId, userId: userId }
});

if (!resource) {
  return res.status(403).json({ message: 'Access denied' });
}
```

### 3. Data Privacy

- Only return data the user owns or has permission to see
- Don't include sensitive fields (passwords, tokens, etc.)
- Respect user privacy settings

---

## 🚨 Common Pitfalls

### Pitfall 1: Too Many Keywords

```typescript
// ❌ BAD: Overlaps with Drive module
keywords: ["file", "document", "storage"]

// ✅ GOOD: Specific to your module
keywords: ["invoice", "receipt", "expense", "financial-document"]
```

### Pitfall 2: Slow Context Providers

```typescript
// ❌ BAD: Fetches too much data
const allUserData = await prisma.yourModel.findMany({ where: { userId } });

// ✅ GOOD: Limited and fast
const recentData = await prisma.yourModel.findMany({
  where: { userId },
  take: 10,
  orderBy: { updatedAt: 'desc' }
});
```

### Pitfall 3: Missing Error Handling

```typescript
// ❌ BAD: Crashes on error
const data = await fetchData();

// ✅ GOOD: Graceful error handling
try {
  const data = await fetchData();
  return formatResponse(data);
} catch (error) {
  console.error('Error:', error);
  return res.status(500).json({ 
    success: false, 
    message: 'Failed to fetch data' 
  });
}
```

---

## 📚 API Reference

### Register/Update Module AI Context

```
POST /api/modules/:moduleId/ai/context
Authorization: Bearer {token}
Content-Type: application/json

Body: ModuleAIContext object
```

### Get Module AI Context

```
GET /api/modules/:moduleId/ai/context
Authorization: Bearer {token}
```

### Analyze Query

```
POST /api/ai/analyze-query
Authorization: Bearer {token}
Content-Type: application/json

Body: { "query": "user question" }
```

### Fetch Module Context

```
GET /api/modules/:moduleId/ai/fetch-context/:providerName
Authorization: Bearer {token}
```

---

## 🎓 Examples

### Example 1: Simple Note-Taking Module

```typescript
const NOTE_TAKING_AI_CONTEXT: ModuleAIContext = {
  purpose: "Create, organize, and search personal notes and memos",
  category: "productivity",
  keywords: ["note", "notes", "memo", "reminder", "jot", "write"],
  patterns: ["my notes", "notes about *", "find note *", "create note *"],
  concepts: ["note-taking", "personal organization", "quick capture"],
  entities: [{ name: "note", pluralName: "notes", description: "A text note" }],
  actions: [{ name: "create", description: "Create note", permissions: ["notes:write"] }],
  contextProviders: [{
    name: "recentNotes",
    endpoint: "/api/notes/ai/context/recent",
    cacheDuration: 600000
  }]
};
```

### Example 2: Fitness Tracking Module

```typescript
const FITNESS_AI_CONTEXT: ModuleAIContext = {
  purpose: "Track workouts, exercises, and fitness goals",
  category: "health",
  keywords: ["workout", "exercise", "fitness", "gym", "training", "reps", "sets"],
  patterns: ["my workouts", "log workout *", "fitness progress", "exercise history"],
  concepts: ["fitness tracking", "workout logging", "progress monitoring"],
  entities: [
    { name: "workout", pluralName: "workouts", description: "A fitness session" }
  ],
  actions: [{ name: "log-workout", description: "Log workout", permissions: ["fitness:write"] }],
  contextProviders: [{
    name: "recentWorkouts",
    endpoint: "/api/fitness/ai/context/recent",
    cacheDuration: 300000
  }]
};
```

---

## 🆘 Troubleshooting

### Module Not Detected in Queries

**Problem:** AI doesn't detect your module for relevant queries

**Solutions:**
1. Check if keywords match what users actually say
2. Add more pattern variations
3. Verify module is registered: `GET /api/modules/:id/ai/context`

### Context Provider Errors

**Problem:** Error fetching context from your module

**Solutions:**
1. Verify endpoint URL is correct in `contextProviders`
2. Check authentication middleware is applied
3. Test endpoint directly with curl/Postman
4. Check server logs for detailed error messages

### Slow AI Responses

**Problem:** AI takes too long to respond when using your module

**Solutions:**
1. Reduce amount of data returned by context providers
2. Add database indexes for faster queries
3. Increase cache duration if data doesn't change frequently
4. Optimize database queries (use `select` to limit fields)

---

## 📞 Support

- **Documentation:** `docs/archive/guides-merged-2026/MODULE_AI_CONTEXT_GUIDE.md` (this file)
- **API Reference:** `memory-bank/apiDocumentation.md` (no separate `AI_API_REFERENCE.md`; use module routes in codebase)
- **Examples:** Check `scripts/register-built-in-modules.ts`
- **Issues:** Report bugs in the project repository

---

**🎉 Congratulations!** You've made your module AI-aware. Users can now interact with it naturally through the AI assistant, and the system will intelligently route relevant queries to your module.

