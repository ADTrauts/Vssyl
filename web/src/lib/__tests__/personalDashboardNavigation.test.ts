import { describe, expect, it } from 'vitest';
import {
  buildPersonalDashboardHref,
  buildPersonalDashboardHubHref,
  buildPersonalModuleHref,
  buildPersonalAIQuickHref,
  buildWidgetEscalationHref,
  isPersonalDashboardGridPath,
  isRegisteredWidgetType,
  normalizePersonalDashboardType,
  parseDashboardIdFromPath,
  personalWidgetEscalationTypes,
  resolvePersonalDashboardModule,
} from '../personalDashboardNavigation';
import {
  PERSONAL_DASHBOARD_TYPES,
  PERSONAL_MODULE_ROUTE_CONTRACTS,
  personalModuleRouteIds,
} from '../personalDashboardContracts';

const DASHBOARD_ID = 'dash-test-001';

describe('personalDashboardNavigation', () => {
  describe('buildPersonalDashboardHref', () => {
    it('builds hub and grid routes', () => {
      expect(buildPersonalDashboardHubHref()).toBe('/dashboard');
      expect(buildPersonalDashboardHref(DASHBOARD_ID)).toBe(`/dashboard/${DASHBOARD_ID}`);
    });

    it('detects grid paths', () => {
      expect(isPersonalDashboardGridPath('/dashboard')).toBe(true);
      expect(isPersonalDashboardGridPath(`/dashboard/${DASHBOARD_ID}`)).toBe(true);
      expect(isPersonalDashboardGridPath('/drive')).toBe(false);
    });

    it('parses dashboard id from path', () => {
      expect(parseDashboardIdFromPath(`/dashboard/${DASHBOARD_ID}`)).toBe(DASHBOARD_ID);
      expect(parseDashboardIdFromPath('/dashboard')).toBeNull();
    });
  });

  describe('buildPersonalModuleHref', () => {
    it('scopes module routes with dashboard query', () => {
      expect(buildPersonalModuleHref('drive', DASHBOARD_ID)).toBe(
        `/drive?dashboard=${DASHBOARD_ID}`
      );
      expect(buildPersonalModuleHref('chat', DASHBOARD_ID)).toBe(
        `/chat?dashboard=${DASHBOARD_ID}`
      );
    });

    it('uses utility paths without dashboard scope', () => {
      expect(buildPersonalModuleHref('members')).toBe('/member');
      expect(buildPersonalModuleHref('ai')).toBe('/ai-chat');
      expect(buildPersonalModuleHref('place')).toBe('/place');
      expect(buildPersonalModuleHref('notifications')).toBe('/notifications');
    });

    it('normalizes aliases', () => {
      expect(buildPersonalModuleHref('notes', DASHBOARD_ID)).toBe(
        `/notebook?dashboard=${DASHBOARD_ID}`
      );
      expect(buildPersonalModuleHref('connections')).toBe('/member');
    });

    it('produces unique hrefs per contract module', () => {
      const hrefs = personalModuleRouteIds().map((id) =>
        buildPersonalModuleHref(id, DASHBOARD_ID)
      );
      expect(new Set(hrefs).size).toBe(hrefs.length);
    });
  });

  describe('buildWidgetEscalationHref', () => {
    it('escalates registry widgets to module routes', () => {
      expect(buildWidgetEscalationHref('drive', DASHBOARD_ID)).toBe(
        `/drive?dashboard=${DASHBOARD_ID}`
      );
      expect(buildWidgetEscalationHref('ai', DASHBOARD_ID)).toBe('/ai-chat');
      expect(buildWidgetEscalationHref('notifications', DASHBOARD_ID)).toBe('/notifications');
    });

    it('covers all widget registry types', () => {
      for (const widgetType of personalWidgetEscalationTypes()) {
        const href = buildWidgetEscalationHref(widgetType, DASHBOARD_ID);
        expect(href.length).toBeGreaterThan(0);
      }
    });
  });

  describe('resolvePersonalDashboardModule', () => {
    it('resolves module paths', () => {
      expect(resolvePersonalDashboardModule(`/drive`)).toBe('drive');
      expect(resolvePersonalDashboardModule(`/dashboard/${DASHBOARD_ID}`)).toBe('dashboard');
      expect(resolvePersonalDashboardModule('/ai-chat')).toBe('ai');
      expect(resolvePersonalDashboardModule('/member')).toBe('members');
      expect(resolvePersonalDashboardModule('/notes')).toBe('notebook');
    });

    it('ignores business paths', () => {
      expect(resolvePersonalDashboardModule('/business/x/workspace')).toBeNull();
    });
  });

  describe('dashboard type validation', () => {
    it('accepts personal, household, educational', () => {
      for (const type of PERSONAL_DASHBOARD_TYPES) {
        expect(normalizePersonalDashboardType(type)).toBe(type);
      }
    });

    it('defaults unknown types to personal', () => {
      expect(normalizePersonalDashboardType('invalid')).toBe('personal');
    });
  });

  describe('widget registry alignment', () => {
    it('maps contract widget types to registry', () => {
      for (const contract of PERSONAL_MODULE_ROUTE_CONTRACTS) {
        if (!contract.widgetType) continue;
        expect(isRegisteredWidgetType(contract.widgetType)).toBe(true);
      }
    });
  });

  describe('AI quick href', () => {
    it('delegates to AI Experience navigation', () => {
      expect(buildPersonalAIQuickHref()).toBe('/ai-chat');
      expect(buildPersonalAIQuickHref({ conversationId: 'c1' })).toBe(
        '/ai-chat?conversation=c1'
      );
    });
  });
});
