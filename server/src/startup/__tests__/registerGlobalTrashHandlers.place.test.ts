import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));
import {
  clearGlobalTrashModuleHandlersForTests,
  getGlobalTrashModuleHandler,
} from '../../services/globalTrashModuleRegistry';
import { registerGlobalTrashHandlers } from '../registerGlobalTrashHandlers';

describe('registerGlobalTrashHandlers place', () => {
  beforeEach(() => {
    clearGlobalTrashModuleHandlersForTests();
  });

  it('registers place module handler with listing and meeting support', () => {
    registerGlobalTrashHandlers();

    const handler = getGlobalTrashModuleHandler('place');
    expect(handler).toBeDefined();
    expect(handler?.moduleId).toBe('place');
    expect(handler?.moduleName).toBe('Place');
    expect(handler?.supportedTypes).toEqual(expect.arrayContaining(['listing', 'meeting']));
    expect(handler?.listTrashed).toBeDefined();
    expect(handler?.softTrash).toBeDefined();
    expect(handler?.emptyModuleTrash).toBeDefined();
  });
});
