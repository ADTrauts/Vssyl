# Notification Metadata Guide

## Overview

The notification center and settings page now automatically discover notification types from module manifests. This guide shows how to add notification metadata to your module.

## Quick Start

Add a `notifications` array to your module's manifest in the database:

```typescript
{
  "notifications": [
    {
      "type": "your_module_event_name",
      "name": "Event Name",
      "description": "When this notification is sent",
      "category": "your-module-category",
      "defaultChannels": {
        "inApp": true,
        "email": false,
        "push": true
      },
      "priority": "normal",
      "requiresAction": false
    }
  ]
}
```

## Example: HR Module

The HR module sends 9 notification types. Here's the complete metadata:

```typescript
{
  "notifications": [
    {
      "type": "hr_onboarding_task_approved",
      "name": "Onboarding Task Approved",
      "description": "Sent when a manager approves an employee's onboarding task",
      "category": "hr",
      "defaultChannels": {
        "inApp": true,
        "email": true,
        "push": false
      },
      "priority": "normal",
      "requiresAction": false
    },
    {
      "type": "hr_onboarding_task_pending_approval",
      "name": "Onboarding Task Pending Approval",
      "description": "Sent to manager when employee completes a task requiring approval",
      "category": "hr",
      "defaultChannels": {
        "inApp": true,
        "email": true,
        "push": true
      },
      "priority": "high",
      "requiresAction": true
    },
    {
      "type": "hr_onboarding_journey_completed",
      "name": "Onboarding Journey Completed",
      "description": "Sent when employee completes all onboarding tasks",
      "category": "hr",
      "defaultChannels": {
        "inApp": true,
        "email": true,
        "push": false
      },
      "priority": "normal",
      "requiresAction": false
    },
    {
      "type": "hr_time_off_request_submitted",
      "name": "Time-Off Request Submitted",
      "description": "Sent to manager when employee submits time-off request",
      "category": "hr",
      "defaultChannels": {
        "inApp": true,
        "email": true,
        "push": true
      },
      "priority": "high",
      "requiresAction": true
    },
    {
      "type": "hr_time_off_request_approved",
      "name": "Time-Off Request Approved",
      "description": "Sent to employee when manager approves time-off request",
      "category": "hr",
      "defaultChannels": {
        "inApp": true,
        "email": true,
        "push": false
      },
      "priority": "normal",
      "requiresAction": false
    },
    {
      "type": "hr_time_off_request_denied",
      "name": "Time-Off Request Denied",
      "description": "Sent to employee when manager denies time-off request",
      "category": "hr",
      "defaultChannels": {
        "inApp": true,
        "email": true,
        "push": false
      },
      "priority": "normal",
      "requiresAction": false
    },
    {
      "type": "hr_time_off_balance_low",
      "name": "Low PTO Balance Warning",
      "description": "Sent when employee's PTO balance falls below threshold",
      "category": "hr",
      "defaultChannels": {
        "inApp": true,
        "email": true,
        "push": false
      },
      "priority": "low",
      "requiresAction": false
    },
    {
      "type": "hr_attendance_exception_created",
      "name": "Attendance Exception Created",
      "description": "Sent when an attendance exception is detected",
      "category": "hr",
      "defaultChannels": {
        "inApp": true,
        "email": true,
        "push": false
      },
      "priority": "normal",
      "requiresAction": true
    },
    {
      "type": "hr_attendance_policy_violation",
      "name": "Attendance Policy Violation",
      "description": "Sent when employee violates attendance policy",
      "category": "hr",
      "defaultChannels": {
        "inApp": true,
        "email": true,
        "push": true
      },
      "priority": "high",
      "requiresAction": true
    },
    {
      "type": "hr_attendance_missing_punch",
      "name": "Missing Punch Reminder",
      "description": "Sent when employee forgets to clock in/out",
      "category": "hr",
      "defaultChannels": {
        "inApp": true,
        "email": false,
        "push": true
      },
      "priority": "normal",
      "requiresAction": true
    }
  ]
}
```

## Example: Chat Module

```typescript
{
  "notifications": [
    {
      "type": "chat_message",
      "name": "New Message",
      "description": "Sent when a new message is received in a conversation",
      "category": "chat",
      "defaultChannels": {
        "inApp": true,
        "email": false,
        "push": true
      },
      "priority": "normal",
      "requiresAction": false
    },
    {
      "type": "chat_mention",
      "name": "Mentioned in Chat",
      "description": "Sent when you are mentioned in a chat message",
      "category": "mentions",
      "defaultChannels": {
        "inApp": true,
        "email": true,
        "push": true
      },
      "priority": "high",
      "requiresAction": false
    },
    {
      "type": "chat_reaction",
      "name": "Message Reaction",
      "description": "Sent when someone reacts to your message",
      "category": "chat",
      "defaultChannels": {
        "inApp": true,
        "email": false,
        "push": false
      },
      "priority": "low",
      "requiresAction": false
    }
  ]
}
```

## Example: Drive Module

```typescript
{
  "notifications": [
    {
      "type": "drive_shared",
      "name": "File Shared",
      "description": "Sent when a file or folder is shared with you",
      "category": "drive",
      "defaultChannels": {
        "inApp": true,
        "email": true,
        "push": false
      },
      "priority": "normal",
      "requiresAction": false
    },
    {
      "type": "drive_permission",
      "name": "Permission Changed",
      "description": "Sent when file or folder permissions are changed",
      "category": "drive",
      "defaultChannels": {
        "inApp": true,
        "email": false,
        "push": false
      },
      "priority": "normal",
      "requiresAction": false
    }
  ]
}
```

## Example: Calendar Module

```typescript
{
  "notifications": [
    {
      "type": "calendar_reminder",
      "name": "Event Reminder",
      "description": "Sent before a calendar event starts",
      "category": "calendar",
      "defaultChannels": {
        "inApp": true,
        "email": false,
        "push": true
      },
      "priority": "normal",
      "requiresAction": false
    }
  ]
}
```

## How to Update Module Manifests

### Option 1: Update via Database (Direct)

```sql
UPDATE modules
SET manifest = jsonb_set(
  manifest,
  '{notifications}',
  '[...notification array...]'::jsonb
)
WHERE id = 'your-module-id';
```

### Option 2: Update via Module Controller

When creating or updating a module, include the notifications array in the manifest:

```typescript
const module = await prisma.module.update({
  where: { id: 'hr' },
  data: {
    manifest: {
      ...existingManifest,
      notifications: [
        // ... notification metadata
      ]
    }
  }
});
```

## Category Guidelines

Use these standard categories:
- `chat` - Chat and messaging
- `drive` - File Hub and storage
- `members` - Member management
- `business` - Business operations
- `hr` - Human resources
- `calendar` - Calendar and events
- `scheduling` - Employee scheduling
- `todo` - Tasks and to-dos
- `mentions` - @mentions
- `system` - System alerts

## Priority Guidelines

- `low` - Informational, no action needed
- `normal` - Standard notifications
- `high` - Important, may require attention
- `urgent` - Critical, requires immediate action

## Default Channels Guidelines

- **inApp**: Usually `true` - most notifications should appear in notification center
- **email**: `true` for important notifications, `false` for frequent/low-priority
- **push**: `true` for time-sensitive notifications, `false` for informational

## Benefits

Once notification metadata is added:
- ✅ Notification center automatically shows module categories
- ✅ Settings page automatically shows module preferences
- ✅ No code changes needed in notification center or settings page
- ✅ Third-party modules automatically integrate
- ✅ Consistent user experience across all modules

## Next Steps

1. Add notification metadata to all existing modules (HR, Chat, Drive, Calendar)
2. Test notification center shows all categories
3. Test settings page shows all preferences
4. Verify notifications appear correctly categorized
