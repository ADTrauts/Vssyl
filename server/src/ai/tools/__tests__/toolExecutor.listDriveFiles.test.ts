import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executeTool } from '../toolExecutor';
import * as driveVisibility from '../../../services/driveVisibilityService';

vi.mock('../../../services/driveVisibilityService', () => ({
  listAccessibleDriveFiles: vi.fn(),
}));

describe('toolExecutor list_drive_files', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses permission-aware listAccessibleDriveFiles instead of owner-only query', async () => {
    vi.mocked(driveVisibility.listAccessibleDriveFiles).mockResolvedValue([
      { id: 'f1', name: 'Report.pdf', type: 'application/pdf', size: 2048, dashboardId: 'd1', folderId: null, userId: 'owner' },
    ] as never);

    const result = await executeTool(
      'list_drive_files',
      { folderId: 'folder-1', limit: 5 },
      { userId: 'collab-1', dashboardId: 'd1' }
    );

    expect(driveVisibility.listAccessibleDriveFiles).toHaveBeenCalledWith({
      userId: 'collab-1',
      dashboardId: 'd1',
      folderId: 'folder-1',
      limit: 5,
      applyPolicyEngine: true,
    });
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.data.files).toHaveLength(1);
    expect(parsed.data.files[0].name).toBe('Report.pdf');
  });
});
