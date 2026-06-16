import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authorize } from '../policyEngine';
import { POLICY_ACTIONS } from '../policyActions';
import { prisma } from '../../lib/prisma';

describe('policyEngine scheduling + HR domains (CO-03)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('allows scheduling member read for active business member', async () => {
    vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
      role: 'EMPLOYEE',
      canManage: false,
    } as never);

    const decision = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.SCHEDULING_SCHEDULE_READ,
      resourceType: 'business',
      resourceId: 'biz-1',
      scope: { businessId: 'biz-1' },
    });

    expect(decision.allow).toBe(true);
    expect(decision.matchedPolicy).toBe('scheduling_active_member');
  });

  it('allows scheduling admin write for manager with canManage', async () => {
    vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
      role: 'MANAGER',
      canManage: true,
    } as never);

    const decision = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.SCHEDULING_SCHEDULE_PUBLISH,
      resourceType: 'schedule',
      resourceId: 'sched-1',
      scope: { businessId: 'biz-1' },
    });

    expect(decision.allow).toBe(true);
    expect(decision.matchedPolicy).toBe('scheduling_admin');
  });

  it('allows HR admin employee write for business admin', async () => {
    vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
      role: 'ADMIN',
    } as never);

    const decision = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.HR_EMPLOYEE_WRITE,
      resourceType: 'hr_employee',
      resourceId: 'emp-1',
      scope: { businessId: 'biz-1' },
    });

    expect(decision.allow).toBe(true);
    expect(decision.matchedPolicy).toBe('hr_admin');
  });

  it('allows HR manager time-off approve for direct reports manager', async () => {
    vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
      role: 'EMPLOYEE',
      canManage: false,
    } as never);
    vi.spyOn(prisma.employeePosition, 'findFirst').mockResolvedValue({
      position: { directReports: [{ id: 'pos-2' }] },
    } as never);

    const decision = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.HR_TIME_OFF_APPROVE,
      resourceType: 'time_off_request',
      resourceId: 'req-1',
      scope: { businessId: 'biz-1' },
    });

    expect(decision.allow).toBe(true);
    expect(decision.matchedPolicy).toBe('hr_direct_reports_manager');
  });
});
