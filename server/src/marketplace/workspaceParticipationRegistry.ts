import type { PartnerWorkspaceParticipationRegistration } from 'vssyl-shared/types/workspace-bridge';
import { logger } from '../lib/logger.js';
import {
  isModuleAllowedForWorkspaceBridge,
  isPartnerWorkspaceBridgeEnabled,
} from './workspaceBridgeConfig.js';
import {
  isValidMarketplaceModuleIdForWorkspace,
  parseWorkspaceParticipationFromManifest,
} from './workspaceParticipationManifest.js';

const participationIndex = new Map<string, PartnerWorkspaceParticipationRegistration>();

export function clearPartnerWorkspaceParticipationRegistry(): void {
  participationIndex.clear();
}

export function registerPartnerWorkspaceParticipation(
  registration: PartnerWorkspaceParticipationRegistration
): void {
  if (!isValidMarketplaceModuleIdForWorkspace(registration.moduleId)) {
    throw new Error(`Invalid moduleId for workspace participation: ${registration.moduleId}`);
  }
  participationIndex.set(registration.moduleId, registration);
}

export function unregisterPartnerWorkspaceParticipation(moduleId: string): void {
  participationIndex.delete(moduleId);
}

export function getPartnerWorkspaceParticipation(
  moduleId: string
): PartnerWorkspaceParticipationRegistration | undefined {
  return participationIndex.get(moduleId);
}

export function listPartnerWorkspaceParticipations(): PartnerWorkspaceParticipationRegistration[] {
  return [...participationIndex.values()];
}

export function getEnabledPartnerWorkspaceParticipations(): PartnerWorkspaceParticipationRegistration[] {
  if (!isPartnerWorkspaceBridgeEnabled()) {
    return [];
  }
  return listPartnerWorkspaceParticipations().filter((r) =>
    isModuleAllowedForWorkspaceBridge(r.moduleId)
  );
}

export function isPartnerWorkspaceModuleEnabled(moduleId: string): boolean {
  return getEnabledPartnerWorkspaceParticipations().some((r) => r.moduleId === moduleId);
}

export interface LoadWorkspaceParticipationParams {
  moduleId: string;
  moduleName: string;
  moduleStatus: string;
  manifestSnapshot: Record<string, unknown>;
  moduleVersionId: string;
  semver: string;
  sandboxCertified?: boolean;
}

export function loadWorkspaceParticipationFromPublishedVersion(
  params: LoadWorkspaceParticipationParams
): { loaded: boolean; errors: string[] } {
  if (params.moduleStatus !== 'APPROVED') {
    unregisterPartnerWorkspaceParticipation(params.moduleId);
    return { loaded: false, errors: ['module_not_approved'] };
  }

  const { participation, errors } = parseWorkspaceParticipationFromManifest(params.manifestSnapshot);
  if (!participation) {
    unregisterPartnerWorkspaceParticipation(params.moduleId);
    if (errors.length === 0) {
      return { loaded: false, errors: [] };
    }
    return { loaded: false, errors };
  }

  if (errors.length > 0) {
    unregisterPartnerWorkspaceParticipation(params.moduleId);
    return { loaded: false, errors };
  }

  registerPartnerWorkspaceParticipation({
    moduleId: params.moduleId,
    moduleName: params.moduleName,
    moduleVersionId: params.moduleVersionId,
    semver: params.semver,
    supportedContexts: participation.supportedContexts,
    embedMode: participation.embedMode,
    lifecycleEvents: participation.lifecycleEvents ?? ['activate', 'deactivate'],
    registeredAt: new Date().toISOString(),
    sandboxCertified: params.sandboxCertified ?? false,
  });

  void logger.info('Partner workspace participation registered', {
    operation: 'partner_workspace_participation_register',
    moduleId: params.moduleId,
    moduleVersionId: params.moduleVersionId,
  });

  return { loaded: true, errors: [] };
}

export function syncPartnerWorkspaceParticipationForModule(params: {
  moduleId: string;
  moduleName: string;
  moduleStatus: string;
  manifest: Record<string, unknown>;
  publishedVersion?: {
    id: string;
    version: string;
    manifestSnapshot: Record<string, unknown>;
    scanPassed: boolean;
    certificationAllowsWorkspace: boolean;
  } | null;
}): void {
  if (!params.publishedVersion) {
    unregisterPartnerWorkspaceParticipation(params.moduleId);
    return;
  }

  if (!params.publishedVersion.scanPassed) {
    unregisterPartnerWorkspaceParticipation(params.moduleId);
    return;
  }

  if (!params.publishedVersion.certificationAllowsWorkspace) {
    unregisterPartnerWorkspaceParticipation(params.moduleId);
    return;
  }

  const manifest =
    params.publishedVersion.manifestSnapshot &&
    typeof params.publishedVersion.manifestSnapshot === 'object'
      ? (params.publishedVersion.manifestSnapshot as Record<string, unknown>)
      : params.manifest;

  loadWorkspaceParticipationFromPublishedVersion({
    moduleId: params.moduleId,
    moduleName: params.moduleName,
    moduleStatus: params.moduleStatus,
    manifestSnapshot: manifest,
    moduleVersionId: params.publishedVersion.id,
    semver: params.publishedVersion.version,
    sandboxCertified: true,
  });
}
