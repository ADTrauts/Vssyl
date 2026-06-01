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

describe('registerGlobalTrashHandlers calendar', () => {
  beforeEach(() => {
    clearGlobalTrashModuleHandlersForTests();
  });

  it('registers calendar module handler with event support', () => {
    registerGlobalTrashHandlers();

    const handler = getGlobalTrashModuleHandler('calendar');
    expect(handler).toBeDefined();
    expect(handler?.moduleId).toBe('calendar');
    expect(handler?.moduleName).toBe('Calendar');
    expect(handler?.supportedTypes).toContain('event');
    expect(handler?.listTrashed).toBeDefined();
    expect(handler?.softTrash).toBeDefined();
    expect(handler?.emptyModuleTrash).toBeDefined();
  });
});
