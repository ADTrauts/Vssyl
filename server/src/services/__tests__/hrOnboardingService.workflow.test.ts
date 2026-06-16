import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import {
  findEmployeeOwnedOnboardingTask,
  findTeamOnboardingTaskForManager,
} from '../hrOnboardingService';

describe('hrOnboardingService task workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findEmployeeOwnedOnboardingTask', () => {
    it('scopes task lookup to employee HR profile', async () => {
      vi.spyOn(prisma.employeeOnboardingTask, 'findFirst').mockResolvedValue({
        id: 'task-1',
      } as never);

      await findEmployeeOwnedOnboardingTask('biz-1', 'task-1', 'hr-profile-1');

      expect(prisma.employeeOnboardingTask.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'task-1',
          businessId: 'biz-1',
          onboardingJourney: {
            employeeHrProfileId: 'hr-profile-1',
          },
        },
      });
    });
  });

  describe('findTeamOnboardingTaskForManager', () => {
    it('returns null when task belongs to a non-direct report', async () => {
      vi.spyOn(prisma.employeeOnboardingTask, 'findFirst').mockResolvedValue({
        id: 'task-1',
        businessId: 'biz-1',
        onboardingJourney: {
          employeeHrProfile: {
            employeePositionId: 'ep-other',
          },
        },
      } as never);

      const task = await findTeamOnboardingTaskForManager('biz-1', 'task-1', ['ep-1']);

      expect(task).toBeNull();
    });

    it('returns task when employee is a direct report', async () => {
      const mockTask = {
        id: 'task-1',
        businessId: 'biz-1',
        onboardingJourney: {
          employeeHrProfile: {
            employeePositionId: 'ep-1',
          },
        },
      };
      vi.spyOn(prisma.employeeOnboardingTask, 'findFirst').mockResolvedValue(mockTask as never);

      const task = await findTeamOnboardingTaskForManager('biz-1', 'task-1', ['ep-1']);

      expect(task).toEqual(mockTask);
    });
  });
});
