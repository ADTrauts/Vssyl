import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { TodoServiceError } from '../todo/todoErrors';
import * as taskDashboardBinding from '../taskDashboardBinding';
import { listProjects } from '../todoProjectService';

describe('todoProjectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('denies list when dashboard not owned', async () => {
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue(null);

    await expect(
      listProjects({ userId: 'u1', dashboardId: 'dash-x' })
    ).rejects.toBeInstanceOf(TodoServiceError);
  });

  it('lists projects on owned dashboard', async () => {
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue({
      businessId: null,
    } as never);
    vi.spyOn(taskDashboardBinding, 'assertUserOwnedDashboardBusinessAlignment').mockResolvedValue(
      undefined
    );
    vi.spyOn(prisma.taskProject, 'findMany').mockResolvedValue([{ id: 'p1', name: 'Proj' }] as never);

    const projects = await listProjects({ userId: 'u1', dashboardId: 'dash-1' });

    expect(projects).toHaveLength(1);
  });
});
