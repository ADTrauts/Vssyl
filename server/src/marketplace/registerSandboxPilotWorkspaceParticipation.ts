import {
  SANDBOX_PILOT_WORKSPACE_MODULE_ID,
  WORKSPACE_BRIDGE_CONTRACT_VERSION,
} from 'shared/types/workspace-bridge';
import { registerPartnerWorkspaceParticipation } from './workspaceParticipationRegistry.js';
import {
  isModuleAllowedForWorkspaceBridge,
  isPartnerWorkspaceBridgeEnabled,
} from './workspaceBridgeConfig.js';

const SANDBOX_PILOT_WORKSPACE_MANIFEST = {
  name: 'Vssyl Pilot Assets',
  version: '1.0.0',
  capabilities: { workspace: true, search: true },
  supportedContexts: ['business'],
  workspaceParticipation: {
    contractVersion: WORKSPACE_BRIDGE_CONTRACT_VERSION,
    supportedContexts: ['business'],
    embedMode: 'iframe',
    lifecycleEvents: ['activate', 'deactivate', 'themeChange'],
  },
};

export function registerSandboxPilotWorkspaceParticipationOnStartup(): void {
  if (!isPartnerWorkspaceBridgeEnabled()) {
    return;
  }
  if (!isModuleAllowedForWorkspaceBridge(SANDBOX_PILOT_WORKSPACE_MODULE_ID)) {
    return;
  }

  registerPartnerWorkspaceParticipation({
    moduleId: SANDBOX_PILOT_WORKSPACE_MODULE_ID,
    moduleName: 'Vssyl Pilot Assets',
    moduleVersionId: 'sandbox-pilot-v1',
    semver: '1.0.0',
    supportedContexts: ['business'],
    embedMode: 'iframe',
    lifecycleEvents: ['activate', 'deactivate', 'themeChange'],
    registeredAt: new Date().toISOString(),
    sandboxCertified: true,
  });
}

export function getSandboxPilotWorkspaceManifestSnapshot(): Record<string, unknown> {
  return { ...SANDBOX_PILOT_WORKSPACE_MANIFEST };
}
