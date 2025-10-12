/**
 * Widget Registry - Central registration for all Business Front Page widgets
 * 
 * This file registers all available widget types that can be used on the Business Front Page.
 * New widgets should be imported and registered here.
 */

import { WidgetRegistry } from './WidgetRegistry';

// Import all widget components
import AIAssistantWidget from './AIAssistantWidget';
import CompanyStatsWidget from './CompanyStatsWidget';
import PersonalStatsWidget from './PersonalStatsWidget';
import AnnouncementsWidget from './AnnouncementsWidget';
import QuickActionsWidget from './QuickActionsWidget';

// ============================================================================
// WIDGET REGISTRATION
// ============================================================================

/**
 * Register all available widgets
 * This function should be called once during app initialization
 */
export function registerAllWidgets() {
  // AI Assistant Widget
  WidgetRegistry.register({
    id: 'ai-assistant',
    name: 'AI Assistant',
    description: 'Interactive AI chat assistant for employees',
    icon: '🤖',
    component: AIAssistantWidget,
    defaultSettings: {
      title: 'AI Assistant',
      description: 'Ask me anything about your work',
      maxMessages: 50,
    },
  });

  // Company Statistics Widget
  WidgetRegistry.register({
    id: 'company-stats',
    name: 'Company Statistics',
    description: 'Company-wide metrics and KPIs',
    icon: '📊',
    component: CompanyStatsWidget,
    defaultSettings: {
      title: 'Company Statistics',
      refreshInterval: 300000, // 5 minutes
    },
  });

  // Personal Statistics Widget
  WidgetRegistry.register({
    id: 'personal-stats',
    name: 'Personal Statistics',
    description: 'Individual employee performance metrics',
    icon: '👤',
    component: PersonalStatsWidget,
    defaultSettings: {
      title: 'Your Statistics',
      description: 'Your personal performance metrics',
      showGoals: true,
      showPerformance: true,
    },
  });

  // Announcements Widget
  WidgetRegistry.register({
    id: 'announcements',
    name: 'Announcements',
    description: 'Company announcements and updates',
    icon: '📢',
    component: AnnouncementsWidget,
    defaultSettings: {
      title: 'Announcements',
      maxAnnouncements: 10,
      showPriority: true,
    },
  });

  // Quick Actions Widget
  WidgetRegistry.register({
    id: 'quick-actions',
    name: 'Quick Actions',
    description: 'Common action shortcuts',
    icon: '⚡',
    component: QuickActionsWidget,
    defaultSettings: {
      title: 'Quick Actions',
      description: 'Common shortcuts for daily tasks',
    },
  });

  // Recent Activity Widget (placeholder for future implementation)
  WidgetRegistry.register({
    id: 'recent-activity',
    name: 'Recent Activity',
    description: 'Latest activity feed',
    icon: '📋',
    component: () => <div>Recent Activity Widget - Coming Soon</div>,
    defaultSettings: {
      title: 'Recent Activity',
      maxItems: 20,
    },
  });

  // Upcoming Events Widget (placeholder for future implementation)
  WidgetRegistry.register({
    id: 'upcoming-events',
    name: 'Upcoming Events',
    description: 'Calendar events and reminders',
    icon: '📅',
    component: () => <div>Upcoming Events Widget - Coming Soon</div>,
    defaultSettings: {
      title: 'Upcoming Events',
      daysAhead: 7,
    },
  });

  // Team Highlights Widget (placeholder for future implementation)
  WidgetRegistry.register({
    id: 'team-highlights',
    name: 'Team Highlights',
    description: 'Team achievements and milestones',
    icon: '⭐',
    component: () => <div>Team Highlights Widget - Coming Soon</div>,
    defaultSettings: {
      title: 'Team Highlights',
      maxHighlights: 5,
    },
  });

  // Metrics Dashboard Widget (placeholder for future implementation)
  WidgetRegistry.register({
    id: 'metrics',
    name: 'Metrics Dashboard',
    description: 'Performance metrics and analytics',
    icon: '📈',
    component: () => <div>Metrics Dashboard Widget - Coming Soon</div>,
    defaultSettings: {
      title: 'Metrics Dashboard',
      chartType: 'line',
    },
  });

  // Tasks Widget (placeholder for future implementation)
  WidgetRegistry.register({
    id: 'tasks',
    name: 'Tasks',
    description: 'Task list and checklist',
    icon: '✓',
    component: () => <div>Tasks Widget - Coming Soon</div>,
    defaultSettings: {
      title: 'My Tasks',
      showCompleted: false,
    },
  });

  console.log('✅ All Business Front Page widgets registered');
}

// Auto-register widgets on import
registerAllWidgets();

// Re-export the registry for use in other components
export { WidgetRegistry, WidgetRenderer } from './WidgetRegistry';
export type { WidgetProps, WidgetRegistration } from './WidgetRegistry';

