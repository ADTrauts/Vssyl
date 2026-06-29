import { describe, expect, it } from 'vitest';
import {
  assertModuleApiScope,
  ModuleManagerContextError,
  resolveModuleManagerContext,
} from '../moduleManagerContext';

describe('moduleManagerContext', () => {
  it('resolves personal context from /modules', () => {
    expect(resolveModuleManagerContext({ pathname: '/modules' })).toEqual({
      scope: 'personal',
    });
  });

  it('resolves business context from business route', () => {
    expect(
      resolveModuleManagerContext({
        pathname: '/business/biz-123/modules',
        businessIdFromRoute: 'biz-123',
      })
    ).toEqual({
      scope: 'business',
      businessId: 'biz-123',
    });
  });

  it('rejects business API scope without businessId', () => {
    expect(() => assertModuleApiScope({ scope: 'business' })).toThrow(ModuleManagerContextError);
  });

  it('allows personal API scope without businessId', () => {
    expect(assertModuleApiScope({ scope: 'personal' })).toEqual({ scope: 'personal' });
  });
});
