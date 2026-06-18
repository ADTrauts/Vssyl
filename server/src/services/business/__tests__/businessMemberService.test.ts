import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../../lib/prisma';
import * as access from '../businessAccessService';
import * as activity from '../businessActivityService';
import { removeBusinessMember, updateBusinessMember } from '../businessMemberService';

describe('businessMemberService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(access, 'assertCanManage').mockResolvedValue(undefined);
    vi.spyOn(activity, 'recordBusinessMemberUpdated').mockResolvedValue(undefined);
    vi.spyOn(activity, 'recordBusinessMemberRemoved').mockResolvedValue(undefined);
  });

  it('updateBusinessMember emits member updated activity', async () => {
    vi.spyOn(prisma.businessMember, 'update').mockResolvedValue({
      id: 'member-1',
      userId: 'target-1',
    } as never);

    await updateBusinessMember({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      memberUserId: 'target-1',
      data: { role: 'MANAGER' },
    });

    expect(activity.recordBusinessMemberUpdated).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-1',
        businessId: 'biz-1',
        memberId: 'member-1',
        changedFields: ['role'],
      })
    );
  });

  it('removeBusinessMember blocks removing last admin', async () => {
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      id: 'member-1',
      role: 'ADMIN',
      userId: 'admin-1',
    } as never);
    vi.spyOn(prisma.businessMember, 'count').mockResolvedValue(1);

    await expect(
      removeBusinessMember({
        actorUserId: 'admin-1',
        businessId: 'biz-1',
        memberUserId: 'admin-1',
      })
    ).rejects.toMatchObject({ message: 'Cannot remove the last admin', httpStatus: 400 });
  });
});
