import {
  WORKSPACE_BRIDGE_CONTRACT_VERSION,
  type WorkspaceEmbedMode,
  type WorkspaceLifecycleEvent,
  type WorkspaceParticipationManifestCapability,
} from 'vssyl-shared/types/workspace-bridge';
import type { SearchTenantContext } from 'vssyl-shared/types/search';

const MODULE_ID_PATTERN = /^[a-z][a-z0-9-]{1,62}$/;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function declaresWorkspaceCapability(manifest: Record<string, unknown>): boolean {
  const caps = asRecord(manifest.capabilities);
  if (caps?.workspace === true) return true;
  if (Array.isArray(manifest.capabilities)) {
    return manifest.capabilities.some(
      (c) => typeof c === 'string' && c.toLowerCase() === 'workspace'
    );
  }
  return false;
}

const VALID_LIFECYCLE: WorkspaceLifecycleEvent[] = [
  'activate',
  'deactivate',
  'themeChange',
  'contextChange',
];

export function parseWorkspaceParticipationFromManifest(
  manifest: Record<string, unknown>
): { participation: WorkspaceParticipationManifestCapability | null; errors: string[] } {
  const errors: string[] = [];

  if (!declaresWorkspaceCapability(manifest)) {
    return { participation: null, errors: [] };
  }

  const raw = asRecord(manifest.workspaceParticipation);
  if (!raw) {
    errors.push('capabilities.workspace requires workspaceParticipation block');
    return { participation: null, errors };
  }

  if (raw.contractVersion !== WORKSPACE_BRIDGE_CONTRACT_VERSION) {
    errors.push(
      `workspaceParticipation.contractVersion must be "${WORKSPACE_BRIDGE_CONTRACT_VERSION}"`
    );
  }

  const supportedContexts = asStringArray(raw.supportedContexts).filter(
    (c): c is SearchTenantContext =>
      c === 'personal' || c === 'business' || c === 'household'
  );
  if (supportedContexts.length === 0) {
    errors.push(
      'workspaceParticipation.supportedContexts must include personal, business, and/or household'
    );
  }

  const embedMode = raw.embedMode;
  if (embedMode !== 'iframe') {
    errors.push('workspaceParticipation.embedMode must be "iframe"');
  }

  const lifecycleEvents = asStringArray(raw.lifecycleEvents).filter((e): e is WorkspaceLifecycleEvent =>
    VALID_LIFECYCLE.includes(e as WorkspaceLifecycleEvent)
  );

  if (errors.length > 0) {
    return { participation: null, errors };
  }

  return {
    participation: {
      contractVersion: WORKSPACE_BRIDGE_CONTRACT_VERSION,
      supportedContexts,
      embedMode: embedMode as WorkspaceEmbedMode,
      lifecycleEvents: lifecycleEvents.length > 0 ? lifecycleEvents : ['activate', 'deactivate'],
    },
    errors: [],
  };
}

export function isValidMarketplaceModuleIdForWorkspace(moduleId: string): boolean {
  return MODULE_ID_PATTERN.test(moduleId);
}
