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

describe('registerGlobalTrashHandlers scheduling-hr', () => {
  beforeEach(() => {
    clearGlobalTrashModuleHandlersForTests();
  });

  it('registers scheduling module handler with schedule/shift/template support', () => {
    registerGlobalTrashHandlers();

    const handler = getGlobalTrashModuleHandler('scheduling');
    expect(handler).toBeDefined();
    expect(handler?.moduleId).toBe('scheduling');
    expect(handler?.moduleName).toBe('Scheduling');
    expect(handler?.supportedTypes).toEqual(
      expect.arrayContaining(['schedule', 'shift', 'schedule_template'])
    );
    expect(handler?.listTrashed).toBeDefined();
    expect(handler?.softTrash).toBeDefined();
    expect(handler?.emptyModuleTrash).toBeDefined();
  });

  it('registers hr module handler with employee_profile support', () => {
    registerGlobalTrashHandlers();

    const handler = getGlobalTrashModuleHandler('hr');
    expect(handler).toBeDefined();
    expect(handler?.moduleId).toBe('hr');
    expect(handler?.moduleName).toBe('HR');
    expect(handler?.supportedTypes).toContain('employee_profile');
    expect(handler?.listTrashed).toBeDefined();
    expect(handler?.softTrash).toBeDefined();
    expect(handler?.emptyModuleTrash).toBeDefined();
  });
});
