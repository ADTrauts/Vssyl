import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../hrEmployeeService', () => ({
  getOwnHrData: vi.fn(),
}));

vi.mock('../hrServiceShared', async () => {
  const actual = await vi.importActual<typeof import('../hrServiceShared')>('../hrServiceShared');
  return {
    ...actual,
    resolveManagerOccupancyForEmployeePosition: vi.fn(),
  };
});

import { getOwnHrData } from '../hrEmployeeService';
import { resolveManagerOccupancyForEmployeePosition } from '../hrServiceShared';
import { buildHrSelfEmploymentContext } from '../hrAiContextService';

const getOwnHrDataMock = vi.mocked(getOwnHrData);
const resolveManagerMock = vi.mocked(resolveManagerOccupancyForEmployeePosition);

describe('buildHrSelfEmploymentContext (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns compact employment facts when manager is assigned', async () => {
    getOwnHrDataMock.mockResolvedValue({
      employee: {
        id: 'ep-1',
        position: {
          title: 'Dietary Supervisor',
          department: { name: 'Dietary' },
        },
      },
      message: undefined,
    } as Awaited<ReturnType<typeof getOwnHrData>>);
    resolveManagerMock.mockResolvedValue({
      status: 'assigned',
      user: {
        userId: 'mgr-1',
        name: 'AI Truth Manager',
        email: 'ai.truth.manager@vssyl.local',
      },
    });

    const payload = await buildHrSelfEmploymentContext('biz-1', 'user-1');

    expect(payload.context).toEqual({
      employmentAvailable: true,
      positionTitle: 'Dietary Supervisor',
      department: 'Dietary',
      managerName: 'AI Truth Manager',
      managerEmail: 'ai.truth.manager@vssyl.local',
      managerStatus: 'assigned',
    });
    expect(payload.metadata.endpoint).toBe('selfEmployment');
    expect(payload.metadata.source).toMatch(/Position reporting relationship/);
    expect(JSON.stringify(payload.context)).not.toMatch(/employeePosition|payroll|password/i);
  });

  it('returns unavailable employment when no active position', async () => {
    getOwnHrDataMock.mockResolvedValue({
      employee: {
        id: 'member-1',
        stub: true,
        position: null,
      },
      message: 'No active employee position found; returning fallback data.',
    } as Awaited<ReturnType<typeof getOwnHrData>>);

    const payload = await buildHrSelfEmploymentContext('biz-1', 'user-1');

    expect(payload.context.employmentAvailable).toBe(false);
    expect(payload.context.positionTitle).toBeNull();
    expect(payload.context.department).toBeNull();
    expect(payload.context.managerName).toBeNull();
    expect(payload.context.managerEmail).toBeNull();
    expect(payload.context.managerStatus).toBe('no_position');
    expect(resolveManagerMock).not.toHaveBeenCalled();
  });

  it('keeps title/department when manager position has no active occupant', async () => {
    getOwnHrDataMock.mockResolvedValue({
      employee: {
        id: 'ep-1',
        position: {
          title: 'Dietary Supervisor',
          department: { name: 'Dietary' },
        },
      },
      message: undefined,
    } as Awaited<ReturnType<typeof getOwnHrData>>);
    resolveManagerMock.mockResolvedValue({ status: 'no_active_occupant' });

    const payload = await buildHrSelfEmploymentContext('biz-1', 'user-1');

    expect(payload.context.employmentAvailable).toBe(true);
    expect(payload.context.positionTitle).toBe('Dietary Supervisor');
    expect(payload.context.department).toBe('Dietary');
    expect(payload.context.managerName).toBeNull();
    expect(payload.context.managerEmail).toBeNull();
    expect(payload.context.managerStatus).toBe('no_active_occupant');
  });

  it('marks manager absent when position has no reportsTo', async () => {
    getOwnHrDataMock.mockResolvedValue({
      employee: {
        id: 'ep-1',
        position: {
          title: 'Dietary Supervisor',
          department: { name: 'Dietary' },
        },
      },
      message: undefined,
    } as Awaited<ReturnType<typeof getOwnHrData>>);
    resolveManagerMock.mockResolvedValue({ status: 'no_reports_to' });

    const payload = await buildHrSelfEmploymentContext('biz-1', 'user-1');

    expect(payload.context.managerStatus).toBe('no_reports_to');
    expect(payload.context.managerName).toBeNull();
  });
});
