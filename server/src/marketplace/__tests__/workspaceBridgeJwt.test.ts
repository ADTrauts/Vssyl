import { describe, expect, it, beforeEach } from 'vitest';
import {
  issueWorkspaceBridgeJwt,
  verifyWorkspaceBridgeJwt,
  consumeWorkspaceBridgeJti,
  resetWorkspaceBridgeJtiCache,
  hashWorkspaceUserRef,
} from '../workspaceBridgeJwt';
import {
  WORKSPACE_BRIDGE_JWT_AUDIENCE,
  WORKSPACE_BRIDGE_JWT_ISSUER,
} from 'shared/types/workspace-bridge';

describe('workspaceBridgeJwt', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-32-characters-min!!';
    resetWorkspaceBridgeJtiCache();
  });

  it('issues token with workspace bridge audience and module pinning', () => {
    const { token } = issueWorkspaceBridgeJwt({
      userId: 'user-1',
      moduleId: 'vssyl-pilot-assets',
      moduleVersionId: 'ver-1',
      lifecycleId: 'life-1',
      tenant: { scope: 'business', businessId: 'biz-a' },
    });

    const claims = verifyWorkspaceBridgeJwt(token);
    expect(claims.aud).toBe(WORKSPACE_BRIDGE_JWT_AUDIENCE);
    expect(claims.iss).toBe(WORKSPACE_BRIDGE_JWT_ISSUER);
    expect(claims.moduleId).toBe('vssyl-pilot-assets');
    expect(claims.businessId).toBe('biz-a');
    expect(claims.lifecycleId).toBe('life-1');
  });

  it('does not expose raw user id in userRef', () => {
    expect(hashWorkspaceUserRef('user-1')).not.toBe('user-1');
    expect(hashWorkspaceUserRef('user-1')).toHaveLength(16);
  });

  it('rejects replayed jti after consume', () => {
    const { token } = issueWorkspaceBridgeJwt({
      userId: 'user-1',
      moduleId: 'mod',
      moduleVersionId: 'v1',
      lifecycleId: 'life-1',
      tenant: { scope: 'business', businessId: 'biz' },
    });

    const claims = verifyWorkspaceBridgeJwt(token);
    consumeWorkspaceBridgeJti(claims.jti);
    expect(() => verifyWorkspaceBridgeJwt(token)).toThrow(/already consumed/);
  });
});
