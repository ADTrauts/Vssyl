import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CORE_MODULE_DEFINITIONS } from '../../runtime/modules/coreModuleRegistry';
import { getModuleDefinition, normalizeModuleId } from '../../runtime/modules/moduleRegistry';
import {
  BUSINESS_WORKSPACE_SWITCH_CONTRACTS,
  REGISTRY_BUSINESS_WORKSPACE_MODULE_IDS,
  businessWorkspaceMountedModuleIds,
  businessWorkspaceSwitchCaseIds,
  normalizeWorkspaceModuleId,
} from '../businessWorkspaceContracts';
import { buildBusinessWorkspaceModuleHref } from '../businessWorkspaceNavigation';

const BUSINESS_ID = 'biz-registry-test';

function registryBusinessRouteModuleIds(): string[] {
  return CORE_MODULE_DEFINITIONS.filter((m) =>
    m.routes.some((r) => r.context === 'business' && r.routeKey)
  )
    .map((m) => m.id)
    .sort();
}

describe('businessWorkspaceRegistryDrift', () => {
  it('registry business routes ⊆ mounted switch modules', () => {
    const mounted = new Set(businessWorkspaceMountedModuleIds());
    const registryRoutes = registryBusinessRouteModuleIds();
    for (const id of registryRoutes) {
      expect(mounted.has(id), `registry module ${id} missing from switch contracts`).toBe(true);
    }
  });

  it('mounted switch modules ⊆ registry business routes', () => {
    const registryRoutes = new Set(registryBusinessRouteModuleIds());
    for (const id of businessWorkspaceMountedModuleIds()) {
      expect(registryRoutes.has(id), `switch module ${id} missing registry business route`).toBe(true);
    }
  });

  it('REGISTRY_BUSINESS_WORKSPACE_MODULE_IDS matches registry business routes', () => {
    expect([...REGISTRY_BUSINESS_WORKSPACE_MODULE_IDS].sort()).toEqual(registryBusinessRouteModuleIds());
  });

  it('every switch case normalizes to a registry module', () => {
    for (const caseId of businessWorkspaceSwitchCaseIds()) {
      const canonical = normalizeWorkspaceModuleId(caseId);
      expect(REGISTRY_BUSINESS_WORKSPACE_MODULE_IDS).toContain(canonical);
      expect(getModuleDefinition(normalizeModuleId(canonical))).toBeDefined();
    }
  });

  it('every mounted contract has an entry component documented', () => {
    for (const contract of BUSINESS_WORKSPACE_SWITCH_CONTRACTS) {
      expect(contract.entryComponent.length).toBeGreaterThan(0);
      expect(contract.switchMounted).toBe(true);
    }
  });

  it('href builder covers all mounted modules without query fallback', () => {
    for (const id of businessWorkspaceMountedModuleIds()) {
      const href = buildBusinessWorkspaceModuleHref(BUSINESS_ID, id);
      expect(href).toContain(`/business/${BUSINESS_ID}/workspace`);
      if (id !== 'dashboard') {
        expect(href).not.toContain('?module=');
      }
    }
  });

  it('notes alias maps to notebook; disabled registry id is not mounted', () => {
    expect(normalizeModuleId('notes')).toBe('notebook');
    expect(businessWorkspaceMountedModuleIds()).not.toContain('notes');
    expect(businessWorkspaceSwitchCaseIds()).toContain('notes');
    const notesCore = CORE_MODULE_DEFINITIONS.find((m) => m.id === 'notes');
    expect(notesCore?.status).toBe('disabled');
  });

  it('BusinessWorkspaceContent switch covers all contract cases', () => {
    const contentPath = join(__dirname, '../../components/business/BusinessWorkspaceContent.tsx');
    const content = readFileSync(contentPath, 'utf8');
    for (const caseId of businessWorkspaceSwitchCaseIds()) {
      const escaped = caseId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(content, `missing switch case '${caseId}'`).toMatch(new RegExp(`case '${escaped}'`));
    }
  });

  it('no duplicate workspace route segments across mounted modules', () => {
    const segments = BUSINESS_WORKSPACE_SWITCH_CONTRACTS.filter((c) => c.segment).map((c) => c.segment);
    expect(new Set(segments).size).toBe(segments.length);
  });
});
