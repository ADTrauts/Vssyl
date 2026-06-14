/**
 * Cross-surface navigation helpers (Wave 2C).
 * Personal Dashboard ↔ Business Workspace ↔ Place.
 */

import { buildBusinessWorkspaceModuleHref } from './businessWorkspaceNavigation';
import {
  buildPersonalDashboardHref,
  buildPersonalDashboardHubHref,
  buildPersonalModuleHref,
  buildWidgetEscalationHref,
} from './personalDashboardNavigation';

export type BusinessPlaceMode = 'publisher' | 'consumer';

/** Personal shell → business workspace (Work tab, branded dashboard). */
export function buildPersonalToBusinessHref(
  businessId: string,
  moduleId: string = 'dashboard'
): string {
  return buildBusinessWorkspaceModuleHref(businessId, moduleId);
}

/** Business workspace → personal dashboard grid. */
export function buildBusinessToPersonalHref(dashboardId?: string | null): string {
  return dashboardId ? buildPersonalDashboardHref(dashboardId) : buildPersonalDashboardHubHref();
}

/** Personal → Place consumer. */
export function buildPersonalToPlaceHref(): string {
  return '/place';
}

/** Business → Place publisher or consumer. */
export function buildBusinessToPlaceHref(
  businessId: string,
  mode: BusinessPlaceMode = 'publisher'
): string {
  if (mode === 'consumer') {
    return '/place';
  }
  return buildBusinessWorkspaceModuleHref(businessId, 'place');
}

/** Widget tile → scoped module route. */
export function buildWidgetToModuleHref(widgetType: string, dashboardId: string): string {
  return buildWidgetEscalationHref(widgetType, dashboardId);
}

/** Full module route → dashboard grid return. */
export function buildModuleToDashboardReturnHref(dashboardId: string): string {
  return buildPersonalDashboardHref(dashboardId);
}

/** Members: personal `/member` or business workspace members segment. */
export function buildMembersNavigationHref(options: {
  businessId?: string | null;
  dashboardId?: string | null;
  personal?: boolean;
}): string {
  if (options.businessId && !options.personal) {
    return buildPersonalToBusinessHref(options.businessId, 'members');
  }
  return buildPersonalModuleHref('members', options.dashboardId);
}

/** Preserve module when switching dashboard tabs from a module route. */
export function buildPersonalDashboardSwitchHref(
  dashboardId: string,
  currentModule: string | null
): string {
  if (currentModule && currentModule !== 'dashboard') {
    return buildPersonalModuleHref(currentModule, dashboardId);
  }
  return buildPersonalDashboardHref(dashboardId);
}
