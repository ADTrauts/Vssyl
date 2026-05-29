import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executeTool } from '../toolExecutor';
import * as driveShare from '../../../services/driveFileShareService';
import { prisma } from '../../../lib/prisma';

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    file: { findFirst: vi.fn() },
    filePermission: { upsert: vi.fn() },
  },
}));

describe('toolExecutor share_file', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses canonical grantFileSharePermission instead of direct Prisma upsert', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'target-1', email: 'a@b.com' } as never);
    const grantSpy = vi.spyOn(driveShare, 'grantFileSharePermission').mockResolvedValue({
      permission: { id: 'perm-1' },
      file: { id: 'file-1', name: 'Report.pdf' },
    } as never);

    const result = await executeTool(
      'share_file',
      { fileId: 'file-1', targetUserEmail: 'a@b.com', canWrite: false },
      { userId: 'owner-1' }
    );

    expect(grantSpy).toHaveBeenCalledWith({
      ownerUserId: 'owner-1',
      fileId: 'file-1',
      targetUserId: 'target-1',
      canRead: true,
      canWrite: false,
    });
    expect(prisma.filePermission.upsert).not.toHaveBeenCalled();
    expect(JSON.parse(result)).toEqual(
      expect.objectContaining({ success: true, message: expect.stringContaining('Report.pdf') })
    );
  });
});
