import type { WidgetContext } from '../../components/dashboard/widgetRegistry';
import type { WorkspaceContextType } from './types';

/** Legacy dashboard / widget registry context names. */
export type LegacyDashboardContext = WidgetContext;

const ALL_WORKSPACE_CONTEXTS: WorkspaceContextType[] = [
  'personal',
  'business',
  'household',
  'education',
  'admin',
];

const NON_ADMIN_CONTEXTS: WorkspaceContextType[] = [
  'personal',
  'business',
  'household',
  'education',
];

export function toLegacyWidgetContext(
  context: WorkspaceContextType
): LegacyDashboardContext | undefined {
  switch (context) {
    case 'personal':
      return 'personal';
    case 'business':
      return 'business';
    case 'household':
      return 'household';
    case 'education':
      return 'educational';
    case 'admin':
      return undefined;
    default:
      return undefined;
  }
}

export function fromLegacyDashboardType(
  legacy: LegacyDashboardContext | 'educational' | string | undefined
): WorkspaceContextType {
  switch (legacy) {
    case 'business':
      return 'business';
    case 'household':
      return 'household';
    case 'educational':
    case 'education':
      return 'education';
    case 'admin':
      return 'admin';
    case 'personal':
    default:
      return 'personal';
  }
}

export function supportsContext(
  supportedContexts: WorkspaceContextType[],
  activeContext: WorkspaceContextType
): boolean {
  return supportedContexts.includes(activeContext);
}

export function allWorkspaceContexts(): WorkspaceContextType[] {
  return [...ALL_WORKSPACE_CONTEXTS];
}

export function nonAdminWorkspaceContexts(): WorkspaceContextType[] {
  return [...NON_ADMIN_CONTEXTS];
}
