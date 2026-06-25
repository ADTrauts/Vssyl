import { describe, expect, it, beforeEach } from 'vitest';
import {
  issueSearchDelegateJwt,
  verifySearchDelegateJwt,
  hashUserRef,
} from '../searchDelegateJwt';
import {
  SEARCH_DELEGATE_JWT_AUDIENCE,
  SEARCH_DELEGATE_JWT_ISSUER,
} from 'vssyl-shared/types/search-delegate';

describe('searchDelegateJwt', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-32-characters-min!!';
  });

  it('issues token with correct audience and moduleId', () => {
    const token = issueSearchDelegateJwt({
      userId: 'user-1',
      moduleId: 'vssyl-pilot-assets',
      moduleVersionId: 'ver-1',
      context: { businessId: 'biz-a' },
      requestId: 'req-1',
    });

    const claims = verifySearchDelegateJwt(token);
    expect(claims.aud).toBe(SEARCH_DELEGATE_JWT_AUDIENCE);
    expect(claims.iss).toBe(SEARCH_DELEGATE_JWT_ISSUER);
    expect(claims.moduleId).toBe('vssyl-pilot-assets');
    expect(claims.sub).toBe('user-1');
    expect(claims.businessId).toBe('biz-a');
    expect(claims.requestId).toBe('req-1');
  });

  it('pins userRef hash', () => {
    expect(hashUserRef('user-1')).toHaveLength(16);
  });

  it('rejects wrong audience', () => {
    const token = issueSearchDelegateJwt({
      userId: 'user-1',
      moduleId: 'mod',
      moduleVersionId: 'v1',
    });

    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    payload.aud = 'wrong-audience';
    const tampered = `${parts[0]}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${parts[2]}`;

    expect(() => verifySearchDelegateJwt(tampered)).toThrow();
  });
});
