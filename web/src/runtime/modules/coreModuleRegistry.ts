import type { ModuleDefinition, RouteDefinition, WorkspaceContextType } from './types';
import { nonAdminWorkspaceContexts } from './contextMapping';

const ALL_NON_ADMIN = nonAdminWorkspaceContexts();
const BUSINESS_ONLY: WorkspaceContextType[] = ['business'];

function businessRoute(
  moduleId: string,
  label: string,
  routeKey: string,
  path?: string
): RouteDefinition {
  return {
    moduleId,
    label,
    routeKey,
    path,
    context: 'business',
    requiredPermissions: ['view'],
  };
}

function coreModule(
  partial: Omit<ModuleDefinition, 'supportedContexts' | 'source' | 'status' | 'requiredPermissions'> & {
    supportedContexts?: WorkspaceContextType[];
    source?: ModuleDefinition['source'];
    status?: ModuleDefinition['status'];
    requiredPermissions?: string[];
  }
): ModuleDefinition {
  const {
    supportedContexts = ALL_NON_ADMIN,
    requiredPermissions = ['view'],
    source = 'core',
    status = 'active',
    ...rest
  } = partial;

  return {
    ...rest,
    supportedContexts,
    requiredPermissions,
    source,
    status,
  };
}

/**
 * First-party core modules. Marketplace/custom modules register separately in future.
 */
export const CORE_MODULE_DEFINITIONS: ModuleDefinition[] = [
  coreModule({
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Workspace overview and widgets',
    icon: 'dashboard',
    requiredPermissions: [],
    widgets: [],
    routes: [businessRoute('dashboard', 'Dashboard', 'dashboard')],
    defaultRoute: 'dashboard',
    category: 'core',
    isCore: true,
    capabilities: ['read'],
  }),
  coreModule({
    id: 'drive',
    name: 'File Hub',
    description: 'Files and document management',
    icon: 'drive',
    widgets: ['drive'],
    routes: [businessRoute('drive', 'File Hub', 'drive')],
    defaultRoute: 'drive',
    category: 'core',
    isCore: true,
    capabilities: [
      'read',
      'write',
      'trash',
      'search',
      'preview',
      'notifications',
      'realtime',
      'businessWorkspace',
      'globalActivity',
      'ai',
      'vlink',
    ],
  }),
  coreModule({
    id: 'chat',
    name: 'Chat',
    description: 'Team messaging',
    icon: 'chat',
    widgets: ['chat'],
    routes: [businessRoute('chat', 'Chat', 'chat')],
    defaultRoute: 'chat',
    category: 'communication',
    isCore: true,
    capabilities: ['read', 'write', 'realtime'],
  }),
  coreModule({
    id: 'calendar',
    name: 'Calendar',
    description: 'Events and scheduling',
    icon: 'calendar',
    widgets: ['calendar'],
    routes: [businessRoute('calendar', 'Calendar', 'calendar')],
    defaultRoute: 'calendar',
    category: 'productivity',
    isCore: true,
    capabilities: ['read', 'write'],
  }),
  coreModule({
    id: 'todo',
    name: 'To-Do',
    description: 'Tasks and priorities',
    icon: 'todo',
    widgets: ['todo'],
    routes: [businessRoute('todo', 'To-Do', 'todo')],
    defaultRoute: 'todo',
    category: 'productivity',
    capabilities: ['read', 'write', 'trash', 'ai', 'businessWorkspace'],
  }),
  coreModule({
    id: 'notes',
    name: 'Notes',
    description: 'Notes and organization',
    icon: 'notes',
    widgets: ['notes'],
    routes: [businessRoute('notes', 'Notes', 'notes')],
    defaultRoute: 'notes',
    category: 'productivity',
    capabilities: ['read', 'write'],
  }),
  coreModule({
    id: 'ai',
    name: 'AI Assistant',
    description: 'AI chat and suggestions',
    icon: 'ai',
    widgets: ['ai'],
    routes: [businessRoute('ai', 'AI Assistant', 'ai')],
    category: 'utility',
    isCore: true,
    capabilities: ['read', 'ai'],
  }),
  coreModule({
    id: 'notifications',
    name: 'Notifications',
    description: 'Alerts and updates',
    icon: 'notifications',
    requiredPermissions: [],
    widgets: ['notifications'],
    routes: [],
    category: 'utility',
    isCore: true,
    capabilities: ['read', 'notifications'],
  }),
  coreModule({
    id: 'quickstats',
    name: 'Quick Stats',
    description: 'Key metrics at a glance',
    icon: 'analytics',
    requiredPermissions: [],
    widgets: ['quickstats'],
    routes: [],
    category: 'utility',
    isCore: true,
    capabilities: ['read', 'analytics'],
  }),
  coreModule({
    id: 'quicknotes',
    name: 'Quick Notes',
    description: 'Quick thoughts',
    icon: 'notes',
    requiredPermissions: [],
    widgets: ['quicknotes'],
    routes: [],
    category: 'utility',
    isCore: true,
    capabilities: ['read', 'write'],
  }),
  coreModule({
    id: 'bookmarks',
    name: 'Bookmarks',
    description: 'Saved links',
    icon: 'bookmarks',
    requiredPermissions: [],
    widgets: ['bookmarks'],
    routes: [],
    category: 'utility',
    isCore: true,
    capabilities: ['read'],
  }),
  coreModule({
    id: 'activityfeed',
    name: 'Activity Feed',
    description: 'Cross-module activity',
    icon: 'activityfeed',
    requiredPermissions: [],
    widgets: ['activityfeed'],
    routes: [],
    category: 'utility',
    isCore: true,
    capabilities: ['read', 'realtime'],
  }),
  coreModule({
    id: 'hr',
    name: 'HR',
    description: 'Human resources',
    icon: 'hr',
    supportedContexts: BUSINESS_ONLY,
    widgets: ['hr'],
    routes: [businessRoute('hr', 'HR', 'hr')],
    defaultRoute: 'hr',
    category: 'business',
    isBusinessScoped: true,
    capabilities: ['read', 'write', 'admin'],
  }),
  coreModule({
    id: 'scheduling',
    name: 'Scheduling',
    description: 'Shifts and coverage',
    icon: 'scheduling',
    supportedContexts: BUSINESS_ONLY,
    widgets: ['scheduling'],
    routes: [businessRoute('scheduling', 'Scheduling', 'scheduling')],
    defaultRoute: 'scheduling',
    category: 'business',
    isBusinessScoped: true,
    capabilities: ['read', 'write'],
  }),
  coreModule({
    id: 'analytics',
    name: 'Analytics',
    description: 'Business insights',
    icon: 'analytics',
    supportedContexts: BUSINESS_ONLY,
    widgets: [],
    routes: [businessRoute('analytics', 'Analytics', 'analytics')],
    defaultRoute: 'analytics',
    category: 'business',
    isBusinessScoped: true,
    capabilities: ['read', 'analytics'],
  }),
  coreModule({
    id: 'members',
    name: 'Members',
    description: 'Team members and connections',
    icon: 'members',
    supportedContexts: BUSINESS_ONLY,
    widgets: [],
    routes: [
      businessRoute('members', 'Members', 'members', '/workspace/members'),
    ],
    defaultRoute: 'members',
    category: 'business',
    isBusinessScoped: true,
    capabilities: ['read', 'write', 'admin'],
  }),
  coreModule({
    id: 'vlink',
    name: 'V_Link',
    description: 'Cross-module contextual relationships',
    icon: 'vlink',
    widgets: [],
    routes: [
      { moduleId: 'vlink', label: 'V_Link', routeKey: 'vlink', path: '/vlink', context: 'personal', requiredPermissions: ['view'] },
      businessRoute('vlink', 'V_Link', 'vlink', '/vlink'),
    ],
    defaultRoute: 'vlink',
    category: 'utility',
    capabilities: ['read', 'write', 'ai'],
  }),
  coreModule({
    id: 'place',
    name: 'Place',
    description: 'Personal Main Street and business listings',
    icon: 'place',
    widgets: [],
    routes: [
      { moduleId: 'place', label: 'Place', routeKey: 'place', path: '/place', context: 'personal', requiredPermissions: ['view'] },
      businessRoute('place', 'Place', 'place', '/place'),
    ],
    defaultRoute: 'place',
    category: 'utility',
    capabilities: ['read', 'write', 'ai', 'businessWorkspace'],
  }),
  coreModule({
    id: 'admin',
    name: 'Admin',
    description: 'Administrative controls',
    icon: 'admin',
    supportedContexts: ['admin', 'business'],
    widgets: [],
    routes: [],
    category: 'admin',
    capabilities: ['read', 'admin'],
    status: 'active',
  }),
];

export const CORE_MODULE_BY_ID: Record<string, ModuleDefinition> = Object.fromEntries(
  CORE_MODULE_DEFINITIONS.map((m) => [m.id, m])
);
