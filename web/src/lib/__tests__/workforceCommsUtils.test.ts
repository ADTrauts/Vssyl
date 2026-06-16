import { describe, expect, it } from 'vitest';
import {
  frontPagePriorityFromWorkforce,
  isWorkforceAdmin,
  priorityLabel,
} from '../../components/workforce-comms/workforceCommsUtils';

describe('workforceCommsUtils', () => {
  it('maps workforce priority to front-page priority tokens', () => {
    expect(frontPagePriorityFromWorkforce('LOW')).toBe('low');
    expect(frontPagePriorityFromWorkforce('NORMAL')).toBe('medium');
    expect(frontPagePriorityFromWorkforce('HIGH')).toBe('high');
    expect(frontPagePriorityFromWorkforce('URGENT')).toBe('urgent');
  });

  it('labels workforce priorities for display', () => {
    expect(priorityLabel('URGENT')).toBe('Urgent');
    expect(priorityLabel('NORMAL')).toBe('Normal');
  });

  it('grants admin surfaces to ADMIN and managing MANAGER only', () => {
    expect(isWorkforceAdmin('ADMIN', false)).toBe(true);
    expect(isWorkforceAdmin('MANAGER', true)).toBe(true);
    expect(isWorkforceAdmin('MANAGER', false)).toBe(false);
    expect(isWorkforceAdmin('EMPLOYEE', false)).toBe(false);
  });
});
