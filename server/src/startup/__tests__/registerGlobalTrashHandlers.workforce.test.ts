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

describe('registerGlobalTrashHandlers workforce_comms', () => {
  beforeEach(() => {
    clearGlobalTrashModuleHandlersForTests();
  });

  it('registers workforce_comms module handler with communication/campaign support', () => {
    registerGlobalTrashHandlers();

    const handler = getGlobalTrashModuleHandler('workforce_comms');
    expect(handler).toBeDefined();
    expect(handler?.moduleId).toBe('workforce_comms');
    expect(handler?.moduleName).toBe('Workforce Communications');
    expect(handler?.supportedTypes).toEqual(
      expect.arrayContaining(['communication', 'campaign'])
    );
    expect(handler?.listTrashed).toBeDefined();
    expect(handler?.softTrash).toBeDefined();
    expect(handler?.restore).toBeDefined();
    expect(handler?.permanentDelete).toBeDefined();
    expect(handler?.emptyModuleTrash).toBeDefined();
  });
});
