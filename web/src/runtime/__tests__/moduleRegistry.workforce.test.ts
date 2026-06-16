import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getModuleDefinition, normalizeModuleId } from '../modules/moduleRegistry';
import { MODULE_ICONS } from '../../config/moduleIcons';
import {
  BUSINESS_WORKSPACE_SWITCH_CONTRACTS,
  REGISTRY_BUSINESS_WORKSPACE_MODULE_IDS,
} from '../../lib/businessWorkspaceContracts';

describe('moduleRegistry workforce_comms (Phase F)', () => {
  it('registers workforce_comms in core module registry', () => {
    const def = getModuleDefinition('workforce_comms');
    expect(def).toBeDefined();
    expect(def?.name).toBe('Workforce Communications');
    expect(def?.capabilities).toContain('vlink');
    expect(def?.capabilities).toContain('trash');
    expect(def?.capabilities).not.toContain('realtime');
  });

  it('normalizes workforce-comms alias', () => {
    expect(normalizeModuleId('workforce-comms')).toBe('workforce_comms');
  });

  it('exposes megaphone icon and workspace contract', () => {
    expect(MODULE_ICONS.workforce_comms).toBeDefined();
    const contract = BUSINESS_WORKSPACE_SWITCH_CONTRACTS.find(
      (c) => c.moduleId === 'workforce_comms'
    );
    expect(contract?.entryComponent).toBe('WorkforceCommsLayout');
    expect(contract?.segment).toBe('workforce-comms');
    expect(REGISTRY_BUSINESS_WORKSPACE_MODULE_IDS).toContain('workforce_comms');
  });

  it('BusinessWorkspaceContent mounts workforce_comms switch case', () => {
    const contentPath = join(__dirname, '../../components/business/BusinessWorkspaceContent.tsx');
    const content = readFileSync(contentPath, 'utf8');
    expect(content).toContain("case 'workforce_comms':");
    expect(content).toContain('WorkforceCommsLayout');
  });
});
