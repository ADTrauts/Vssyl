import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  clearPartnerWorkspaceParticipationRegistry,
  registerPartnerWorkspaceParticipation,
  getEnabledPartnerWorkspaceParticipations,
  loadWorkspaceParticipationFromPublishedVersion,
} from '../workspaceParticipationRegistry';
import { WORKSPACE_BRIDGE_CONTRACT_VERSION } from 'vssyl-shared/types/workspace-bridge';

describe('workspaceParticipationRegistry', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    clearPartnerWorkspaceParticipationRegistry();
    process.env.PARTNER_WORKSPACE_BRIDGE_ENABLED = 'true';
    process.env.PARTNER_WORKSPACE_BRIDGE_MODULE_ALLOWLIST = 'vssyl-pilot-assets';
  });

  afterEach(() => {
    process.env = { ...envBackup };
    clearPartnerWorkspaceParticipationRegistry();
  });

  it('registers enabled workspace participation', () => {
    registerPartnerWorkspaceParticipation({
      moduleId: 'vssyl-pilot-assets',
      moduleName: 'Pilot',
      moduleVersionId: 'v1',
      semver: '1.0.0',
      supportedContexts: ['business'],
      embedMode: 'iframe',
      lifecycleEvents: ['activate'],
      registeredAt: new Date().toISOString(),
      sandboxCertified: true,
    });
    expect(getEnabledPartnerWorkspaceParticipations()).toHaveLength(1);
  });

  it('rejects invalid manifest on load', () => {
    const result = loadWorkspaceParticipationFromPublishedVersion({
      moduleId: 'bad',
      moduleName: 'Bad',
      moduleStatus: 'APPROVED',
      moduleVersionId: 'v1',
      semver: '1.0.0',
      manifestSnapshot: { capabilities: { workspace: true } },
    });
    expect(result.loaded).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('fails closed when feature flag disabled', () => {
    process.env.PARTNER_WORKSPACE_BRIDGE_ENABLED = 'false';
    registerPartnerWorkspaceParticipation({
      moduleId: 'vssyl-pilot-assets',
      moduleName: 'Pilot',
      moduleVersionId: 'v1',
      semver: '1.0.0',
      supportedContexts: ['business'],
      embedMode: 'iframe',
      lifecycleEvents: ['activate'],
      registeredAt: new Date().toISOString(),
      sandboxCertified: true,
    });
    expect(getEnabledPartnerWorkspaceParticipations()).toHaveLength(0);
  });
});
