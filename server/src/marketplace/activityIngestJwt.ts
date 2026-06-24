import { createHash, randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import {
  ACTIVITY_INGEST_JWT_AUDIENCE,
  ACTIVITY_INGEST_JWT_ISSUER,
  type ActivityIngestJwtClaims,
  type ActivityIngestTenantScope,
} from 'shared/types/activity-ingest';
import { getActivityIngestJwtTtlSeconds } from './activityIngestConfig.js';

const consumedJti = new Map<string, number>();

function pruneConsumedJti(): void {
  const now = Date.now();
  for (const [jti, exp] of consumedJti) {
    if (exp <= now) {
      consumedJti.delete(jti);
    }
  }
}

export function hashActivityUserRef(userId: string): string {
  return createHash('sha256').update(userId).digest('hex').slice(0, 16);
}

export interface IssueActivityIngestJwtParams {
  userId: string;
  moduleId: string;
  moduleVersionId: string;
  scope: ActivityIngestTenantScope;
  businessId?: string;
  dashboardId?: string;
  householdId?: string;
  requestId?: string;
}

export function issueActivityIngestJwt(params: IssueActivityIngestJwtParams): {
  token: string;
  jti: string;
  requestId: string;
  expiresAt: string;
  ttlSeconds: number;
} {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured for activity ingest');
  }

  const ttlSeconds = getActivityIngestJwtTtlSeconds();
  const jti = randomUUID();
  const requestId = params.requestId ?? randomUUID();

  const claims: ActivityIngestJwtClaims = {
    sub: params.userId,
    aud: ACTIVITY_INGEST_JWT_AUDIENCE,
    iss: ACTIVITY_INGEST_JWT_ISSUER,
    jti,
    moduleId: params.moduleId,
    moduleVersionId: params.moduleVersionId,
    requestId,
    userRef: hashActivityUserRef(params.userId),
    scope: params.scope,
  };

  if (params.dashboardId) claims.dashboardId = params.dashboardId;
  if (params.businessId) claims.businessId = params.businessId;
  if (params.householdId) claims.householdId = params.householdId;

  const token = jwt.sign(claims, secret, { expiresIn: ttlSeconds });
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  return { token, jti, requestId, expiresAt, ttlSeconds };
}

export function verifyActivityIngestJwt(token: string): ActivityIngestJwtClaims {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  const decoded = jwt.verify(token, secret, {
    audience: ACTIVITY_INGEST_JWT_AUDIENCE,
    issuer: ACTIVITY_INGEST_JWT_ISSUER,
  });

  if (typeof decoded !== 'object' || decoded === null) {
    throw new Error('Invalid activity ingest token payload');
  }

  const payload = decoded as ActivityIngestJwtClaims;
  if (!payload.moduleId || !payload.jti || !payload.sub || !payload.requestId) {
    throw new Error('Invalid activity ingest claims');
  }

  pruneConsumedJti();
  if (consumedJti.has(payload.jti)) {
    throw new Error('Activity ingest token already consumed');
  }

  return payload;
}

export function consumeActivityIngestJti(jti: string, ttlMs?: number): void {
  const ttl = ttlMs ?? getActivityIngestJwtTtlSeconds() * 1000 + 30_000;
  consumedJti.set(jti, Date.now() + ttl);
}

export function resetActivityIngestJtiCache(): void {
  consumedJti.clear();
}

export function actorRefMatchesUser(userRef: string, userId: string): boolean {
  if (userRef === userId) return true;
  return userRef === hashActivityUserRef(userId);
}
