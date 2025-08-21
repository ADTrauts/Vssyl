export interface SearchFilters {
    moduleId?: string;
    type?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
    permissions?: string[];
}
export interface SearchResult {
    id: string;
    title: string;
    description?: string;
    moduleId: string;
    moduleName: string;
    url: string;
    type: string;
    metadata: Record<string, any>;
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
export interface SearchProvider {
    moduleId: string;
    moduleName: string;
    search: (query: string, userId: string, filters?: SearchFilters) => Promise<SearchResult[]>;
    getSuggestions?: (query: string, userId: string) => Promise<string[]>;
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
export interface Permission {
    type: 'read' | 'write' | 'admin';
    granted: boolean;
    inherited?: boolean;
}
export declare const SEARCH_RESULT_TYPES: {
    readonly FILE: "file";
    readonly FOLDER: "folder";
    readonly MESSAGE: "message";
    readonly CONVERSATION: "conversation";
    readonly USER: "user";
    readonly TASK: "task";
    readonly CALENDAR_EVENT: "calendar_event";
    readonly DASHBOARD: "dashboard";
    readonly WIDGET: "widget";
};
export type SearchResultType = typeof SEARCH_RESULT_TYPES[keyof typeof SEARCH_RESULT_TYPES];
export declare const MODULE_IDS: {
    readonly DRIVE: "drive";
    readonly CHAT: "chat";
    readonly DASHBOARD: "dashboard";
    readonly TASKS: "tasks";
    readonly CALENDAR: "calendar";
    readonly ADMIN: "admin";
};
export type ModuleId = typeof MODULE_IDS[keyof typeof MODULE_IDS];
