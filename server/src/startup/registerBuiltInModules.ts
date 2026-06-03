/**
 * STARTUP MODULE REGISTRATION
 * 
 * This module runs automatically when the server starts.
 * It ensures built-in modules exist in the Module table and 
 * registers their AI context in the ModuleAIContextRegistry.
 * 
 * This is the PROPER way to handle registration because:
 * - Server has full database access
 * - Runs in production environment
 * - Non-blocking (doesn't prevent server startup)
 * - Can retry on server restart
 * - Creates Module records if they don't exist (fixes production issue)
 */

import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import type { ModuleAIContext } from 'shared/types/module-ai-context';
import type { BuiltInModuleId } from '../constants/builtInModuleIds';
import { reconcileBuiltInManifest } from './builtInModuleManifests';
import { Prisma } from '@prisma/client';

// ============================================================================
// BUILT-IN MODULE DEFINITIONS (for creating Module records)
// ============================================================================

interface BuiltInModuleDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  category: 'PRODUCTIVITY' | 'COMMUNICATION' | 'ANALYTICS' | 'DEVELOPMENT' | 'ENTERTAINMENT' | 'EDUCATION' | 'FINANCE' | 'HEALTH' | 'OTHER';
  tags: string[];
  icon?: string;
  pricingTier: string;
}

const BUILT_IN_MODULE_DEFINITIONS: BuiltInModuleDefinition[] = [
  {
    id: 'drive',
    name: 'File Hub',
    description: 'File management and storage system with folder organization and sharing',
    version: '1.0.0',
    category: 'PRODUCTIVITY',
    tags: ['files', 'storage', 'documents', 'sharing'],
    icon: 'folder',
    pricingTier: 'free',
  },
  {
    id: 'chat',
    name: 'Chat',
    description: 'Real-time messaging and communication system',
    version: '1.0.0',
    category: 'COMMUNICATION',
    tags: ['messaging', 'communication', 'chat'],
    icon: 'message-circle',
    pricingTier: 'free',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Calendar and scheduling system with events and reminders',
    version: '1.0.0',
    category: 'PRODUCTIVITY',
    tags: ['calendar', 'scheduling', 'events', 'reminders'],
    icon: 'calendar',
    pricingTier: 'free',
  },
  {
    id: 'hr',
    name: 'HR Management',
    description: 'Complete human resources management system for employee lifecycle, attendance, payroll, and performance management',
    version: '1.0.0',
    category: 'PRODUCTIVITY',
    tags: ['hr', 'employees', 'attendance', 'payroll', 'performance'],
    icon: 'users',
    pricingTier: 'premium',
  },
  {
    id: 'scheduling',
    name: 'Employee Scheduling',
    description: 'Employee shift scheduling and workforce planning for businesses with shift management, availability, and swap requests',
    version: '1.0.0',
    category: 'PRODUCTIVITY',
    tags: ['scheduling', 'shifts', 'workforce', 'staffing'],
    icon: 'clock',
    pricingTier: 'premium',
  },
  {
    id: 'todo',
    name: 'To-Do',
    description: 'AI-powered task and to-do management with prioritization, scheduling, and context-aware features',
    version: '1.0.0',
    category: 'PRODUCTIVITY',
    tags: ['tasks', 'todo', 'productivity', 'planning'],
    icon: 'check-square',
    pricingTier: 'free',
  },
  {
    id: 'notes',
    name: 'Notes',
    description: 'Rich text notes with tags, search, and organization',
    version: '1.0.0',
    category: 'PRODUCTIVITY',
    tags: ['notes', 'journal', 'ideas', 'writing'],
    icon: 'file-text',
    pricingTier: 'free',
  },
  {
    id: 'notebook',
    name: 'Notebook',
    description: 'Meeting pages and tasks in one hub (facade over Notes and To-Do)',
    version: '1.0.0',
    category: 'PRODUCTIVITY',
    tags: ['notebook', 'pages', 'meeting notes', 'tasks'],
    icon: 'book-open',
    pricingTier: 'free',
  },
  {
    id: 'vlink',
    name: 'V_Link',
    description: 'Platform contextual relationship layer connecting files, events, and more',
    version: '1.0.0',
    category: 'PRODUCTIVITY',
    tags: ['vlink', 'links', 'relationships', 'context'],
    icon: 'link',
    pricingTier: 'free',
  },
  {
    id: 'place',
    name: 'Vssyl Place',
    description: 'Personal Main Street — a user-built neighborhood connecting physical and digital businesses, services, and people',
    version: '1.0.0',
    category: 'OTHER',
    tags: ['place', 'neighborhood', 'connections', 'businesses', 'discovery', 'local'],
    icon: 'map-pin',
    pricingTier: 'free',
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Customizable dashboard with widgets for quick access to modules and at-a-glance information',
    version: '1.0.0',
    category: 'PRODUCTIVITY',
    tags: ['dashboard', 'widgets', 'overview', 'stats', 'home'],
    icon: 'layout-grid',
    pricingTier: 'free',
  },
];

// ============================================================================
// BUILT-IN MODULE AI CONTEXTS
// ============================================================================

const BUILT_IN_MODULES: Array<{ moduleId: string; moduleName: string; aiContext: ModuleAIContext }> = [
  {
    moduleId: 'drive',
    moduleName: 'File Hub',
    aiContext: {
      purpose: 'File and folder storage with organization, sharing, and collaboration',
      category: 'PRODUCTIVITY',
      keywords: ['file', 'folder', 'document', 'storage', 'drive', 'file hub', 'upload', 'download', 'share', 'organize'],
      patterns: [
        'files? (in|from|on) (my )?(drive|file hub)',
        'folders? (in|from|on) (my )?(drive|file hub)',
        'upload (a |the )?file',
        'create (a )?folder',
        'share (this |the )?file',
        'storage space',
        'recent (files?|documents?)',
      ],
      concepts: ['file management', 'cloud storage', 'document organization', 'sharing', 'collaboration'],
      entities: [
        { name: 'File', pluralName: 'Files', description: 'A file stored in File Hub' },
        { name: 'Folder', pluralName: 'Folders', description: 'A folder for organizing files' },
        { name: 'File Hub', pluralName: 'File Hubs', description: 'Cloud storage space' },
      ],
      actions: [
        { name: 'create_folder', description: 'Create a new folder', permissions: ['drive:write'] },
        { name: 'upload_file', description: 'Upload a file to File Hub', permissions: ['drive:write'] },
        { name: 'download_file', description: 'Download a file from File Hub', permissions: ['drive:read'] },
        { name: 'share_file', description: 'Share a file with others', permissions: ['drive:write', 'drive:share'] },
        { name: 'delete_file', description: 'Delete a file or folder', permissions: ['drive:delete'] },
      ],
      contextProviders: [
        {
          name: 'recent_files',
          description: 'Get user\'s recently accessed or modified files',
          endpoint: '/api/drive/ai/context/recent',
          cacheDuration: 300000,
          supportedIntents: ['workflow_action', 'planning', 'technical_help', 'general_chat'],
          retrievalCost: 'low',
          priority: 80,
          pipelineSourceIds: ['drive_files', 'module_context'],
          volatility: 'dynamic',
          freshnessPolicy: { maxAgeMs: 300000 },
        },
        {
          name: 'storage_overview',
          description: 'Get storage usage and quota information',
          endpoint: '/api/drive/ai/context/storage',
          cacheDuration: 900000,
          supportedIntents: ['workflow_action', 'technical_help', 'general_chat'],
          retrievalCost: 'medium',
          priority: 55,
          pipelineSourceIds: ['module_context'],
          volatility: 'slow',
          freshnessPolicy: { maxAgeMs: 900000 },
        },
        {
          name: 'file_count',
          description: 'Query file and folder counts',
          endpoint: '/api/drive/ai/query/count',
          cacheDuration: 600000,
          supportedIntents: ['workflow_action', 'technical_help', 'general_chat'],
          retrievalCost: 'low',
          priority: 45,
          pipelineSourceIds: ['module_context'],
          volatility: 'slow',
          freshnessPolicy: { maxAgeMs: 600000 },
        },
      ],
    },
  },
  {
    moduleId: 'chat',
    moduleName: 'Chat',
    aiContext: {
      purpose: 'Real-time messaging and communication between users',
      category: 'COMMUNICATION',
      keywords: ['message', 'chat', 'conversation', 'talk', 'send', 'reply', 'unread'],
      patterns: [
        'messages?',
        'chats?',
        'conversations?',
        'unread messages?',
        'send (a )?message',
        'talk to',
        'contact',
      ],
      concepts: ['messaging', 'communication', 'conversations', 'real-time chat'],
      entities: [
        { name: 'Message', pluralName: 'Messages', description: 'A chat message' },
        { name: 'Conversation', pluralName: 'Conversations', description: 'A chat conversation thread' },
        { name: 'Chat', pluralName: 'Chats', description: 'Real-time messaging system' },
      ],
      actions: [
        { name: 'send_message', description: 'Send a message to a user', permissions: ['chat:write'] },
        { name: 'read_messages', description: 'Read chat messages', permissions: ['chat:read'] },
        { name: 'start_conversation', description: 'Start a new conversation', permissions: ['chat:write'] },
      ],
      contextProviders: [
        {
          name: 'recent_conversations',
          description: 'Get user\'s recent chat conversations',
          endpoint: '/api/chat/ai/context/recent',
          cacheDuration: 120000,
          supportedIntents: ['workflow_action', 'planning', 'general_chat', 'personal_reflection'],
          retrievalCost: 'medium',
          priority: 70,
          pipelineSourceIds: ['module_context', 'recent_conversations'],
          volatility: 'dynamic',
          freshnessPolicy: { maxAgeMs: 120000 },
        },
        {
          name: 'unread_messages',
          description: 'Get count and preview of unread messages',
          endpoint: '/api/chat/ai/context/unread',
          cacheDuration: 60000,
          supportedIntents: ['workflow_action', 'general_chat'],
          retrievalCost: 'low',
          priority: 85,
          pipelineSourceIds: ['module_context'],
          volatility: 'realtime',
          freshnessPolicy: { maxAgeMs: 60000 },
        },
        {
          name: 'conversation_history',
          description: 'Query conversation history with a specific user',
          endpoint: '/api/chat/ai/query/history',
          cacheDuration: 300000,
          supportedIntents: ['workflow_action', 'planning', 'general_chat'],
          retrievalCost: 'medium',
          priority: 50,
          pipelineSourceIds: ['module_context'],
          volatility: 'dynamic',
          freshnessPolicy: { maxAgeMs: 300000 },
        },
      ],
    },
  },
  {
    moduleId: 'calendar',
    moduleName: 'Calendar',
    aiContext: {
      purpose: 'Event scheduling and calendar management',
      category: 'PRODUCTIVITY',
      keywords: ['event', 'calendar', 'meeting', 'appointment', 'schedule', 'availability', 'busy', 'free'],
      patterns: [
        'events?',
        'meetings?',
        'appointments?',
        'calendar',
        'schedule',
        'availability',
        'free time',
        'busy',
        'today',
        'tomorrow',
        'this week',
      ],
      concepts: ['time management', 'scheduling', 'event planning', 'availability'],
      entities: [
        { name: 'Event', pluralName: 'Events', description: 'A calendar event' },
        { name: 'Meeting', pluralName: 'Meetings', description: 'A scheduled meeting' },
        { name: 'Appointment', pluralName: 'Appointments', description: 'A scheduled appointment' },
      ],
      actions: [
        { name: 'create_event', description: 'Create a calendar event', permissions: ['calendar:write'] },
        { name: 'schedule_meeting', description: 'Schedule a meeting', permissions: ['calendar:write'] },
        { name: 'check_availability', description: 'Check user availability', permissions: ['calendar:read'] },
        { name: 'cancel_event', description: 'Cancel an event', permissions: ['calendar:write'] },
      ],
      contextProviders: [
        {
          name: 'upcoming_events',
          description: 'Get user\'s upcoming calendar events',
          endpoint: '/api/calendar/ai/context/upcoming',
          cacheDuration: 300000,
          supportedIntents: ['workflow_action', 'planning', 'general_chat'],
          retrievalCost: 'medium',
          priority: 75,
          pipelineSourceIds: ['calendar', 'module_context'],
          volatility: 'dynamic',
          freshnessPolicy: { maxAgeMs: 300000 },
        },
        {
          name: 'today_events',
          description: 'Get events scheduled for today',
          endpoint: '/api/calendar/ai/context/today',
          cacheDuration: 900000,
          supportedIntents: ['workflow_action', 'planning', 'general_chat'],
          retrievalCost: 'low',
          priority: 85,
          pipelineSourceIds: ['calendar', 'module_context'],
          volatility: 'dynamic',
          freshnessPolicy: { maxAgeMs: 900000 },
        },
        {
          name: 'availability',
          description: 'Check user availability for a given time period',
          endpoint: '/api/calendar/ai/query/availability',
          cacheDuration: 600000,
          supportedIntents: ['workflow_action', 'planning'],
          retrievalCost: 'medium',
          priority: 60,
          pipelineSourceIds: ['module_context'],
          volatility: 'dynamic',
          freshnessPolicy: { maxAgeMs: 600000 },
        },
      ],
    },
  },
  {
    moduleId: 'hr',
    moduleName: 'HR Management',
    aiContext: {
      purpose: 'Human resources management system for employee lifecycle, attendance, payroll, and performance management',
      category: 'BUSINESS',
      keywords: [
        'hr', 'human resources', 'employee', 'staff', 'team member', 'personnel',
        'hire', 'firing', 'onboard', 'offboard', 'terminate', 'resignation',
        'attendance', 'time off', 'pto', 'vacation', 'sick leave', 'holiday',
        'payroll', 'salary', 'compensation', 'pay', 'wage', 'bonus',
        'performance', 'review', 'evaluation', 'feedback', 'goal',
        'recruitment', 'hiring', 'applicant', 'candidate', 'interview', 'job posting',
        'benefits', 'insurance', 'enrollment', '401k', 'retirement'
      ],
      patterns: [
        'hr (system|module|dashboard)',
        'employee (list|directory|database)',
        'how many employees',
        'who (is off|works) (today|tomorrow|this week)',
        'time off (request|balance|approval)',
        'pending (time off|approvals)',
        'payroll (run|report|processing)',
        'performance reviews? due',
        'upcoming reviews?',
        'open positions',
        'recruitment pipeline'
      ],
      concepts: [
        'employee lifecycle management',
        'human capital management',
        'workforce administration',
        'performance management',
        'compensation and benefits'
      ],
      entities: [
        { 
          name: 'Employee', 
          pluralName: 'Employees', 
          description: 'A business employee with HR profile data' 
        },
        { 
          name: 'TimeOffRequest', 
          pluralName: 'TimeOffRequests', 
          description: 'Employee time-off request' 
        },
        { 
          name: 'PerformanceReview', 
          pluralName: 'PerformanceReviews', 
          description: 'Employee performance evaluation' 
        },
      ],
      actions: [
        { 
          name: 'view_hr_dashboard', 
          description: 'View HR management dashboard', 
          permissions: ['hr:admin'] 
        },
        { 
          name: 'manage_employees', 
          description: 'Add, edit, or remove employees', 
          permissions: ['hr:employees:write'] 
        },
        { 
          name: 'view_team', 
          description: 'View team member HR data', 
          permissions: ['hr:team:view'] 
        },
        { 
          name: 'approve_time_off', 
          description: 'Approve or deny time off requests', 
          permissions: ['hr:team:approve'] 
        },
        { 
          name: 'view_own_data', 
          description: 'View own employee HR data', 
          permissions: ['hr:self:view'] 
        },
      ],
      contextProviders: [
        {
          name: 'hr_overview',
          description: 'Get HR system overview and statistics',
          endpoint: '/api/hr/ai/context/overview',
          cacheDuration: 300000,
          supportedIntents: ['business_operations', 'workflow_action', 'general_chat'],
          retrievalCost: 'medium',
          priority: 75,
          pipelineSourceIds: ['module_context', 'business_context'],
          volatility: 'slow',
          freshnessPolicy: { maxAgeMs: 300000 },
        },
        {
          name: 'employee_count',
          description: 'Get employee headcount by department/position',
          endpoint: '/api/hr/ai/context/headcount',
          cacheDuration: 600000,
          supportedIntents: ['business_operations', 'research'],
          retrievalCost: 'low',
          priority: 65,
          pipelineSourceIds: ['module_context'],
          volatility: 'slow',
          freshnessPolicy: { maxAgeMs: 600000 },
        },
        {
          name: 'time_off_summary',
          description: 'Get time-off summary (who\'s off today/this week)',
          endpoint: '/api/hr/ai/context/time-off',
          cacheDuration: 300000,
          supportedIntents: ['business_operations', 'planning', 'workflow_action'],
          retrievalCost: 'medium',
          priority: 70,
          pipelineSourceIds: ['module_context'],
          volatility: 'dynamic',
          freshnessPolicy: { maxAgeMs: 300000 },
        },
      ],
    },
  },
  {
    moduleId: 'scheduling',
    moduleName: 'Employee Scheduling',
    aiContext: {
      purpose: 'Employee shift scheduling and workforce planning for businesses',
      category: 'BUSINESS',
      keywords: [
        'schedule', 'shift', 'roster', 'staffing', 'coverage', 'rotation',
        'work schedule', 'shift schedule', 'employee schedule', 'team schedule',
        'swap shift', 'trade shift', 'open shift', 'availability',
        'on shift', 'off shift', 'scheduled', 'rostered'
      ],
      patterns: [
        'scheduling? (system|module|dashboard)',
        'who (is|works) (scheduled|on shift) (today|tomorrow|this week)',
        'my schedule',
        'create (a )?schedule',
        'publish schedule',
        'shift (swap|trade|coverage)',
        'open shifts?',
        'set (my )?availability',
        'schedule conflict',
        'coverage report'
      ],
      concepts: [
        'shift planning',
        'workforce scheduling',
        'labor management',
        'shift optimization',
        'coverage planning'
      ],
      entities: [
        { 
          name: 'Schedule', 
          pluralName: 'Schedules', 
          description: 'A work schedule containing employee shifts' 
        },
        { 
          name: 'Shift', 
          pluralName: 'Shifts', 
          description: 'A scheduled work shift for an employee' 
        },
        { 
          name: 'ShiftSwap', 
          pluralName: 'ShiftSwaps', 
          description: 'A request to swap shifts between employees' 
        },
      ],
      actions: [
        { 
          name: 'view_schedules', 
          description: 'View work schedules', 
          permissions: ['scheduling:admin'] 
        },
        { 
          name: 'create_schedule', 
          description: 'Create a new work schedule', 
          permissions: ['scheduling:schedules:write'] 
        },
        { 
          name: 'publish_schedule', 
          description: 'Publish a schedule to employees', 
          permissions: ['scheduling:schedules:publish'] 
        },
        { 
          name: 'assign_shift', 
          description: 'Assign an employee to a shift', 
          permissions: ['scheduling:schedules:write'] 
        },
        { 
          name: 'swap_shift', 
          description: 'Request or approve shift swaps', 
          permissions: ['scheduling:swaps:request'] 
        },
        { 
          name: 'set_availability', 
          description: 'Set employee availability preferences', 
          permissions: ['scheduling:availability:manage'] 
        },
        { 
          name: 'claim_open_shift', 
          description: 'Claim an available open shift', 
          permissions: ['scheduling:shifts:claim'] 
        },
        { 
          name: 'generate_schedule', 
          description: 'AI-powered automatic schedule generation using philosophy engine', 
          permissions: ['scheduling:schedules:write']
        },
        { 
          name: 'suggest_assignments', 
          description: 'Get AI suggestions for shift assignments based on availability and strategy', 
          permissions: ['scheduling:schedules:write']
        },
      ],
      contextProviders: [
        {
          name: 'scheduling_overview',
          description: 'Get scheduling system overview and statistics',
          endpoint: '/api/scheduling/ai/context/overview',
          cacheDuration: 300000,
          supportedIntents: ['business_operations', 'workflow_action', 'planning'],
          retrievalCost: 'medium',
          priority: 75,
          pipelineSourceIds: ['module_context'],
          volatility: 'dynamic',
          freshnessPolicy: { maxAgeMs: 300000 },
        },
        {
          name: 'coverage_status',
          description: 'Get current and upcoming coverage status',
          endpoint: '/api/scheduling/ai/context/coverage',
          cacheDuration: 600000,
          supportedIntents: ['business_operations', 'planning'],
          retrievalCost: 'medium',
          priority: 70,
          pipelineSourceIds: ['module_context'],
          volatility: 'dynamic',
          freshnessPolicy: { maxAgeMs: 600000 },
        },
        {
          name: 'scheduling_conflicts',
          description: 'Get scheduling conflicts and gaps',
          endpoint: '/api/scheduling/ai/context/conflicts',
          cacheDuration: 300000,
          supportedIntents: ['business_operations', 'workflow_action'],
          retrievalCost: 'medium',
          priority: 65,
          pipelineSourceIds: ['module_context'],
          volatility: 'dynamic',
          freshnessPolicy: { maxAgeMs: 300000 },
        },
      ],
    },
  },
  {
    moduleId: 'todo',
    moduleName: 'To-Do',
    aiContext: {
      purpose: 'Task and to-do management with AI-powered prioritization and scheduling',
      category: 'PRODUCTIVITY',
      keywords: [
        'task', 'todo', 'to-do', 'item', 'action', 'reminder',
        'deadline', 'due date', 'priority', 'urgent', 'important',
        'complete', 'done', 'finished', 'pending', 'in progress',
        'assign', 'assigned', 'my tasks', 'tasks due'
      ],
      patterns: [
        'show (my )?tasks',
        'what (tasks|todos) (do I have|are due) (today|tomorrow|this week)',
        'create (a )?task',
        'complete (the )?task',
        'tasks? (assigned to|for) (me|user)',
        'overdue tasks?',
        'high priority tasks?',
        'what (should I|can I) work on',
        'tasks? due (today|tomorrow|this week)'
      ],
      concepts: [
        'task management',
        'to-do lists',
        'task prioritization',
        'deadline management',
        'task assignment',
        'productivity tracking'
      ],
      entities: [
        { name: 'Task', pluralName: 'Tasks', description: 'A to-do item or task' },
        { name: 'Todo', pluralName: 'Todos', description: 'A task or to-do item' },
        { name: 'Subtask', pluralName: 'Subtasks', description: 'A sub-task within a parent task' },
        { name: 'Project', pluralName: 'Projects', description: 'A group of related tasks' }
      ],
      actions: [
        { name: 'create_task', description: 'Create a new task', permissions: ['todo:write'] },
        { name: 'complete_task', description: 'Mark a task as complete', permissions: ['todo:write'] },
        { name: 'list_tasks', description: 'List user tasks', permissions: ['todo:read'] },
        { name: 'assign_task', description: 'Assign a task to a user', permissions: ['todo:assign'] },
        { name: 'prioritize_tasks', description: 'Get AI-powered task prioritization', permissions: ['todo:read'] }
      ],
      contextProviders: [
        {
          name: 'task_overview',
          description: 'Get overview of user tasks (counts, status breakdown)',
          endpoint: '/api/todo/ai/context/overview',
          cacheDuration: 300000, // 5 minutes
        },
        {
          name: 'upcoming_tasks',
          description: 'Get upcoming tasks due soon',
          endpoint: '/api/todo/ai/context/upcoming',
          cacheDuration: 300000, // 5 minutes
        },
        {
          name: 'overdue_tasks',
          description: 'Get overdue tasks',
          endpoint: '/api/todo/ai/context/overdue',
          cacheDuration: 120000, // 2 minutes
        },
        {
          name: 'priority_tasks',
          description: 'Get high priority tasks',
          endpoint: '/api/todo/ai/context/priority',
          cacheDuration: 300000, // 5 minutes
        },
      ],
    },
  },
  {
    moduleId: 'notes',
    moduleName: 'Notes',
    aiContext: {
      purpose: 'Rich text notes with tags, search, and organization for personal and business use',
      category: 'PRODUCTIVITY',
      keywords: [
        'note',
        'notes',
        'journal',
        'ideas',
        'meeting notes',
        'writing',
        'jot down',
        'memo',
        'scratch',
        'pinned notes',
        'my notes',
      ],
      patterns: [
        'show my notes',
        'what did I write about',
        'pinned notes',
        'recent notes',
        'my (latest |recent )?notes',
        'notes (about|on)',
        'search (my )?notes',
      ],
      concepts: ['note taking', 'journaling', 'ideas', 'meeting notes', 'organization'],
      entities: [
        { name: 'Note', pluralName: 'Notes', description: 'A note with title, content, and optional tags' },
      ],
      actions: [
        { name: 'create_note', description: 'Create a new note', permissions: ['notes:write'] },
        { name: 'update_note', description: 'Update an existing note', permissions: ['notes:write'] },
        { name: 'delete_note', description: 'Delete a note', permissions: ['notes:delete'] },
        { name: 'list_notes', description: 'List user notes', permissions: ['notes:read'] },
      ],
      contextProviders: [
        {
          name: 'recent_notes',
          description: 'Get user\'s most recent notes (title, tags, pinned, last updated)',
          endpoint: '/api/notes/ai/context/recent',
          cacheDuration: 300000, // 5 minutes
        },
        {
          name: 'pinned_notes',
          description: 'Get user\'s pinned notes',
          endpoint: '/api/notes/ai/context/pinned',
          cacheDuration: 300000, // 5 minutes
        },
      ],
    },
  },
  {
    moduleId: 'notebook',
    moduleName: 'Notebook',
    aiContext: {
      purpose:
        'Unified workspace for pages (stored as notes) and tasks — conduct meetings and follow-ups without switching modules',
      category: 'PRODUCTIVITY',
      keywords: [
        'notebook',
        'page',
        'pages',
        'meeting notes',
        'meeting page',
        'project brief',
        'tasks',
        'promote to task',
        'templates',
      ],
      patterns: [
        'open notebook',
        'my pages',
        'recent pages',
        'meeting notes',
        'create a page',
        'notebook tasks',
      ],
      concepts: ['meeting notes', 'pages', 'sections', 'task promotion', 'templates'],
      entities: [
        { name: 'Page', pluralName: 'Pages', description: 'A note presented as a Notebook page' },
        { name: 'Task', pluralName: 'Tasks', description: 'A to-do item shown in Notebook task panels' },
      ],
      actions: [
        { name: 'create_page', description: 'Create a new page (note)', permissions: ['notes:write'] },
        { name: 'list_pages', description: 'List pages', permissions: ['notes:read'] },
        { name: 'create_task', description: 'Create a task from Notebook', permissions: ['todo:write'] },
        { name: 'list_tasks', description: 'List open tasks', permissions: ['todo:read'] },
        {
          name: 'summarize_page',
          description: 'Summarize a page (read-only)',
          permissions: ['notes:read', 'notebook:link:read'],
        },
        {
          name: 'extract_action_items',
          description: 'Propose action items from a page (no auto-write)',
          permissions: ['notes:read', 'notebook:link:read'],
        },
        {
          name: 'meeting_recap',
          description: 'Generate a meeting recap from a page (read-only)',
          permissions: ['notes:read', 'notebook:link:read'],
        },
        {
          name: 'suggest_links',
          description: 'Suggest links to tasks or events (read-only)',
          permissions: ['notes:read', 'notebook:link:read'],
        },
        {
          name: 'get_page_ai_context',
          description: 'Load grounded page context for AI (read-only)',
          permissions: ['notes:read', 'notebook:link:read'],
        },
      ],
      contextProviders: [
        {
          name: 'recent_pages',
          description: 'Recent Notebook pages (notes API)',
          endpoint: '/api/notes/ai/context/recent',
          cacheDuration: 300000,
        },
        {
          name: 'pinned_pages',
          description: 'Pinned pages (notes API)',
          endpoint: '/api/notes/ai/context/pinned',
          cacheDuration: 300000,
        },
        {
          name: 'task_overview',
          description: 'Task overview (todo API)',
          endpoint: '/api/todo/ai/context/overview',
          cacheDuration: 300000,
        },
      ],
    },
  },
  {
    moduleId: 'vlink',
    moduleName: 'V_Link',
    aiContext: {
      purpose: 'Confirmed cross-module relationships (vlinks) scoped to user membership — does not grant entity access',
      category: 'PRODUCTIVITY',
      keywords: ['vlink', 'v_link', 'linked', 'relationship', 'context bundle'],
      patterns: ['my vlinks', 'linked items', 'what is connected'],
      concepts: ['contextual relationships', 'confirmed links'],
      entities: [
        { name: 'VLink', pluralName: 'VLinks', description: 'A confirmed cross-module relationship container' },
      ],
      actions: [
        { name: 'list_vlinks', description: 'List user vlinks', permissions: ['vlink:read'] },
        { name: 'link_entity', description: 'Link an entity to a vlink', permissions: ['vlink:entity:link'] },
      ],
      contextProviders: [
        {
          name: 'recent_vlinks',
          description: 'Recent confirmed vlinks with accessible linked entity summaries',
          endpoint: '/api/vlinks/ai/context/recent',
          cacheDuration: 300000,
        },
      ],
    },
  },
  {
    moduleId: 'place',
    moduleName: 'Vssyl Place',
    aiContext: {
      purpose: 'Personal Main Street — a user-built neighborhood connecting physical and digital businesses, services, and people with Mini Metro-style visualization',
      category: 'OTHER',
      keywords: [
        'place', 'neighborhood', 'main street', 'business', 'follow',
        'connection', 'local', 'discover', 'explore', 'restaurant',
        'store', 'shop', 'service', 'node', 'map', 'meeting',
        'reservation', 'order', 'transaction', 'purchase', 'delivery'
      ],
      patterns: [
        'show (my )?place',
        'what businesses (am I|do I) follow',
        'how many (places|businesses|connections) (do I have|in my place)',
        'discover (new )?(businesses|places|restaurants)',
        'what.s in my neighborhood',
        'local (businesses|restaurants|stores)',
        'explore (new )?places',
        'order (food|from)',
        'make a reservation',
        'book a table',
        'how much (have I spent|did I spend)',
        'my (transactions|purchases|activity)',
        'meeting (with|at|place)',
        'where (should|can) (we|I) (meet|eat|go)'
      ],
      concepts: [
        'personal neighborhood',
        'business discovery',
        'local commerce',
        'connection network',
        'user-curated space',
        'meeting coordination',
        'purchase assistance',
        'reservation booking'
      ],
      entities: [
        { name: 'Place', pluralName: 'Places', description: 'A user\'s personal Main Street / neighborhood' },
        { name: 'Node', pluralName: 'Nodes', description: 'A business or user connection on the Main Street' },
        { name: 'Interest', pluralName: 'Interests', description: 'A category preference for discovery' },
      ],
      actions: [
        { name: 'view_place', description: 'View the user\'s personal Main Street', permissions: ['place:read'] },
        { name: 'add_node', description: 'Add a business or connection to the neighborhood', permissions: ['place:write'] },
        { name: 'explore_businesses', description: 'Discover new businesses and places', permissions: ['place:read'] },
      ],
      contextProviders: [
        {
          name: 'place_overview',
          description: 'Get Place overview — node count, interests, setup status',
          endpoint: '/api/place/ai/context/overview',
          cacheDuration: 300000,
          supportedIntents: ['general_chat', 'workflow_action'],
          retrievalCost: 'low',
          priority: 60,
          pipelineSourceIds: ['module_context'],
          volatility: 'slow',
          freshnessPolicy: { maxAgeMs: 300000 },
        },
        {
          name: 'place_connections',
          description: 'Get user connections — followed businesses with names, user connections count',
          endpoint: '/api/place/ai/context/connections',
          cacheDuration: 300000,
          supportedIntents: ['general_chat', 'planning'],
          retrievalCost: 'medium',
          priority: 55,
          pipelineSourceIds: ['module_context'],
          volatility: 'dynamic',
          freshnessPolicy: { maxAgeMs: 300000 },
        },
        {
          name: 'place_discoveries',
          description: 'Get discovery data — total available businesses, category breakdown, trending',
          endpoint: '/api/place/ai/context/discoveries',
          cacheDuration: 600000,
          supportedIntents: ['local_discovery', 'recommendation', 'general_chat'],
          retrievalCost: 'medium',
          priority: 90,
          pipelineSourceIds: ['vssyl_place', 'module_context'],
          volatility: 'dynamic',
          freshnessPolicy: { maxAgeMs: 600000 },
        },
        {
          name: 'place_activity',
          description: 'Get user transaction activity — purchases, external clicks, top businesses, upcoming meetings',
          endpoint: '/api/place/ai/context/activity',
          cacheDuration: 300000,
          supportedIntents: ['workflow_action', 'planning', 'recommendation'],
          retrievalCost: 'medium',
          priority: 65,
          pipelineSourceIds: ['module_context'],
          volatility: 'dynamic',
          freshnessPolicy: { maxAgeMs: 300000 },
        },
        {
          name: 'place_analytics',
          description: 'Get user analytics — network size, spending, engagement level, communities, growth trends',
          endpoint: '/api/place/ai/context/analytics',
          cacheDuration: 600000,
          supportedIntents: ['recommendation', 'business_operations'],
          retrievalCost: 'high',
          priority: 40,
          pipelineSourceIds: ['module_context'],
          volatility: 'slow',
          freshnessPolicy: { maxAgeMs: 600000 },
        },
      ],
    },
  },
  {
    moduleId: 'dashboard',
    moduleName: 'Dashboard',
    aiContext: {
      purpose: 'Customizable dashboard with widgets for quick access to modules and at-a-glance information',
      category: 'PRODUCTIVITY',
      keywords: [
        'dashboard', 'widget', 'widgets', 'overview', 'home', 'stats',
        'quick stats', 'notifications', 'activity', 'bookmarks', 'notes',
        'layout', 'customize', 'personalize'
      ],
      patterns: [
        'my dashboard',
        'dashboard (widgets?|layout|overview)',
        'what.s on my dashboard',
        'how many widgets',
        'customize (my )?dashboard',
        'add (a )?widget',
        'remove (a )?widget',
        'dashboard (settings|preferences)'
      ],
      concepts: [
        'dashboard customization',
        'widget management',
        'at-a-glance information',
        'personalized overview',
        'quick access'
      ],
      entities: [
        { name: 'Dashboard', pluralName: 'Dashboards', description: 'A customizable dashboard tab' },
        { name: 'Widget', pluralName: 'Widgets', description: 'A dashboard widget component' },
      ],
      actions: [
        { name: 'view_dashboard', description: 'View the dashboard', permissions: ['dashboard:read'] },
        { name: 'add_widget', description: 'Add a widget to the dashboard', permissions: ['dashboard:write'] },
        { name: 'remove_widget', description: 'Remove a widget from the dashboard', permissions: ['dashboard:write'] },
        { name: 'customize_layout', description: 'Customize widget layout', permissions: ['dashboard:write'] },
      ],
      contextProviders: [
        {
          name: 'dashboard_overview',
          description: 'Get dashboard overview — widget list, layout summary, preferences',
          endpoint: '/api/dashboard/ai/context/overview',
          cacheDuration: 300000,
        },
        {
          name: 'dashboard_quick_stats',
          description: 'Get aggregated quick stats from all modules',
          endpoint: '/api/dashboard/ai/context/quick-stats',
          cacheDuration: 120000,
        },
        {
          name: 'dashboard_widget_summary',
          description: 'Get summary of widgets on the dashboard',
          endpoint: '/api/dashboard/ai/context/widgets',
          cacheDuration: 300000,
        },
      ],
    },
  },
];

// ============================================================================
// REGISTRATION LOGIC
// ============================================================================

/**
 * Get or find a system admin user to use as module developer
 * Built-in modules need a developer ID - we use the first admin user
 */
async function getSystemDeveloperId(): Promise<string | null> {
  try {
    // First, try to find an existing admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    if (adminUser) {
      return adminUser.id;
    }

    // If no admin, find any user (fallback for fresh installations)
    const anyUser = await prisma.user.findFirst({
      select: { id: true },
    });

    return anyUser?.id || null;
  } catch (error: unknown) {
    logRegistrationError('Error finding system developer', 'register_modules_find_system_developer', error);
    return null;
  }
}

/**
 * Ensure a built-in module exists in the Module table
 * Creates it if missing, updates it if name/description changed
 */
async function ensureModuleExists(moduleId: string, developerId: string): Promise<boolean> {
  try {
    // Find module definition
    const moduleDef = BUILT_IN_MODULE_DEFINITIONS.find(m => m.id === moduleId);
    if (!moduleDef) {
      logRegistrationWarn('No module definition found', 'register_modules_missing_definition', { moduleId });
      return false;
    }

    // Check if module already exists
    const existingModule = await prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (existingModule) {
      const manifestRecord =
        existingModule.manifest && typeof existingModule.manifest === 'object'
          ? (existingModule.manifest as Record<string, unknown>)
          : {};
      const reconciledManifest = reconcileBuiltInManifest(
        moduleId as BuiltInModuleId,
        manifestRecord
      );
      const metadataChanged =
        existingModule.name !== moduleDef.name ||
        existingModule.description !== moduleDef.description ||
        existingModule.icon !== moduleDef.icon ||
        JSON.stringify(existingModule.tags) !== JSON.stringify(moduleDef.tags) ||
        existingModule.category !== moduleDef.category;
      const manifestChanged =
        JSON.stringify(manifestRecord) !== JSON.stringify(reconciledManifest);

      if (metadataChanged || manifestChanged) {
        logRegistrationInfo('Reconciling built-in module record', 'register_modules_reconcile_module', {
          moduleId,
          metadataChanged,
          manifestChanged,
        });
        await prisma.module.update({
          where: { id: moduleId },
          data: {
            name: moduleDef.name,
            description: moduleDef.description,
            icon: moduleDef.icon,
            tags: moduleDef.tags,
            category: moduleDef.category,
            manifest: reconciledManifest as Prisma.InputJsonValue,
            permissions: reconciledManifest.permissions as string[],
          },
        });
        logRegistrationInfo('Module reconciled successfully', 'register_modules_reconcile_module_success', {
          moduleId,
          moduleName: moduleDef.name,
        });
      }
      return true;
    }

    // Create the module if it doesn't exist
    logRegistrationInfo('Creating module record', 'register_modules_create_module', {
      moduleId,
      moduleName: moduleDef.name,
    });
    const reconciledManifest = reconcileBuiltInManifest(moduleId as BuiltInModuleId, null);
    await prisma.module.create({
      data: {
        id: moduleDef.id,
        name: moduleDef.name,
        description: moduleDef.description,
        version: moduleDef.version,
        category: moduleDef.category,
        tags: moduleDef.tags,
        icon: moduleDef.icon,
        screenshots: [],
        developerId: developerId,
        status: 'APPROVED',
        downloads: 0,
        rating: 0,
        reviewCount: 0,
        manifest: reconciledManifest as Prisma.InputJsonValue,
        dependencies: [],
        permissions: reconciledManifest.permissions as string[],
        pricingTier: moduleDef.pricingTier,
        basePrice: 0,
        enterprisePrice: 0,
        isProprietary: false,
      },
    });

    logRegistrationInfo('Module created successfully', 'register_modules_create_module_success', {
      moduleId,
      moduleName: moduleDef.name,
    });
    return true;
  } catch (error: unknown) {
    logRegistrationError('Error ensuring module exists', 'register_modules_ensure_module_exists', error, {
      moduleId,
    });
    return false;
  }
}

/** Result of registering a single module */
interface RegisterModuleResult {
  success: boolean;
  action?: 'created' | 'updated';
  error?: string;
}

function logRegistrationDebug(message: string, operation: string, context?: Record<string, unknown>): void {
  void logger.debug(message, { operation, ...context });
}

function logRegistrationInfo(message: string, operation: string, context?: Record<string, unknown>): void {
  void logger.info(message, { operation, ...context });
}

function logRegistrationWarn(message: string, operation: string, context?: Record<string, unknown>): void {
  void logger.warn(message, { operation, ...context });
}

function logRegistrationError(
  message: string,
  operation: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  void logger.error(message, {
    operation,
    error: { message: err.message, stack: err.stack },
    ...context,
  });
}

/**
 * Production self-heal for legacy schema drift:
 * some environments still have a required "moduleVersion" column on
 * module_ai_context_registry. Ensure it has a default so inserts succeed.
 */
async function ensureLegacyRegistryCompatibility(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'module_ai_context_registry'
            AND column_name = 'moduleVersion'
        ) THEN
          -- Backfill existing rows if any nulls exist
          UPDATE "module_ai_context_registry"
          SET "moduleVersion" = '1.0.0'
          WHERE "moduleVersion" IS NULL;

          -- Ensure future inserts have a default value
          ALTER TABLE "module_ai_context_registry"
          ALTER COLUMN "moduleVersion" SET DEFAULT '1.0.0';
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'module_ai_context_registry'
            AND column_name = 'lastUpdatedAt'
        ) THEN
          -- Backfill existing rows if any nulls exist
          UPDATE "module_ai_context_registry"
          SET "lastUpdatedAt" = CURRENT_TIMESTAMP
          WHERE "lastUpdatedAt" IS NULL;

          -- Ensure future inserts have a default value
          ALTER TABLE "module_ai_context_registry"
          ALTER COLUMN "lastUpdatedAt" SET DEFAULT CURRENT_TIMESTAMP;
        END IF;
      END $$;
    `);
  } catch (error: unknown) {
    // Non-fatal: registration still attempts normal path.
    logRegistrationWarn(
      'Could not run legacy registry compatibility check',
      'register_modules_legacy_registry_compatibility',
      { errorMessage: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Register a single module's AI context
 * Now also ensures the Module record exists first
 */
async function registerModule(
  moduleId: string, 
  moduleName: string, 
  aiContext: ModuleAIContext,
  developerId: string
): Promise<RegisterModuleResult> {
  try {
    logRegistrationInfo('Registering built-in module AI context', 'register_modules_register_context', {
      moduleId,
      moduleName,
    });

    // Step 1: Ensure the module exists in the Module table
    const moduleCreated = await ensureModuleExists(moduleId, developerId);
    if (!moduleCreated) {
      const msg = `Could not ensure Module '${moduleId}' exists`;
      logRegistrationWarn(msg, 'register_modules_ensure_module_failed', { moduleId, moduleName });
      return { success: false, error: msg };
    }

    // Step 2: Check if AI context already registered
    const existing = await prisma.moduleAIContextRegistry.findUnique({
      where: { moduleId },
    });

    if (existing) {
      await prisma.moduleAIContextRegistry.update({
        where: { moduleId },
        data: {
          moduleName,
          purpose: aiContext.purpose,
          category: aiContext.category,
          keywords: aiContext.keywords,
          patterns: aiContext.patterns,
          concepts: aiContext.concepts,
          entities: aiContext.entities as any,
          actions: aiContext.actions as any,
          contextProviders: aiContext.contextProviders as any,
          relationships: (aiContext.relationships || []) as any,
          fullAIContext: aiContext as any,
          version: '1.0.0',
          lastUpdated: new Date(),
        },
      });
      logRegistrationInfo('Module AI context updated', 'register_modules_context_updated', {
        moduleId,
        moduleName,
      });
      return { success: true, action: 'updated' };
    }

    // Step 3: Register the AI context
    logRegistrationInfo('Creating module AI context registry entry', 'register_modules_context_create', {
      moduleId,
      moduleName,
    });
    
    const created = await prisma.moduleAIContextRegistry.create({
      data: {
        moduleId,
        moduleName,
        purpose: aiContext.purpose,
        category: aiContext.category,
        keywords: aiContext.keywords,
        patterns: aiContext.patterns,
        concepts: aiContext.concepts,
        entities: aiContext.entities as any,
        actions: aiContext.actions as any,
        contextProviders: aiContext.contextProviders as any,
        relationships: (aiContext.relationships || []) as any,
        fullAIContext: aiContext as any,
        version: '1.0.0',
        lastUpdated: new Date(),
      },
    });

    logRegistrationInfo('Module AI context registered', 'register_modules_context_created', {
      moduleId,
      moduleName,
      registryEntryId: created.id,
    });
    return { success: true, action: 'created' };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const msg = `${moduleName}: ${err.message}`;
    logRegistrationError('Error registering module AI context', 'register_modules_context_error', err, {
      moduleId,
      moduleName,
    });
    return { success: false, error: msg };
  }
}

/**
 * Main function - checks and registers built-in modules
 * This is called during server startup
 * 
 * Now also creates Module records if they don't exist (fixes production issue)
 */
/** Result returned from registration - includes any errors for debugging */
export interface RegistrationResult {
  successCount: number;
  createdCount: number;
  updatedCount: number;
  errors: string[];
}

export async function registerBuiltInModulesOnStartup(): Promise<RegistrationResult> {
  const emptyResult: RegistrationResult = { successCount: 0, createdCount: 0, updatedCount: 0, errors: [] };

  try {
    await ensureLegacyRegistryCompatibility();

    logRegistrationInfo('Module AI Context Registry startup check started', 'register_modules_startup_check');

    // Check if registry is empty
    let registryCount: number;
    try {
      registryCount = await prisma.moduleAIContextRegistry.count();
      logRegistrationDebug('Current registry count fetched', 'register_modules_registry_count', { registryCount });
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      logRegistrationError('Database error during registry count', 'register_modules_registry_count_error', dbError, {
        errorMessage,
      });
      if (errorMessage.includes("Can't reach database") || errorMessage.includes('localhost:5432')) {
        logRegistrationWarn('Database not available during startup', 'register_modules_db_unavailable_startup');
        return emptyResult;
      }
      throw dbError;
    }

    const developerId = await getSystemDeveloperId();
    if (!developerId) {
      logRegistrationWarn(
        'No users found in database; cannot create built-in module records',
        'register_modules_no_system_developer'
      );
      return emptyResult;
    }
    logRegistrationDebug('Using system developer for module creation', 'register_modules_using_developer', {
      developerIdPrefix: developerId.substring(0, 8),
    });

    if (registryCount > 0) {
      const registered = await prisma.moduleAIContextRegistry.findMany({
        select: { moduleId: true },
      });
      logRegistrationDebug('Found existing module AI context entries', 'register_modules_existing_entries', {
        registryCount,
        registeredModuleIds: registered.map((r: { moduleId: string }) => r.moduleId),
      });
    } else {
      logRegistrationInfo('Registry is empty; all built-in modules will be created', 'register_modules_registry_empty');
    }

    const modulesToRegister = BUILT_IN_MODULES;

    logRegistrationInfo('Built-in modules selected for processing', 'register_modules_to_process', {
      moduleIds: modulesToRegister.map(m => m.moduleId),
    });

    if (modulesToRegister.length === 0) {
      logRegistrationInfo('No built-in modules configured', 'register_modules_none_configured');
      return emptyResult;
    }

    logRegistrationInfo('Processing built-in module AI contexts', 'register_modules_processing', {
      moduleCount: modulesToRegister.length,
    });

    let successCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    const registrationErrors: string[] = [];

    for (const { moduleId, moduleName, aiContext } of modulesToRegister) {
      try {
        const result = await registerModule(moduleId, moduleName, aiContext, developerId);
        if (result.success) {
          successCount++;
          if (result.action === 'created') createdCount++;
          if (result.action === 'updated') updatedCount++;
        } else {
          registrationErrors.push(result.error || `Unknown error for ${moduleName}`);
        }
      } catch (dbError) {
        const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
        if (errorMessage.includes("Can't reach database") || errorMessage.includes('localhost:5432')) {
          logRegistrationWarn('Database connection lost during registration', 'register_modules_db_connection_lost');
          return { successCount, createdCount, updatedCount, errors: registrationErrors };
        }
        registrationErrors.push(`${moduleName}: ${errorMessage}`);
      }
    }

    logRegistrationInfo('Built-in module registration completed', 'register_modules_complete', {
      successCount,
      createdCount,
      updatedCount,
      errorsCount: registrationErrors.length,
    });

    return { successCount, createdCount, updatedCount, errors: registrationErrors };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logRegistrationError('Error during built-in module registration', 'register_modules_fatal_error', err);
    return { successCount: 0, createdCount: 0, updatedCount: 0, errors: [err.message] };
  }
}

/**
 * Cleanup function (called when server shuts down)
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

