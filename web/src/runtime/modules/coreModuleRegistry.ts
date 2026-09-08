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
 *
 * Capability truth lives on backend/shared Module manifests — do not re-author
 * `capabilities` arrays here (Phase 4). Optional `ModuleDefinition.capabilities`
 * remains for future derived projections if a FE consumer appears.
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
  }),
  coreModule({
    id: 'notebook',
    name: 'Notebook',
    description: 'Pages and tasks in one meeting workspace',
    icon: 'notebook',
    widgets: ['notebook'],
    routes: [businessRoute('notebook', 'Notebook', 'notebook')],
    defaultRoute: 'notebook',
    category: 'productivity',
  }),
  coreModule({
    id: 'notes',
    name: 'Notes',
    description: 'Notes storage (use Notebook in the UI)',
    icon: 'notes',
    widgets: [],
    routes: [],
    category: 'productivity',
    status: 'disabled',
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
  }),
  coreModule({
    id: 'quickstats',
    name: 'Quick Stats',
    description: 'Dashboard-hosted widget; data owned by Analytics capability (K3-04)',
    icon: 'analytics',
    requiredPermissions: [],
    widgets: ['quickstats'],
    routes: [],
    category: 'utility',
    isCore: true,
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
  }),
  coreModule({
    id: 'workforce_comms',
    name: 'Workforce Communications',
    description: 'Broadcasts, acknowledgements, and front-page announcements',
    icon: 'workforce_comms',
    supportedContexts: BUSINESS_ONLY,
    widgets: [],
    routes: [businessRoute('workforce_comms', 'Workforce Communications', 'workforce-comms')],
    defaultRoute: 'workforce-comms',
    category: 'business',
    isBusinessScoped: true,
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
  }),
];

export const CORE_MODULE_BY_ID: Record<string, ModuleDefinition> = Object.fromEntries(
  CORE_MODULE_DEFINITIONS.map((m) => [m.id, m])
);
