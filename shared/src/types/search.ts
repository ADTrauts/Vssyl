// Global Search Types and Interfaces

/** Tenant scope for global search (backward-compatible optional fields). */
export interface SearchContextScope {
  dashboardId?: string;
  businessId?: string;
  householdId?: string;
}

export interface SearchFilters {
  moduleId?: string;
  type?: string;
  dateRange?: {
    start: Date | string;
    end: Date | string;
  };
  permissions?: string[];
  // Optional: pinned results across modules (e.g. pinned files, chats)
  pinned?: boolean;
  // Optional Drive-specific mime category for file-type filters
  driveMimeCategory?: 'documents' | 'spreadsheets' | 'images' | 'videos';
  /** Personal / business / household tenant context (Phase 1A). */
  context?: SearchContextScope;
  /** Dashboard id list for calendar-style context filtering. */
  contexts?: string[];
}

export type SearchTenantContext = 'personal' | 'business' | 'household';

export type SearchProviderReadiness = 'ready' | 'partial' | 'planned';

export type SearchProviderMethod =
  | 'visibility_service'
  | 'prisma_filter'
  | 'platform_delegate'
  | 'partner_http_delegate';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  moduleId: string;
  moduleName: string;
  url: string;
  type: string;
  metadata: Record<string, unknown>;
  permissions: Permission[];
  lastModified: Date;
  relevanceScore?: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'result';
  moduleId?: string;
  url?: string;
}

/** Base search delegate (module + platform providers). */
export interface SearchProvider {
  moduleId: string;
  moduleName: string;
  search: (query: string, userId: string, filters?: SearchFilters) => Promise<SearchResult[]>;
  getSuggestions?: (query: string, userId: string) => Promise<string[]>;
}

/** Registered provider with platform capability metadata (Phase 1A). */
export interface RegisteredSearchProvider extends SearchProvider {
  providerId: string;
  displayName: string;
  entityTypes: string[];
  supportedContexts: SearchTenantContext[];
  requiredPermission: string;
  searchMethod: SearchProviderMethod;
  readiness: SearchProviderReadiness;
  /** Whether the module manifest claims `capabilities.search`. */
  manifestSearchClaim: boolean;
}

export interface GlobalSearchResponseMeta {
  query: string;
  providerCount: number;
  resultCount: number;
  providersInvoked: string[];
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  suggestions: SearchSuggestion[];
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
  history: string[];
  favorites: string[];
}

export interface SearchContextType {
  state: SearchState;
  search: (query: string, filters?: SearchFilters) => Promise<void>;
  getSuggestions: (query: string) => Promise<void>;
  clearResults: () => void;
  addToHistory: (query: string) => void;
  toggleFavorite: (query: string) => void;
  setFilters: (filters: SearchFilters) => void;
}

// Permission interface for search results
export interface Permission {
  type: 'read' | 'write' | 'admin';
  granted: boolean;
  inherited?: boolean;
}

// Search result types
export const SEARCH_RESULT_TYPES = {
  FILE: 'file',
  FOLDER: 'folder',
  MESSAGE: 'message',
  CONVERSATION: 'conversation',
  USER: 'user',
  TASK: 'task',
  CALENDAR_EVENT: 'calendar_event',
  DASHBOARD: 'dashboard',
  WIDGET: 'widget',
  VLINK: 'vlink',
  NOTE: 'note',
  PLACE_LISTING: 'place_listing',
} as const;

export type SearchResultType = typeof SEARCH_RESULT_TYPES[keyof typeof SEARCH_RESULT_TYPES];

// Module IDs for search providers
export const MODULE_IDS = {
  DRIVE: 'drive',
  CHAT: 'chat',
  DASHBOARD: 'dashboard',
  TASKS: 'tasks',
  CALENDAR: 'calendar',
  TODO: 'todo',
  NOTES: 'notes',
  PLACE: 'place',
  MEMBER: 'member',
  VLINK: 'vlink',
  ADMIN: 'admin',
} as const;

export type ModuleId = typeof MODULE_IDS[keyof typeof MODULE_IDS];
