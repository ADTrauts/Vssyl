import { createHash, randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import {
  WORKSPACE_BRIDGE_JWT_AUDIENCE,
  WORKSPACE_BRIDGE_JWT_ISSUER,
  type WorkspaceBridgeJwtClaims,
  type WorkspaceBridgeTenantContext,
} from 'shared/types/workspace-bridge';
import { getWorkspaceBridgeJwtTtlSeconds } from './workspaceBridgeConfig.js';

const consumedJti = new Map<string, number>();

function pruneConsumedJti(): void {
  const now = Date.now();
  for (const [jti, exp] of consumedJti) {
    if (exp <= now) {
      consumedJti.delete(jti);
    }
  }
}

export function hashWorkspaceUserRef(userId: string): string {
  return createHash('sha256').update(userId).digest('hex').slice(0, 16);
}

export interface IssueWorkspaceBridgeJwtParams {
  userId: string;
  moduleId: string;
  moduleVersionId: string;
  lifecycleId: string;
  tenant: WorkspaceBridgeTenantContext;
}

export function issueWorkspaceBridgeJwt(params: IssueWorkspaceBridgeJwtParams): {
  token: string;
  jti: string;
  expiresAt: string;
  ttlSeconds: number;
} {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured for workspace bridge');
  }

  const ttlSeconds = getWorkspaceBridgeJwtTtlSeconds();
  const jti = randomUUID();
  const claims: WorkspaceBridgeJwtClaims = {
    sub: params.userId,
    aud: WORKSPACE_BRIDGE_JWT_AUDIENCE,
    iss: WORKSPACE_BRIDGE_JWT_ISSUER,
    jti,
    moduleId: params.moduleId,
    moduleVersionId: params.moduleVersionId,
    lifecycleId: params.lifecycleId,
    userRef: hashWorkspaceUserRef(params.userId),
    scope: params.tenant.scope,
  };

  if (params.tenant.dashboardId) {
    claims.dashboardId = params.tenant.dashboardId;
  }
  if (params.tenant.businessId) {
    claims.businessId = params.tenant.businessId;
  }
  if (params.tenant.householdId) {
    claims.householdId = params.tenant.householdId;
  }

  const token = jwt.sign(claims, secret, { expiresIn: ttlSeconds });
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  return { token, jti, expiresAt, ttlSeconds };
}

export function verifyWorkspaceBridgeJwt(token: string): WorkspaceBridgeJwtClaims {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  const decoded = jwt.verify(token, secret, {
    audience: WORKSPACE_BRIDGE_JWT_AUDIENCE,
    issuer: WORKSPACE_BRIDGE_JWT_ISSUER,
  });

  if (typeof decoded !== 'object' || decoded === null) {
    throw new Error('Invalid workspace bridge token payload');
  }

  const payload = decoded as WorkspaceBridgeJwtClaims;
  if (!payload.moduleId || !payload.jti || !payload.lifecycleId || !payload.sub) {
    throw new Error('Invalid workspace bridge claims');
  }

  pruneConsumedJti();
  if (consumedJti.has(payload.jti)) {
    throw new Error('Workspace bridge token already consumed');
  }

  return payload;
}

/** Mark jti consumed after successful partner introspection (replay protection). */
export function consumeWorkspaceBridgeJti(jti: string, ttlMs = 180_000): void {
  consumedJti.set(jti, Date.now() + ttlMs);
}

export function resetWorkspaceBridgeJtiCache(): void {
  consumedJti.clear();
}
