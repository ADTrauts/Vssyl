import type { SearchTenantContext } from './search';

/** Locked contract version for workspace embed + auth bridge. */
export const WORKSPACE_BRIDGE_CONTRACT_VERSION = '1' as const;

export const WORKSPACE_BRIDGE_JWT_AUDIENCE = 'vssyl:workspace-bridge:v1' as const;

export const WORKSPACE_BRIDGE_JWT_ISSUER = 'vssyl-platform' as const;

export const SANDBOX_PILOT_WORKSPACE_MODULE_ID = 'vssyl-pilot-assets' as const;

/** postMessage type — host → module signed initialization. */
export const WORKSPACE_BRIDGE_HOST_INIT = 'vssyl:workspace:v1:host:init' as const;

export const WORKSPACE_BRIDGE_HOST_SETTINGS = 'vssyl:workspace:v1:host:settings' as const;

export const WORKSPACE_BRIDGE_HOST_LIFECYCLE = 'vssyl:workspace:v1:host:lifecycle' as const;

export const WORKSPACE_BRIDGE_MODULE_READY = 'vssyl:workspace:v1:module:ready' as const;

export const WORKSPACE_BRIDGE_MODULE_REQUEST_INIT =
  'vssyl:workspace:v1:module:request-init' as const;

export type WorkspaceEmbedMode = 'iframe';

export type WorkspaceLifecycleEvent = 'activate' | 'deactivate' | 'themeChange' | 'contextChange';

/** Manifest `workspaceParticipation` block. */
export interface WorkspaceParticipationManifestCapability {
  contractVersion: typeof WORKSPACE_BRIDGE_CONTRACT_VERSION;
  supportedContexts: SearchTenantContext[];
  embedMode: WorkspaceEmbedMode;
  lifecycleEvents?: WorkspaceLifecycleEvent[];
}

export interface WorkspaceBridgeTenantContext {
  scope: 'personal' | 'business';
  dashboardId?: string;
  businessId?: string;
  householdId?: string;
}

export interface WorkspaceBridgeThemeContext {
  mode: 'light' | 'dark' | 'system';
  primaryColor?: string;
  fontFamily?: string;
}

export interface WorkspaceBridgeInitContext {
  moduleId: string;
  moduleVersionId: string;
  moduleName: string;
  tenant: WorkspaceBridgeTenantContext;
  userRef: string;
}

/** Public init payload (no session token). */
export interface WorkspaceBridgeInitPayload {
  contractVersion: typeof WORKSPACE_BRIDGE_CONTRACT_VERSION;
  lifecycleId: string;
  issuedAt: string;
  expiresAt: string;
  context: WorkspaceBridgeInitContext;
  theme: WorkspaceBridgeThemeContext;
  capabilities: string[];
  bridgeToken: string;
}

export interface WorkspaceBridgeJwtClaims {
  sub: string;
  aud: typeof WORKSPACE_BRIDGE_JWT_AUDIENCE;
  iss: typeof WORKSPACE_BRIDGE_JWT_ISSUER;
  jti: string;
  moduleId: string;
  moduleVersionId: string;
  lifecycleId: string;
  userRef: string;
  scope: 'personal' | 'business';
  dashboardId?: string;
  businessId?: string;
  householdId?: string;
}

export interface WorkspaceBridgeHostInitMessage {
  type: typeof WORKSPACE_BRIDGE_HOST_INIT;
  payload: WorkspaceBridgeInitPayload;
}

export interface WorkspaceBridgeHostLifecycleMessage {
  type: typeof WORKSPACE_BRIDGE_HOST_LIFECYCLE;
  payload: {
    lifecycleId: string;
    event: WorkspaceLifecycleEvent;
    theme?: WorkspaceBridgeThemeContext;
    tenant?: WorkspaceBridgeTenantContext;
  };
}

export interface PartnerWorkspaceParticipationRegistration {
  moduleId: string;
  moduleName: string;
  moduleVersionId: string;
  semver: string;
  supportedContexts: SearchTenantContext[];
  embedMode: WorkspaceEmbedMode;
  lifecycleEvents: WorkspaceLifecycleEvent[];
  registeredAt: string;
  sandboxCertified: boolean;
}

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
