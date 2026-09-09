import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/apiUtils', () => ({
  authenticatedApiCall: vi.fn(),
}));

import { authenticatedApiCall } from '@/lib/apiUtils';
import {
  assignEmployeeToPosition,
  removeEmployeeFromPosition,
  transferEmployee,
  updatePosition,
  deletePosition,
  isSyntheticEmployeeRowId,
  isPlacedEmployeeAssignment,
  countActiveOccupants,
  assertRemovablePlacement,
} from '../../api/orgChart';

const mockedApi = vi.mocked(authenticatedApiCall);

describe('orgChart API contracts', () => {
  beforeEach(() => {
    mockedApi.mockReset();
  });

  it('assignEmployeeToPosition sends canonical startDate', async () => {
    mockedApi.mockResolvedValueOnce({ id: 'ep-1', active: true, startDate: '2026-01-01' });
    await assignEmployeeToPosition(
      {
        businessId: 'b1',
        userId: 'u1',
        positionId: 'p1',
        assignedById: 'admin',
        startDate: '2026-01-15',
      },
      'token'
    );
    expect(mockedApi).toHaveBeenCalledWith(
      '/api/org-chart/employees/assign',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          businessId: 'b1',
          userId: 'u1',
          positionId: 'p1',
          assignedById: 'admin',
          startDate: '2026-01-15',
        }),
      }),
      'token'
    );
  });

  it('assignEmployeeToPosition rejects synthetic ids', async () => {
    await expect(
      assignEmployeeToPosition(
        {
          businessId: 'b1',
          userId: 'member-u1',
          positionId: 'p1',
          assignedById: 'admin',
          startDate: '2026-01-15',
        },
        'token'
      )
    ).rejects.toThrow(/synthetic/);
    expect(mockedApi).not.toHaveBeenCalled();
  });

  it('removeEmployeeFromPosition uses DELETE with query params', async () => {
    mockedApi.mockResolvedValueOnce(undefined);
    await removeEmployeeFromPosition('u1', 'p1', 'b1', 'token', 'ep-1');
    expect(mockedApi).toHaveBeenCalledWith(
      '/api/org-chart/employees/remove?userId=u1&positionId=p1&businessId=b1',
      expect.objectContaining({ method: 'DELETE' }),
      'token'
    );
  });

  it('removeEmployeeFromPosition rejects synthetic rows', async () => {
    await expect(
      removeEmployeeFromPosition('u1', 'p1', 'b1', 'token', 'member-u1')
    ).rejects.toThrow(/synthetic|unplaced/);
    expect(mockedApi).not.toHaveBeenCalled();
  });

  it('transferEmployee sends effectiveDate for server route contract', async () => {
    mockedApi.mockResolvedValueOnce({ id: 'ep-2' });
    await transferEmployee('u1', 'p1', 'p2', 'b1', 'admin', 'token', '2026-02-01');
    expect(mockedApi).toHaveBeenCalledWith(
      '/api/org-chart/employees/transfer',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"effectiveDate":"2026-02-01"'),
      }),
      'token'
    );
  });

  it('updatePosition sends canonical title and maxOccupants', async () => {
    mockedApi.mockResolvedValueOnce({ id: 'p1', title: 'Lead', maxOccupants: 3 });
    await updatePosition('p1', { title: 'Lead', maxOccupants: 3, tierId: 't1' }, 'token');
    expect(mockedApi).toHaveBeenCalledWith(
      '/api/org-chart/positions/p1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ title: 'Lead', maxOccupants: 3, tierId: 't1' }),
      }),
      'token'
    );
  });

  it('updatePosition supports reportsToId for visual hierarchy', async () => {
    mockedApi.mockResolvedValueOnce({ id: 'p1' });
    await updatePosition('p1', { reportsToId: 'manager-pos' }, 'token');
    expect(mockedApi).toHaveBeenCalledWith(
      '/api/org-chart/positions/p1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ reportsToId: 'manager-pos' }),
      }),
      'token'
    );
  });

  it('deletePosition treats undefined 204 response as success', async () => {
    mockedApi.mockResolvedValueOnce(undefined);
    const result = await deletePosition('p1', 'token');
    expect(result).toEqual({ success: true });
    expect(mockedApi).toHaveBeenCalledWith(
      '/api/org-chart/positions/p1',
      expect.objectContaining({ method: 'DELETE' }),
      'token'
    );
  });
});

describe('orgChart occupancy helpers', () => {
  it('detects synthetic member rows', () => {
    expect(isSyntheticEmployeeRowId('member-abc')).toBe(true);
    expect(isSyntheticEmployeeRowId('ep-1')).toBe(false);
  });

  it('identifies placed assignments', () => {
    expect(
      isPlacedEmployeeAssignment({ id: 'ep-1', positionId: 'p1', active: true })
    ).toBe(true);
    expect(
      isPlacedEmployeeAssignment({ id: 'member-u', positionId: null, active: true })
    ).toBe(false);
    expect(
      isPlacedEmployeeAssignment({ id: 'ep-2', positionId: 'p1', active: false })
    ).toBe(false);
  });

  it('counts active occupants from nested or list data', () => {
    expect(
      countActiveOccupants('p1', [], [
        { active: true },
        { active: false },
        { active: true },
      ])
    ).toBe(2);
    expect(
      countActiveOccupants('p1', [
        { id: 'ep-1', positionId: 'p1', active: true },
        { id: 'member-x', positionId: null, active: true },
        { id: 'ep-2', positionId: 'p1', active: false },
      ])
    ).toBe(1);
  });

  it('assertRemovablePlacement rejects null positionId', () => {
    expect(() => assertRemovablePlacement('u1', null)).toThrow();
  });
});
