import { describe, expect, it } from 'vitest';
import {
  WORKFORCE_COMMS_ACTIVITY_ACTIONS,
  WORKFORCE_COMMS_ACTIVITY_ACTION_NAMES,
  WORKFORCE_COMMS_MODULE_ID,
} from '../workforceCommsActivityTaxonomy';

describe('workforceCommsActivityTaxonomy (Phase G)', () => {
  it('defines 18 workforce activity actions', () => {
    expect(WORKFORCE_COMMS_ACTIVITY_ACTIONS).toHaveLength(18);
    expect(WORKFORCE_COMMS_ACTIVITY_ACTION_NAMES).toHaveLength(18);
  });

  it('uses workforce_ prefix and module-scoped target types', () => {
    for (const entry of WORKFORCE_COMMS_ACTIVITY_ACTIONS) {
      expect(entry.action.startsWith('workforce_')).toBe(true);
      expect(entry.targetType.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });

  it('includes publish, ack, and bridge lifecycle actions', () => {
    expect(WORKFORCE_COMMS_ACTIVITY_ACTION_NAMES).toContain('workforce_communication_published');
    expect(WORKFORCE_COMMS_ACTIVITY_ACTION_NAMES).toContain('workforce_ack_completed');
    expect(WORKFORCE_COMMS_ACTIVITY_ACTION_NAMES).toContain('workforce_bridge_created');
    expect(WORKFORCE_COMMS_MODULE_ID).toBe('workforce_comms');
  });
});
