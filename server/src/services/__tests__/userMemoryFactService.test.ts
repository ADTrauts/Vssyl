import { describe, it, expect } from 'vitest';
import { buildUserMemoryFactListWhere } from '../userMemoryFactService';

describe('buildUserMemoryFactListWhere', () => {
  const userId = 'user_test';

  it('defaults to personal scope only when no filter', () => {
    const where = buildUserMemoryFactListWhere(userId);
    expect(where.userId).toBe(userId);
    expect(where.trashedAt).toBeNull();
    const andClauses = where.AND as Array<Record<string, unknown>>;
    expect(andClauses).toBeDefined();
    expect(andClauses.some((c) => c.scope === 'personal')).toBe(true);
  });

  it('includes personal and matching business facts when businessId set', () => {
    const where = buildUserMemoryFactListWhere(userId, { businessId: 'biz_a' });
    const andClauses = where.AND as Array<{ OR?: Array<Record<string, unknown>> }>;
    const scopeOr = andClauses.find(
      (c) => c.OR?.some((o) => o.scope === 'personal') && c.OR?.some((o) => o.scope === 'business')
    )?.OR;
    expect(scopeOr).toEqual([
      { scope: 'personal' },
      { scope: 'business', businessId: 'biz_a' },
    ]);
  });

  it('honors explicit scope filter in personal context', () => {
    const where = buildUserMemoryFactListWhere(userId, { scope: 'personal' });
    const andClauses = where.AND as Array<Record<string, unknown>>;
    expect(andClauses.some((c) => c.scope === 'personal')).toBe(true);
  });

  it('excludes expired facts via expiry OR clause', () => {
    const where = buildUserMemoryFactListWhere(userId);
    const andClauses = where.AND as Array<{ OR?: Array<Record<string, unknown>> }>;
    const expiryClause = andClauses.find(
      (c) =>
        c.OR?.some((o) => 'expiresAt' in o && o.expiresAt === null) &&
        c.OR?.some((o) => typeof o.expiresAt === 'object')
    );
    expect(expiryClause).toBeDefined();
  });

  it('filters by category and sourceType', () => {
    const where = buildUserMemoryFactListWhere(userId, {
      category: 'preference',
      sourceType: 'remember_that',
    });
    const andClauses = where.AND as Array<Record<string, unknown>>;
    expect(andClauses.some((c) => c.category === 'preference')).toBe(true);
    expect(andClauses.some((c) => c.sourceType === 'remember_that')).toBe(true);
  });
});
