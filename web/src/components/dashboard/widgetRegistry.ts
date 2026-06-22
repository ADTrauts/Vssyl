import {
  MessageCircle,
  Folder,
  Calendar,
  CheckSquare,
  FileText,
  Sparkles,
  Bell,
  BarChart3,
  StickyNote,
  Bookmark,
  Users,
  Clock,
  Activity,
  LucideIcon,
} from 'lucide-react';

export type WidgetCategory =
  | 'communication'
  | 'files'
  | 'productivity'
  | 'business'
  | 'utility';

export type WidgetContext = 'personal' | 'business' | 'educational' | 'household';

export interface WidgetRegistryEntry {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  category: WidgetCategory;
  /** Dashboard module hosts widget chrome (K3-04). */
  moduleId: string;
  /** Analytics Capability owns rollup data (K3-04). */
  capabilityId?: string;
  alwaysAvailable?: boolean;
  /** If set, widget only appears on these dashboard types. If unset, allowed on all. */
  contexts?: WidgetContext[];
}

export const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  communication: 'Communication',
  files: 'Files & Storage',
  productivity: 'Productivity',
  business: 'Business',
  utility: 'Utility',
};

export const CATEGORY_ORDER: WidgetCategory[] = [
  'productivity',
  'communication',
  'files',
  'business',
  'utility',
];

/**
 * Icon container shape classes by category for visual definition.
 * Communication & utility = circle; files = soft square; productivity = medium; business = rounded + ring.
 */
export function getIconShapeClass(category: WidgetCategory): string {
  switch (category) {
    case 'communication':
      return 'rounded-full'; // circle — messaging
    case 'files':
      return 'rounded-lg'; // soft square — documents/storage
    case 'productivity':
      return 'rounded-md'; // medium rounded — tasks/calendar
    case 'business':
      return 'rounded-xl ring-1 ring-black/5'; // distinct rounded + subtle ring — HR, scheduling
    case 'utility':
      return 'rounded-full'; // circle — tools, always-available
    default:
      return 'rounded-lg';
  }
}

export const WIDGET_REGISTRY: Record<string, WidgetRegistryEntry> = {
  chat: {
    id: 'chat',
    name: 'Chat',
    description: 'Recent conversations and quick messaging',
    icon: MessageCircle,
    color: 'text-blue-600 bg-blue-100',
    category: 'communication',
    moduleId: 'chat',
  },
  drive: {
    id: 'drive',
    name: 'File Hub',
    description: 'Recent files and storage overview',
    icon: Folder,
    color: 'text-amber-600 bg-amber-100',
    category: 'files',
    moduleId: 'drive',
  },
  calendar: {
    id: 'calendar',
    name: 'Calendar',
    description: 'Upcoming events and schedule',
    icon: Calendar,
    color: 'text-green-600 bg-green-100',
    category: 'productivity',
    moduleId: 'calendar',
  },
  todo: {
    id: 'todo',
    name: 'To-Do',
    description: 'Tasks, deadlines, and priorities',
    icon: CheckSquare,
    color: 'text-violet-600 bg-violet-100',
    category: 'productivity',
    moduleId: 'todo',
  },
  notebook: {
    id: 'notebook',
    name: 'Notebook',
    description: 'Recent pages and open task count',
    icon: FileText,
    color: 'text-slate-600 bg-slate-100',
    category: 'productivity',
    moduleId: 'notebook',
  },
  ai: {
    id: 'ai',
    name: 'AI Assistant',
    description: 'Quick AI chat and suggestions',
    icon: Sparkles,
    color: 'text-pink-600 bg-pink-100',
    category: 'utility',
    moduleId: 'ai',
    alwaysAvailable: true,
  },
  notifications: {
    id: 'notifications',
    name: 'Notifications',
    description: 'Latest alerts and updates',
    icon: Bell,
    color: 'text-red-600 bg-red-100',
    category: 'utility',
    moduleId: 'notifications',
    alwaysAvailable: true,
  },
  quickstats: {
    id: 'quickstats',
    name: 'Quick Stats',
    description: 'Key metrics at a glance (Analytics capability)',
    icon: BarChart3,
    color: 'text-cyan-600 bg-cyan-100',
    category: 'utility',
    moduleId: 'dashboard',
    capabilityId: 'analytics',
    alwaysAvailable: true,
  },
  quicknotes: {
    id: 'quicknotes',
    name: 'Quick Notes',
    description: 'Jot down quick thoughts',
    icon: StickyNote,
    color: 'text-yellow-600 bg-yellow-100',
    category: 'utility',
    moduleId: 'quicknotes',
    alwaysAvailable: true,
  },
  bookmarks: {
    id: 'bookmarks',
    name: 'Bookmarks',
    description: 'Quick links and saved pages',
    icon: Bookmark,
    color: 'text-indigo-600 bg-indigo-100',
    category: 'utility',
    moduleId: 'bookmarks',
    alwaysAvailable: true,
  },
  hr: {
    id: 'hr',
    name: 'HR',
    description: 'Employee info and HR metrics',
    icon: Users,
    color: 'text-teal-600 bg-teal-100',
    category: 'business',
    moduleId: 'hr',
    contexts: ['business'],
  },
  scheduling: {
    id: 'scheduling',
    name: 'Scheduling',
    description: 'Shifts, coverage, and availability',
    icon: Clock,
    color: 'text-orange-600 bg-orange-100',
    category: 'business',
    moduleId: 'scheduling',
    contexts: ['business'],
  },
  activityfeed: {
    id: 'activityfeed',
    name: 'Activity Feed',
    description: 'Recent activity across modules',
    icon: Activity,
    color: 'text-emerald-600 bg-emerald-100',
    category: 'utility',
    moduleId: 'activityfeed',
    alwaysAvailable: true,
  },
};

export function getAvailableWidgets(
  installedModuleIds: string[],
  dashboardType?: WidgetContext
): WidgetRegistryEntry[] {
  const installedSet = new Set(installedModuleIds.map((id) => id.toLowerCase()));

  return Object.values(WIDGET_REGISTRY).filter((entry) => {
    const installed = entry.alwaysAvailable || installedSet.has(entry.moduleId);
    if (!installed) return false;
    if (entry.contexts && dashboardType) {
      return entry.contexts.includes(dashboardType);
    }
    return true;
  });
}

export function getWidgetsByCategory(widgets: WidgetRegistryEntry[]): Record<WidgetCategory, WidgetRegistryEntry[]> {
  const grouped = {} as Record<WidgetCategory, WidgetRegistryEntry[]>;
  for (const cat of CATEGORY_ORDER) {
    grouped[cat] = [];
  }
  for (const w of widgets) {
    if (!grouped[w.category]) grouped[w.category] = [];
    grouped[w.category].push(w);
  }
  return grouped;
}
