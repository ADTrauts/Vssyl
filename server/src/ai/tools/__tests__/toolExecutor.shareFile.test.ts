import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executeTool } from '../toolExecutor';
import * as driveShare from '../../../services/driveFileShareService';

vi.mock('../../../services/driveFileShareService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../services/driveFileShareService')>();
  return {
    ...actual,
    grantFileShareByEmail: vi.fn(),
  };
});

describe('toolExecutor share_file', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses canonical grantFileShareByEmail without direct Prisma in toolExecutor', async () => {
    vi.mocked(driveShare.grantFileShareByEmail).mockResolvedValue({
      permission: { id: 'perm-1' },
      file: { id: 'file-1', name: 'Report.pdf' },
    } as never);

    const result = await executeTool(
      'share_file',
      { fileId: 'file-1', targetUserEmail: 'a@b.com', canWrite: false },
      { userId: 'owner-1' }
    );

    expect(driveShare.grantFileShareByEmail).toHaveBeenCalledWith({
      ownerUserId: 'owner-1',
      fileId: 'file-1',
      targetUserEmail: 'a@b.com',
      canRead: true,
      canWrite: false,
    });
    expect(JSON.parse(result)).toEqual(
      expect.objectContaining({ success: true, message: expect.stringContaining('Report.pdf') })
    );
  });
});
