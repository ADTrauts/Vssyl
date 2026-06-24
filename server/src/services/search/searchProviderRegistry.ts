import { prisma } from '../../lib/prisma';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import type { RegisteredSearchProvider, SearchFilters, SearchResult } from 'shared/types/search';
import {
  searchAccessibleDriveFiles,
  searchAccessibleDriveFolders,
  type DriveSearchMimeCategory,
} from '../driveVisibilityService';
import { searchAccessibleChat } from '../chatVisibilityService';
import { searchListingsForUser } from '../place/placeVisibilityService';
import { searchVLinksForUser } from '../vlinkService';
import { searchEvents } from '../calendarVisibilityService';
import { searchAccessibleTasks } from '../todoVisibilityService';
import { searchAccessiblePages } from '../notes/notesVisibilityService';
import { buildMemberSearchVisibilityWhere } from './memberSearchVisibility';
import { calculateRelevanceScore } from './searchRelevance';
import { buildPersonalOrBusinessModuleUrl } from './searchUrlBuilder';

async function searchDrive(query: string, userId: string, filters?: SearchFilters): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  let dateStart: Date | undefined;
  let dateEnd: Date | undefined;
  if (filters?.dateRange) {
    const startValue = filters.dateRange.start;
    const endValue = filters.dateRange.end;
    dateStart = startValue ? new Date(startValue) : undefined;
    dateEnd = endValue ? new Date(endValue) : undefined;
  }

  const driveFilters = {
    dateStart,
    dateEnd,
    pinnedOnly: filters?.pinned === true,
    driveMimeCategory: filters?.driveMimeCategory as DriveSearchMimeCategory | undefined,
  };

  const files = await searchAccessibleDriveFiles(userId, query, driveFilters, 10);
  const folders = await searchAccessibleDriveFolders(userId, query, driveFilters, 5);

  for (const file of files) {
    results.push({
      id: file.id,
      title: file.name,
      description: `File in ${file.folder?.name || 'root'}`,
      moduleId: 'drive',
      moduleName: 'File Hub',
      url: `/drive?file=${file.id}`,
      type: 'file',
      metadata: {
        size: file.size,
        type: file.type,
        folderId: file.folderId,
      },
      permissions: [{ type: 'read', granted: true }],
      lastModified: file.updatedAt,
      relevanceScore: calculateRelevanceScore(file.name, query),
    });
  }

  for (const folder of folders) {
    results.push({
      id: folder.id,
      title: folder.name,
      description: 'Folder',
      moduleId: 'drive',
      moduleName: 'File Hub',
      url: `/drive?folder=${folder.id}`,
      type: 'folder',
      metadata: {
        parentId: folder.parentId,
      },
      permissions: [{ type: 'read', granted: true }],
      lastModified: folder.updatedAt,
      relevanceScore: calculateRelevanceScore(folder.name, query),
    });
  }

  return results;
}

async function searchDashboard(query: string, userId: string, filters?: SearchFilters): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const businessId = filters?.context?.businessId;
  const householdId = filters?.context?.householdId;

  const dashboards = await prisma.dashboard.findMany({
    where: {
      AND: [
        { name: { contains: query, mode: 'insensitive' } },
        { userId },
        ...(businessId !== undefined
          ? [{ businessId: businessId || null }]
          : []),
        ...(householdId ? [{ householdId }] : []),
      ],
    },
    take: 5,
  });

  for (const dashboard of dashboards) {
    results.push({
      id: dashboard.id,
      title: dashboard.name,
      description: 'Dashboard',
      moduleId: 'dashboard',
      moduleName: 'Dashboard',
      url: `/dashboard/${dashboard.id}`,
      type: 'dashboard',
      metadata: {
        userId: dashboard.userId,
        businessId: dashboard.businessId,
        householdId: dashboard.householdId,
      },
      permissions: [{ type: 'read', granted: true }],
      lastModified: dashboard.updatedAt,
      relevanceScore: calculateRelevanceScore(dashboard.name, query),
    });
  }

  return results;
}

async function searchCalendar(query: string, userId: string, filters?: SearchFilters): Promise<SearchResult[]> {
  const contextDashboardIds = [
    ...(filters?.context?.dashboardId ? [filters.context.dashboardId] : []),
    ...(filters?.contexts ?? []),
  ];

  const events = await searchEvents({
    userId,
    text: query,
    contexts: contextDashboardIds.length > 0 ? contextDashboardIds : undefined,
  });

  return events.slice(0, 10).map((event) => ({
    id: event.id,
    title: event.title,
    description: event.location || event.calendar?.name || 'Calendar event',
    moduleId: 'calendar',
    moduleName: 'Calendar',
    url: buildPersonalOrBusinessModuleUrl('calendar', { eventId: event.id }, filters),
    type: 'calendar_event',
    metadata: {
      calendarId: event.calendarId,
      startAt: event.startAt,
      endAt: event.endAt,
      businessId: event.calendar?.contextId,
    },
    permissions: [{ type: 'read', granted: true }],
    lastModified: event.updatedAt,
    relevanceScore: calculateRelevanceScore(event.title, query),
  }));
}

async function searchTodo(query: string, userId: string, filters?: SearchFilters): Promise<SearchResult[]> {
  const tasks = await searchAccessibleTasks({
    userId,
    search: query,
    dashboardId: filters?.context?.dashboardId,
    businessId: filters?.context?.businessId,
    householdId: filters?.context?.householdId,
  });

  return tasks.slice(0, 10).map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description || 'Task',
    moduleId: 'todo',
    moduleName: 'Todo',
    url: buildPersonalOrBusinessModuleUrl('todo', { task: task.id }, filters),
    type: 'task',
    metadata: {
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      dashboardId: task.dashboardId,
      businessId: task.businessId,
    },
    permissions: [{ type: 'read', granted: true }],
    lastModified: task.updatedAt,
    relevanceScore: calculateRelevanceScore(task.title, query),
  }));
}

async function searchNotes(query: string, userId: string, filters?: SearchFilters): Promise<SearchResult[]> {
  const pages = await searchAccessiblePages({
    userId,
    query,
    dashboardId: filters?.context?.dashboardId,
    businessId: filters?.context?.businessId,
    householdId: filters?.context?.householdId,
    limit: 10,
  });

  return pages.map((page) => ({
    id: page.id,
    title: page.title,
    description: page.tags?.length ? `Tags: ${page.tags.join(', ')}` : 'Note page',
    moduleId: 'notes',
    moduleName: 'Notes',
    url: buildPersonalOrBusinessModuleUrl('notes', { page: page.id }, filters),
    type: 'note',
    metadata: {
      dashboardId: page.dashboardId,
      businessId: page.businessId,
      folderId: page.folderId,
      pinned: page.pinned,
    },
    permissions: [{ type: 'read', granted: true }],
    lastModified: page.updatedAt,
    relevanceScore: calculateRelevanceScore(page.title, query),
  }));
}

const driveSearchProvider: RegisteredSearchProvider = {
  providerId: 'drive',
  moduleId: 'drive',
  moduleName: 'File Hub',
  displayName: 'File Hub',
  entityTypes: ['file', 'folder'],
  supportedContexts: ['personal', 'business', 'household'],
  requiredPermission: POLICY_ACTIONS.FILE_READ,
  searchMethod: 'visibility_service',
  readiness: 'ready',
  manifestSearchClaim: true,
  search: searchDrive,
};

const chatSearchProvider: RegisteredSearchProvider = {
  providerId: 'chat',
  moduleId: 'chat',
  moduleName: 'Chat',
  displayName: 'Chat',
  entityTypes: ['message', 'conversation'],
  supportedContexts: ['personal', 'business'],
  requiredPermission: POLICY_ACTIONS.CHAT_MESSAGE_READ,
  searchMethod: 'visibility_service',
  readiness: 'ready',
  manifestSearchClaim: true,
  search: async (query: string, userId: string, filters?: SearchFilters) =>
    searchAccessibleChat(query, userId, filters),
};

const dashboardSearchProvider: RegisteredSearchProvider = {
  providerId: 'dashboard',
  moduleId: 'dashboard',
  moduleName: 'Dashboard',
  displayName: 'Dashboard',
  entityTypes: ['dashboard'],
  supportedContexts: ['personal', 'business', 'household'],
  requiredPermission: POLICY_ACTIONS.DASHBOARD_READ,
  searchMethod: 'prisma_filter',
  readiness: 'ready',
  manifestSearchClaim: true,
  search: searchDashboard,
};

const memberSearchProvider: RegisteredSearchProvider = {
  providerId: 'member',
  moduleId: 'member',
  moduleName: 'Members',
  displayName: 'Members',
  entityTypes: ['user'],
  supportedContexts: ['personal', 'business', 'household'],
  requiredPermission: POLICY_ACTIONS.USER_PROFILE_READ,
  searchMethod: 'prisma_filter',
  readiness: 'ready',
  manifestSearchClaim: false,
  search: async (query: string, userId: string) => {
    if (!query || query.length < 2) return [];
    const visibility = await buildMemberSearchVisibilityWhere(userId);
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          visibility,
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      take: 10,
    });
    return users.map((user) => ({
      id: user.id,
      title: user.name || user.email,
      description: user.email,
      moduleId: 'member',
      moduleName: 'Members',
      url: `/member/profile/${user.id}`,
      type: 'user',
      metadata: {},
      permissions: [{ type: 'read', granted: true }],
      lastModified: user.updatedAt,
      relevanceScore: 0.7,
    }));
  },
};

const calendarSearchProvider: RegisteredSearchProvider = {
  providerId: 'calendar',
  moduleId: 'calendar',
  moduleName: 'Calendar',
  displayName: 'Calendar',
  entityTypes: ['calendar_event'],
  supportedContexts: ['personal', 'business', 'household'],
  requiredPermission: POLICY_ACTIONS.CALENDAR_EVENT_READ,
  searchMethod: 'visibility_service',
  readiness: 'ready',
  manifestSearchClaim: true,
  search: searchCalendar,
};

const todoSearchProvider: RegisteredSearchProvider = {
  providerId: 'todo',
  moduleId: 'todo',
  moduleName: 'Todo',
  displayName: 'Todo',
  entityTypes: ['task'],
  supportedContexts: ['personal', 'business', 'household'],
  requiredPermission: POLICY_ACTIONS.TODO_TASK_READ,
  searchMethod: 'visibility_service',
  readiness: 'ready',
  manifestSearchClaim: true,
  search: searchTodo,
};

const notesSearchProvider: RegisteredSearchProvider = {
  providerId: 'notes',
  moduleId: 'notes',
  moduleName: 'Notes',
  displayName: 'Notes',
  entityTypes: ['note'],
  supportedContexts: ['personal', 'business'],
  requiredPermission: POLICY_ACTIONS.NOTES_PAGE_READ,
  searchMethod: 'visibility_service',
  readiness: 'ready',
  manifestSearchClaim: true,
  search: searchNotes,
};

const placeSearchProvider: RegisteredSearchProvider = {
  providerId: 'place',
  moduleId: 'place',
  moduleName: 'Place',
  displayName: 'Place',
  entityTypes: ['place_listing'],
  supportedContexts: ['personal', 'business'],
  requiredPermission: POLICY_ACTIONS.PLACE_LISTING_READ,
  searchMethod: 'visibility_service',
  readiness: 'ready',
  manifestSearchClaim: true,
  search: async (query: string, userId: string) => {
    if (!userId) return [];
    return searchListingsForUser(userId, query);
  },
};

const vlinkSearchProvider: RegisteredSearchProvider = {
  providerId: 'vlink',
  moduleId: 'vlink',
  moduleName: 'V_Link',
  displayName: 'V_Link',
  entityTypes: ['vlink'],
  supportedContexts: ['personal', 'business'],
  requiredPermission: POLICY_ACTIONS.VLINK_READ,
  searchMethod: 'platform_delegate',
  readiness: 'ready',
  manifestSearchClaim: true,
  search: async (query: string, userId: string) => {
    const rows = await searchVLinksForUser(userId, query);
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.publicCode,
      moduleId: 'vlink',
      moduleName: 'V_Link',
      url: row.url,
      type: 'vlink',
      metadata: { publicCode: row.publicCode, scope: row.scope },
      permissions: [{ type: 'read', granted: true }],
      lastModified: new Date(),
      relevanceScore: 0.85,
    }));
  },
};

const SEARCH_PROVIDERS: RegisteredSearchProvider[] = [
  driveSearchProvider,
  chatSearchProvider,
  calendarSearchProvider,
  todoSearchProvider,
  notesSearchProvider,
  dashboardSearchProvider,
  memberSearchProvider,
  placeSearchProvider,
  vlinkSearchProvider,
];

export function getRegisteredSearchProviders(): RegisteredSearchProvider[] {
  return [...SEARCH_PROVIDERS];
}

export function getSearchProviderById(providerId: string): RegisteredSearchProvider | undefined {
  return SEARCH_PROVIDERS.find((p) => p.providerId === providerId);
}

export function getReadySearchProviders(): RegisteredSearchProvider[] {
  return SEARCH_PROVIDERS.filter((p) => p.readiness === 'ready');
}

/** Modules that claim manifest search must have a ready provider. */
export const MANIFEST_SEARCH_MODULE_IDS = [
  'drive',
  'chat',
  'calendar',
  'todo',
  'place',
  'notes',
] as const;

export function assertManifestSearchProviderParity(): void {
  const readyIds = new Set(getReadySearchProviders().map((p) => p.providerId));
  const missing = MANIFEST_SEARCH_MODULE_IDS.filter((id) => !readyIds.has(id));
  if (missing.length > 0) {
    throw new Error(`Manifest search modules missing providers: ${missing.join(', ')}`);
  }
}
