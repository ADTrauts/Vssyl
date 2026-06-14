import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WIDGET_REGISTRY } from '../../components/dashboard/widgetRegistry';
import {
  PERSONAL_DASHBOARD_TYPES,
  PERSONAL_DEFAULT_MODULE_PERMISSIONS,
  PERSONAL_MODULE_ROUTE_CONTRACTS,
  normalizePersonalModuleId,
  personalModuleRouteIds,
} from '../personalDashboardContracts';
import {
  buildPersonalModuleHref,
  buildWidgetEscalationHref,
  isRegisteredWidgetType,
  normalizePersonalDashboardType,
  personalWidgetEscalationTypes,
} from '../personalDashboardNavigation';

const DASHBOARD_ID = 'dash-drift-test';

/** Utility registry widgets with renderer cases but no personal module-route contract. */
const UTILITY_WIDGET_TYPES_WITHOUT_MODULE_CONTRACT = [
  'quickstats',
  'quicknotes',
  'bookmarks',
  'activityfeed',
] as const;

/** Registry widgets scoped to business dashboard type only. */
const BUSINESS_CONTEXT_WIDGET_TYPES = ['hr', 'scheduling'] as const;

function widgetRendererCases(content: string): Set<string> {
  const cases = new Set<string>();
  const pattern = /case '([^']+)':/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    cases.add(match[1]);
  }
  return cases;
}

describe('personalDashboardRegistryDrift', () => {
  describe('dashboard route contracts', () => {
    it('href builder covers all contract module ids', () => {
      for (const id of personalModuleRouteIds()) {
        const href = buildPersonalModuleHref(id, DASHBOARD_ID);
        expect(href.length).toBeGreaterThan(0);
      }
    });

    it('produces unique hrefs per contract module', () => {
      const hrefs = personalModuleRouteIds().map((id) => buildPersonalModuleHref(id, DASHBOARD_ID));
      expect(new Set(hrefs).size).toBe(hrefs.length);
    });

    it('no duplicate path segments across contracts', () => {
      const segments = PERSONAL_MODULE_ROUTE_CONTRACTS.map((c) => c.pathSegment);
      expect(new Set(segments).size).toBe(segments.length);
    });

    it('aliases normalize to canonical module ids', () => {
      expect(normalizePersonalModuleId('notes')).toBe('notebook');
      expect(normalizePersonalModuleId('connections')).toBe('members');
    });

    it('default module permissions align with contract module routes', () => {
      const contractIds = new Set(personalModuleRouteIds());
      for (const entry of PERSONAL_DEFAULT_MODULE_PERMISSIONS) {
        if (entry.id === 'dashboard') continue;
        expect(
          contractIds.has(entry.id),
          `default permission module ${entry.id} missing from contracts`
        ).toBe(true);
      }
    });
  });

  describe('widget contract coverage', () => {
    it('contract widget types exist in WIDGET_REGISTRY', () => {
      for (const contract of PERSONAL_MODULE_ROUTE_CONTRACTS) {
        if (!contract.widgetType) continue;
        expect(isRegisteredWidgetType(contract.widgetType)).toBe(true);
        const entry = WIDGET_REGISTRY[contract.widgetType];
        expect(entry, `registry missing widget ${contract.widgetType}`).toBeDefined();
        expect(normalizePersonalModuleId(entry.moduleId)).toBe(contract.moduleId);
      }
    });

    it('registry module-route widgets have personal contracts', () => {
      for (const entry of Object.values(WIDGET_REGISTRY)) {
        if (UTILITY_WIDGET_TYPES_WITHOUT_MODULE_CONTRACT.includes(entry.id as typeof UTILITY_WIDGET_TYPES_WITHOUT_MODULE_CONTRACT[number])) {
          continue;
        }
        if (BUSINESS_CONTEXT_WIDGET_TYPES.includes(entry.id as typeof BUSINESS_CONTEXT_WIDGET_TYPES[number])) {
          continue;
        }
        const contract = PERSONAL_MODULE_ROUTE_CONTRACTS.find(
          (c) => c.moduleId === normalizePersonalModuleId(entry.moduleId) || c.widgetType === entry.id
        );
        expect(contract, `registry widget ${entry.id} missing personal contract`).toBeDefined();
      }
    });
  });

  describe('widget renderer coverage', () => {
    it('WidgetContentRenderer covers all WIDGET_REGISTRY types', () => {
      const rendererPath = join(__dirname, '../../app/dashboard/DashboardClient.tsx');
      const content = readFileSync(rendererPath, 'utf8');
      const cases = widgetRendererCases(content);

      for (const widgetType of Object.keys(WIDGET_REGISTRY)) {
        const hasCase =
          cases.has(widgetType) || (widgetType === 'notebook' && cases.has('notes'));
        expect(hasCase, `missing renderer case for widget type '${widgetType}'`).toBe(true);
      }
    });

    it('registry guard uses isRegisteredWidgetType before render switch', () => {
      const rendererPath = join(__dirname, '../../app/dashboard/DashboardClient.tsx');
      const content = readFileSync(rendererPath, 'utf8');
      expect(content).toContain('isRegisteredWidgetType');
    });
  });

  describe('navigation contract coverage', () => {
    it('DashboardContext uses personal navigation helpers', () => {
      const ctxPath = join(__dirname, '../../contexts/DashboardContext.tsx');
      const content = readFileSync(ctxPath, 'utf8');
      expect(content).toContain('buildPersonalModuleHref');
      expect(content).toContain('buildPersonalDashboardSwitchHref');
      expect(content).toContain('resolvePersonalDashboardModule');
      expect(content).toContain('buildMembersNavigationHref');
    });

    it('DashboardLayoutInner uses personal navigation helpers', () => {
      const innerPath = join(__dirname, '../../app/dashboard/DashboardLayoutInner.tsx');
      const content = readFileSync(innerPath, 'utf8');
      expect(content).toContain('resolvePersonalDashboardModule');
      expect(content).toContain('buildPersonalAIQuickHref');
      expect(content).toContain('buildPersonalToBusinessHref');
    });
  });

  describe('dashboard type coverage', () => {
    it('PERSONAL_DASHBOARD_TYPES accepted by normalizePersonalDashboardType', () => {
      for (const type of PERSONAL_DASHBOARD_TYPES) {
        expect(normalizePersonalDashboardType(type)).toBe(type);
      }
    });

    it('unknown dashboard types default to personal', () => {
      expect(normalizePersonalDashboardType('invalid')).toBe('personal');
    });
  });

  describe('escalation route coverage', () => {
    it('escalation href covers all widget registry types', () => {
      expect(personalWidgetEscalationTypes().sort()).toEqual(Object.keys(WIDGET_REGISTRY).sort());
      for (const widgetType of personalWidgetEscalationTypes()) {
        const href = buildWidgetEscalationHref(widgetType, DASHBOARD_ID);
        expect(href.length).toBeGreaterThan(0);
      }
    });

    it('escalation matches module href for contracted widgets', () => {
      for (const contract of PERSONAL_MODULE_ROUTE_CONTRACTS) {
        if (!contract.widgetType) continue;
        expect(buildWidgetEscalationHref(contract.widgetType, DASHBOARD_ID)).toBe(
          buildPersonalModuleHref(contract.moduleId, DASHBOARD_ID)
        );
      }
    });
  });
});
