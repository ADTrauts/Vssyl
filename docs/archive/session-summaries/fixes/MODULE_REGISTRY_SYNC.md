# Module AI Context Registry - Automated Sync System

## 📋 Overview

The Module AI Context Registry Sync System automatically keeps the AI module registry synchronized with module updates. This ensures that when developers update their modules' AI capabilities, the changes are reflected in the AI system.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 AUTOMATIC SYNC SYSTEM                       │
└─────────────────────────────────────────────────────────────┘

1. Server Startup (Once per deployment)
   └─> registerBuiltInModulesOnStartup()
       └─> Registers Drive, Chat, Calendar if registry empty

2. Developer Publishes Module (Real-time)
   └─> reviewModuleSubmission() → approve
       └─> moduleRegistrySyncService.syncModule(moduleId)
           └─> Registry updated immediately

3. Nightly Sync (3 AM Daily)
   └─> Cloud Scheduler → POST /api/admin/modules/ai/sync
       └─> moduleRegistrySyncService.syncAllModules()
           ├─> Add new modules
           ├─> Update changed modules
           └─> Remove deleted modules

4. Manual Sync (Admin)
   └─> Admin Portal or API call
       └─> POST /api/admin/modules/ai/sync
```

---

## 🚀 Components

### 1. **ModuleRegistrySyncService** (`server/src/services/ModuleRegistrySyncService.ts`)

Core service that handles all sync operations.

**Methods:**
- `syncAllModules()` - Sync all active modules with the registry
- `syncModule(moduleId)` - Sync a specific module
- `cleanupOrphanedEntries()` - Remove deleted modules from registry
- `getSyncStatus()` - Get sync statistics

**Features:**
- ✅ Version tracking
- ✅ Diff detection (only update if changed)
- ✅ Error handling (failures don't break system)
- ✅ Detailed logging

### 2. **Sync API Endpoints** (`server/src/routes/moduleAIContext.ts`)

**POST /api/admin/modules/ai/sync**
- Triggers full sync of all modules
- Called by Cloud Scheduler (nightly)
- Can be called manually by admins
- Returns detailed sync results

**GET /api/admin/modules/ai/sync/status**
- Get current sync status
- Shows statistics:
  - Total modules
  - Registered modules
  - Unregistered modules
  - Orphaned entries
  - Last sync time

### 3. **Cloud Scheduler Job** (`cloud-scheduler-setup.sh`)

Nightly cron job that calls the sync endpoint.

**Schedule:** Daily at 3:00 AM (America/Chicago timezone)

**Setup:**
```bash
chmod +x cloud-scheduler-setup.sh
./cloud-scheduler-setup.sh
```

### 4. **Module Publishing Integration** (`server/src/controllers/moduleController.ts`)

When an admin approves a module:
1. Module status updated to APPROVED
2. `syncModule(moduleId)` called automatically
3. AI context added/updated in registry
4. AI can immediately access the new module

---

## 📊 What Gets Synchronized

### Module AI Context Includes:
```typescript
{
  purpose: string;              // What the module does
  category: string;             // PRODUCTIVITY, COMMUNICATION, etc.
  keywords: string[];           // Search keywords
  patterns: string[];           // Query patterns AI matches
  concepts: string[];           // Conceptual understanding
  entities: ModuleEntity[];     // What data the module manages
  actions: ModuleAction[];      // What users can do
  contextProviders: {           // Live data endpoints
    name: string;
    endpoint: string;
    cacheDuration: number;
  }[];
}
```

### Sync Triggers:
1. **Module approved** by admin → Immediate sync
2. **Module version changed** → Detected in nightly sync
3. **AI context updated** → Detected in nightly sync
4. **Manual trigger** → Admin calls sync endpoint

---

## 🔄 Sync Process

### Full Sync (Nightly):
```
1. Query all ACTIVE modules from database
2. For each module:
   a. Extract AI context from manifest
   b. Check if in registry
   c. Compare version and content
   d. Update if changed
3. Find orphaned entries (deleted modules)
4. Remove orphaned entries
5. Log summary (added, updated, removed, errors)
```

### Single Module Sync (Real-time):
```
1. Get module from database
2. Validate module is ACTIVE
3. Extract AI context from manifest
4. Check if in registry
   - Not in registry → Add
   - In registry → Compare and update if changed
   - No changes → Skip
5. Log result
```

---

## 🛠️ Setup Instructions

### Step 1: Deploy Code
```bash
# Code is already committed in Phase 1 & 2
git push origin main
```

### Step 2: Setup Cloud Scheduler
```bash
# Run the setup script
chmod +x cloud-scheduler-setup.sh
./cloud-scheduler-setup.sh
```

This creates:
- Service account for Cloud Scheduler
- Scheduled job (daily at 3 AM)
- Proper IAM permissions

### Step 3: Test Manual Sync
```bash
# Using gcloud CLI
gcloud scheduler jobs run module-registry-sync \
  --location=us-central1 \
  --project=vssyl-472202

# Or via API (requires admin token)
curl -X POST https://vssyl-server-235369681725.us-central1.run.app/api/admin/modules/ai/sync \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Step 4: Verify Sync Status
```bash
# Via API
curl https://vssyl-server-235369681725.us-central1.run.app/api/admin/modules/ai/sync/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 📈 Monitoring

### View Scheduler Logs:
```bash
gcloud logging read \
  'resource.type=cloud_scheduler_job AND resource.labels.job_id=module-registry-sync' \
  --limit=50 \
  --format=json \
  --project=vssyl-472202
```

### View Sync Results in Server Logs:
```bash
gcloud logging read \
  'resource.type=cloud_run_revision AND textPayload=~"Module AI Context Registry"' \
  --limit=100 \
  --format=json \
  --project=vssyl-472202
```

### Check Sync Status via Admin Portal:
Navigate to: **Admin Portal → AI Learning → Module Analytics → Sync Status**

---

## 🐛 Troubleshooting

### Sync Not Running
**Check scheduler status:**
```bash
gcloud scheduler jobs describe module-registry-sync \
  --location=us-central1 \
  --project=vssyl-472202
```

**Check job is enabled:**
```bash
gcloud scheduler jobs list \
  --location=us-central1 \
  --project=vssyl-472202
```

### Sync Errors
**View recent errors:**
```bash
gcloud logging read \
  'resource.type=cloud_scheduler_job AND severity>=ERROR' \
  --limit=20 \
  --format=json \
  --project=vssyl-472202
```

**Manually trigger sync:**
```bash
curl -X POST https://vssyl-server-235369681725.us-central1.run.app/api/admin/modules/ai/sync \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Module Not Syncing
**Check module status:**
- Module must have `status: 'ACTIVE'`
- Module manifest must include `aiContext` field
- AI context must have required fields: `purpose`, `category`, `keywords`

**Manually sync specific module:**
```typescript
// In server console or via API
const { moduleRegistrySyncService } = require('./services/ModuleRegistrySyncService');
const result = await moduleRegistrySyncService.syncModule('module-id');
console.log(result);
```

---

## 🔐 Security

### Authentication:
- All sync endpoints require JWT authentication
- Admin role required for sync operations
- Cloud Scheduler uses OIDC authentication

### Permissions:
- Cloud Scheduler service account: `cloud-scheduler@vssyl-472202.iam.gserviceaccount.com`
- IAM Role: `roles/run.invoker` on vssyl-server

---

## 📝 Developer Guide

### Adding AI Context to Your Module

When submitting a module, include `aiContext` in your manifest:

```typescript
{
  "name": "my-awesome-module",
  "version": "1.0.0",
  "aiContext": {
    "purpose": "Description of what your module does",
    "category": "PRODUCTIVITY", // or COMMUNICATION, etc.
    "keywords": ["task", "todo", "productivity"],
    "patterns": [
      "show my tasks",
      "what do I need to do",
      "add a task"
    ],
    "concepts": ["task management", "productivity"],
    "entities": [
      {
        "name": "Task",
        "pluralName": "Tasks",
        "description": "A user task or todo item"
      }
    ],
    "actions": [
      {
        "name": "create_task",
        "description": "Create a new task",
        "permissions": ["tasks:write"]
      }
    ],
    "contextProviders": [
      {
        "name": "recent_tasks",
        "endpoint": "/api/tasks/ai/context/recent",
        "cacheDuration": 300000, // 5 minutes in milliseconds
        "description": "Get user's recent tasks"
      }
    ]
  }
}
```

### Updating AI Context

When you update your module:
1. Update `aiContext` in your manifest
2. Increment module `version`
3. Submit update for review
4. When approved → AI context syncs automatically!

---

## 🎯 Benefits

### For Users:
- ✅ AI always knows about available modules
- ✅ AI can access latest module features
- ✅ Better AI responses with up-to-date context

### For Developers:
- ✅ AI context updates automatically
- ✅ No manual registration needed
- ✅ Changes reflected immediately on approval

### For Admins:
- ✅ Automated maintenance
- ✅ No manual intervention required
- ✅ Detailed monitoring and logging

---

## 📊 Sync Statistics

The sync system tracks:
- **Added**: New modules registered
- **Updated**: Existing modules with changes
- **Removed**: Deleted modules cleaned up
- **Errors**: Failed sync operations
- **Skipped**: Modules without AI context

View via: `GET /api/admin/modules/ai/sync/status`

---

## 🔄 Future Enhancements

Potential improvements:
- [ ] Webhook notifications on sync completion
- [ ] Sync history/audit log
- [ ] Rollback capability
- [ ] Module-specific sync schedules
- [ ] Performance metrics tracking

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. View server logs in Cloud Console
3. Manually trigger sync to verify
4. Check module manifest for required fields

---

**Last Updated:** 2025-10-08
**Version:** 1.0.0

