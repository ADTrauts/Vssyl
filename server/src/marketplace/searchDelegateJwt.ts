import { createHash, randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import {
  SEARCH_DELEGATE_JWT_AUDIENCE,
  SEARCH_DELEGATE_JWT_ISSUER,
  type SearchDelegateJwtClaims,
} from 'shared/types/search-delegate';
import type { SearchContextScope } from 'shared/types/search';

const SEARCH_DELEGATE_JWT_TTL_SECONDS = 60;

export function hashUserRef(userId: string): string {
  return createHash('sha256').update(userId).digest('hex').slice(0, 16);
}

export interface IssueSearchDelegateJwtParams {
  userId: string;
  moduleId: string;
  moduleVersionId: string;
  context?: SearchContextScope;
  requestId?: string;
}

export function issueSearchDelegateJwt(params: IssueSearchDelegateJwtParams): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured for search delegate');
  }

  const requestId = params.requestId ?? randomUUID();
  const claims: SearchDelegateJwtClaims = {
    sub: params.userId,
    aud: SEARCH_DELEGATE_JWT_AUDIENCE,
    iss: SEARCH_DELEGATE_JWT_ISSUER,
    moduleId: params.moduleId,
    moduleVersionId: params.moduleVersionId,
    requestId,
    userRef: hashUserRef(params.userId),
  };

  if (params.context?.dashboardId) {
    claims.dashboardId = params.context.dashboardId;
  }
  if (params.context?.businessId) {
    claims.businessId = params.context.businessId;
  }
  if (params.context?.householdId) {
    claims.householdId = params.context.householdId;
  }

  return jwt.sign(claims, secret, { expiresIn: SEARCH_DELEGATE_JWT_TTL_SECONDS });
}

export function verifySearchDelegateJwt(token: string): SearchDelegateJwtClaims {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  const decoded = jwt.verify(token, secret, {
    audience: SEARCH_DELEGATE_JWT_AUDIENCE,
    issuer: SEARCH_DELEGATE_JWT_ISSUER,
  });

  if (typeof decoded !== 'object' || decoded === null) {
    throw new Error('Invalid search delegate token payload');
  }

  const payload = decoded as SearchDelegateJwtClaims;
  if (!payload.moduleId || !payload.requestId || !payload.sub) {
    throw new Error('Invalid search delegate claims');
  }

  return payload;
}

export function getSearchDelegateJwtTtlSeconds(): number {
  return SEARCH_DELEGATE_JWT_TTL_SECONDS;
}
