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

describe('registerGlobalTrashHandlers chat', () => {
  beforeEach(() => {
    clearGlobalTrashModuleHandlersForTests();
  });

  it('registers chat module handler with conversation support', () => {
    registerGlobalTrashHandlers();

    const handler = getGlobalTrashModuleHandler('chat');
    expect(handler).toBeDefined();
    expect(handler?.moduleId).toBe('chat');
    expect(handler?.supportedTypes).toContain('conversation');
    expect(handler?.listTrashed).toBeDefined();
    expect(handler?.softTrash).toBeDefined();
  });
});
