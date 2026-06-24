import { randomUUID } from 'crypto';
import type { PartnerWorkspaceParticipationRegistration } from 'shared/types/workspace-bridge';
import { WORKSPACE_BRIDGE_CONTRACT_VERSION } from 'shared/types/workspace-bridge';
import { parseWorkspaceParticipationFromManifest } from './workspaceParticipationManifest.js';
import {
  issueWorkspaceBridgeJwt,
  verifyWorkspaceBridgeJwt,
  hashWorkspaceUserRef,
} from './workspaceBridgeJwt.js';
import { isPartnerWorkspaceModuleEnabled } from './workspaceParticipationRegistry.js';

export interface WorkspaceBridgeProbeResult {
  ok: boolean;
  moduleId: string;
  hasWorkspaceCapability: boolean;
  hasWorkspaceParticipation: boolean;
  validationErrors: string[];
  registered: boolean;
  bridgeTokenIssued?: boolean;
  errorMessage?: string;
}

export async function probeWorkspaceBridge(params: {
  moduleId: string;
  manifest: Record<string, unknown>;
  registration?: PartnerWorkspaceParticipationRegistration;
  probeUserId: string;
  probeBusinessId?: string;
  issueTestToken?: boolean;
}): Promise<WorkspaceBridgeProbeResult> {
  const { participation, errors } = parseWorkspaceParticipationFromManifest(params.manifest);
  const caps = params.manifest.capabilities;
  const hasWorkspaceCapability =
    Boolean(caps && typeof caps === 'object' && (caps as Record<string, unknown>).workspace === true) ||
    (Array.isArray(params.manifest.capabilities) &&
      params.manifest.capabilities.some((c) => c === 'workspace'));

  const base: WorkspaceBridgeProbeResult = {
    ok: false,
    moduleId: params.moduleId,
    hasWorkspaceCapability,
    hasWorkspaceParticipation: Boolean(participation),
    validationErrors: errors,
    registered: Boolean(params.registration),
  };

  if (!hasWorkspaceCapability) {
    return { ...base, ok: true };
  }

  if (!participation || errors.length > 0) {
    return base;
  }

  if (!params.registration) {
    return { ...base, ok: false, errorMessage: 'Workspace participation not registered' };
  }

  if (!params.issueTestToken) {
    return { ...base, ok: true };
  }

  if (!isPartnerWorkspaceModuleEnabled(params.moduleId)) {
    return {
      ...base,
      ok: false,
      errorMessage: 'Workspace bridge disabled or module not allowlisted',
    };
  }

  try {
    const lifecycleId = randomUUID();
    const issued = issueWorkspaceBridgeJwt({
      userId: params.probeUserId,
      moduleId: params.moduleId,
      moduleVersionId: params.registration.moduleVersionId,
      lifecycleId,
      tenant: {
        scope: 'business',
        businessId: params.probeBusinessId ?? 'sandbox-business-a',
      },
    });

    verifyWorkspaceBridgeJwt(issued.token);

    return {
      ...base,
      ok: true,
      bridgeTokenIssued: true,
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return {
      ...base,
      ok: false,
      errorMessage: err.message,
    };
  }
}

export function buildWorkspaceBridgeInitPayload(params: {
  userId: string;
  moduleId: string;
  moduleName: string;
  moduleVersionId: string;
  registration: PartnerWorkspaceParticipationRegistration;
  tenant: {
    scope: 'personal' | 'business';
    dashboardId?: string;
    businessId?: string;
    householdId?: string;
  };
  theme?: { mode: 'light' | 'dark' | 'system'; primaryColor?: string; fontFamily?: string };
  capabilities?: string[];
}): {
  contractVersion: typeof WORKSPACE_BRIDGE_CONTRACT_VERSION;
  lifecycleId: string;
  issuedAt: string;
  expiresAt: string;
  context: {
    moduleId: string;
    moduleVersionId: string;
    moduleName: string;
    tenant: typeof params.tenant;
    userRef: string;
  };
  theme: { mode: 'light' | 'dark' | 'system'; primaryColor?: string; fontFamily?: string };
  capabilities: string[];
  bridgeToken: string;
} {
  const lifecycleId = randomUUID();
  const issued = issueWorkspaceBridgeJwt({
    userId: params.userId,
    moduleId: params.moduleId,
    moduleVersionId: params.moduleVersionId,
    lifecycleId,
    tenant: params.tenant,
  });

  return {
    contractVersion: WORKSPACE_BRIDGE_CONTRACT_VERSION,
    lifecycleId,
    issuedAt: new Date().toISOString(),
    expiresAt: issued.expiresAt,
    context: {
      moduleId: params.moduleId,
      moduleVersionId: params.moduleVersionId,
      moduleName: params.moduleName,
      tenant: params.tenant,
      userRef: hashWorkspaceUserRef(params.userId),
    },
    theme: params.theme ?? { mode: 'system' },
    capabilities: params.capabilities ?? ['workspace'],
    bridgeToken: issued.token,
  };
}
