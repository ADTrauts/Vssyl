import { describe, expect, it, beforeEach } from 'vitest';
import { probeWorkspaceBridge, buildWorkspaceBridgeInitPayload } from '../workspaceBridgeProbe';
import {
  registerPartnerWorkspaceParticipation,
  clearPartnerWorkspaceParticipationRegistry,
  getPartnerWorkspaceParticipation,
} from '../workspaceParticipationRegistry';
import {
  WORKSPACE_BRIDGE_CONTRACT_VERSION,
  SANDBOX_PILOT_WORKSPACE_MODULE_ID,
} from 'shared/types/workspace-bridge';
import { verifyWorkspaceBridgeJwt } from '../workspaceBridgeJwt';

describe('workspaceBridgeProbe', () => {
  beforeEach(() => {
    clearPartnerWorkspaceParticipationRegistry();
    process.env.PARTNER_WORKSPACE_BRIDGE_ENABLED = 'true';
    process.env.PARTNER_WORKSPACE_BRIDGE_MODULE_ALLOWLIST = SANDBOX_PILOT_WORKSPACE_MODULE_ID;
    process.env.JWT_SECRET = 'test-jwt-secret-32-characters-min!!';

    registerPartnerWorkspaceParticipation({
      moduleId: SANDBOX_PILOT_WORKSPACE_MODULE_ID,
      moduleName: 'Pilot Assets',
      moduleVersionId: 'v1',
      semver: '1.0.0',
      supportedContexts: ['business'],
      embedMode: 'iframe',
      lifecycleEvents: ['activate', 'deactivate'],
      registeredAt: new Date().toISOString(),
      sandboxCertified: true,
    });
  });

  it('validates manifest and issues test bridge token', async () => {
    const registration = getPartnerWorkspaceParticipation(SANDBOX_PILOT_WORKSPACE_MODULE_ID);
    const result = await probeWorkspaceBridge({
      moduleId: SANDBOX_PILOT_WORKSPACE_MODULE_ID,
      manifest: {
        capabilities: { workspace: true },
        workspaceParticipation: {
          contractVersion: WORKSPACE_BRIDGE_CONTRACT_VERSION,
          supportedContexts: ['business'],
          embedMode: 'iframe',
        },
      },
      registration,
      probeUserId: 'admin-1',
      probeBusinessId: 'sandbox-business-a',
      issueTestToken: true,
    });

    expect(result.ok).toBe(true);
    expect(result.bridgeTokenIssued).toBe(true);
  });

  it('pins tenant context in init payload without session token', () => {
    const registration = getPartnerWorkspaceParticipation(SANDBOX_PILOT_WORKSPACE_MODULE_ID)!;
    const initA = buildWorkspaceBridgeInitPayload({
      userId: 'user-1',
      moduleId: SANDBOX_PILOT_WORKSPACE_MODULE_ID,
      moduleName: 'Pilot Assets',
      moduleVersionId: registration.moduleVersionId,
      registration,
      tenant: { scope: 'business', businessId: 'sandbox-business-a' },
    });

    const initB = buildWorkspaceBridgeInitPayload({
      userId: 'user-1',
      moduleId: SANDBOX_PILOT_WORKSPACE_MODULE_ID,
      moduleName: 'Pilot Assets',
      moduleVersionId: registration.moduleVersionId,
      registration,
      tenant: { scope: 'business', businessId: 'sandbox-business-b' },
    });

    expect(initA.bridgeToken).not.toContain('session');
    expect(initA.context.tenant.businessId).toBe('sandbox-business-a');
    expect(initB.context.tenant.businessId).toBe('sandbox-business-b');

    const claimsA = verifyWorkspaceBridgeJwt(initA.bridgeToken);
    const claimsB = verifyWorkspaceBridgeJwt(initB.bridgeToken);
    expect(claimsA.businessId).toBe('sandbox-business-a');
    expect(claimsB.businessId).toBe('sandbox-business-b');
  });
});
