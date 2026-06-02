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

describe('registerGlobalTrashHandlers todo', () => {
  beforeEach(() => {
    clearGlobalTrashModuleHandlersForTests();
  });

  it('registers todo module handler with task support', () => {
    registerGlobalTrashHandlers();

    const handler = getGlobalTrashModuleHandler('todo');
    expect(handler).toBeDefined();
    expect(handler?.moduleId).toBe('todo');
    expect(handler?.moduleName).toBe('Todo');
    expect(handler?.supportedTypes).toContain('task');
    expect(handler?.listTrashed).toBeDefined();
    expect(handler?.softTrash).toBeDefined();
    expect(handler?.emptyModuleTrash).toBeDefined();
  });
});
