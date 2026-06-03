import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  clearGlobalTrashModuleHandlersForTests,
  getGlobalTrashModuleHandler,
} from '../../services/globalTrashModuleRegistry';
import { registerGlobalTrashHandlers } from '../registerGlobalTrashHandlers';

describe('registerGlobalTrashHandlers notes', () => {
  beforeEach(() => {
    clearGlobalTrashModuleHandlersForTests();
  });

  it('registers notes module handler with note type', () => {
    registerGlobalTrashHandlers();

    const handler = getGlobalTrashModuleHandler('notes');
    expect(handler).toBeDefined();
    expect(handler?.moduleId).toBe('notes');
    expect(handler?.moduleName).toBe('Notebook Pages');
    expect(handler?.supportedTypes).toContain('note');
    expect(handler?.listTrashed).toBeDefined();
    expect(handler?.emptyModuleTrash).toBeDefined();
  });
});
