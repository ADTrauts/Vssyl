"use strict";
// Global Search Types and Interfaces
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODULE_IDS = exports.SEARCH_RESULT_TYPES = void 0;
// Search result types
exports.SEARCH_RESULT_TYPES = {
    FILE: 'file',
    FOLDER: 'folder',
    MESSAGE: 'message',
    CONVERSATION: 'conversation',
    USER: 'user',
    TASK: 'task',
    CALENDAR_EVENT: 'calendar_event',
    DASHBOARD: 'dashboard',
    WIDGET: 'widget',
};
// Module IDs for search providers
exports.MODULE_IDS = {
    DRIVE: 'drive',
    CHAT: 'chat',
    DASHBOARD: 'dashboard',
    TASKS: 'tasks',
    CALENDAR: 'calendar',
    ADMIN: 'admin',
};
