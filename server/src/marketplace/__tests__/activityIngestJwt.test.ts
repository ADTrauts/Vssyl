import { describe, expect, it, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  ACTIVITY_INGEST_JWT_AUDIENCE,
  ACTIVITY_INGEST_JWT_ISSUER,
} from 'vssyl-shared/types/activity-ingest';
import {
  issueActivityIngestJwt,
  verifyActivityIngestJwt,
  consumeActivityIngestJti,
  resetActivityIngestJtiCache,
  actorRefMatchesUser,
  hashActivityUserRef,
} from '../activityIngestJwt';

describe('activityIngestJwt', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-only-jwt-secret-not-for-production-use-32b';
    resetActivityIngestJtiCache();
  });

  it('issues and verifies token with correct audience', () => {
    const issued = issueActivityIngestJwt({
      userId: 'user-1',
      moduleId: 'vssyl-pilot-assets',
      moduleVersionId: 'mv-1',
      scope: 'business',
      businessId: 'biz-1',
    });

    const claims = verifyActivityIngestJwt(issued.token);
    expect(claims.aud).toBe(ACTIVITY_INGEST_JWT_AUDIENCE);
    expect(claims.iss).toBe(ACTIVITY_INGEST_JWT_ISSUER);
    expect(claims.moduleId).toBe('vssyl-pilot-assets');
    expect(claims.businessId).toBe('biz-1');
    expect(claims.sub).toBe('user-1');
  });

  it('rejects replay after jti consumed', () => {
    const issued = issueActivityIngestJwt({
      userId: 'user-1',
      moduleId: 'partner-a',
      moduleVersionId: 'mv-1',
      scope: 'business',
      businessId: 'biz-1',
    });
    const claims = verifyActivityIngestJwt(issued.token);
    consumeActivityIngestJti(claims.jti);
    expect(() => verifyActivityIngestJwt(issued.token)).toThrow(/already consumed/);
  });

  it('rejects wrong audience', () => {
    const token = jwt.sign(
      { sub: 'user-1', moduleId: 'x', jti: 'j1', requestId: 'r1' },
      process.env.JWT_SECRET!,
      { audience: 'wrong-aud', issuer: ACTIVITY_INGEST_JWT_ISSUER, expiresIn: 60 }
    );
    expect(() => verifyActivityIngestJwt(token)).toThrow();
  });

  it('matches actor ref by user id or hash', () => {
    expect(actorRefMatchesUser('user-1', 'user-1')).toBe(true);
    expect(actorRefMatchesUser(hashActivityUserRef('user-1'), 'user-1')).toBe(true);
    expect(actorRefMatchesUser('other', 'user-1')).toBe(false);
  });
});
