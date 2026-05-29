import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { hardDeleteFile } from '../fileController';
import * as driveDeleteService from '../../services/driveDeleteService';
import { logger } from '../../lib/logger';

vi.mock('../../services/storageService', () => ({
  storageService: {
    getProvider: vi.fn().mockReturnValue('local'),
    isGCSConfigured: vi.fn().mockReturnValue(false),
    deleteFile: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('../../lib/logger', () => ({
  logger: {
    warn: vi.fn().mockResolvedValue(undefined),
    error: vi.fn().mockResolvedValue(undefined),
    info: vi.fn().mockResolvedValue(undefined),
    debug: vi.fn().mockResolvedValue(undefined),
  },
}));

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('deprecated hardDeleteFile endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs deprecation and delegates to driveDeleteService', async () => {
    vi.spyOn(driveDeleteService, 'permanentlyDeleteDriveFile').mockResolvedValue(true);

    const req = { user: { id: 'owner-1' }, params: { id: 'file-1' } } as unknown as Request;
    const res = mockResponse();

    await hardDeleteFile(req, res);

    expect(logger.warn).toHaveBeenCalledWith(
      'Deprecated drive-only hardDeleteFile endpoint called',
      expect.objectContaining({ operation: 'drive_trash_api_deprecated' })
    );
    expect(driveDeleteService.permanentlyDeleteDriveFile).toHaveBeenCalledWith({
      userId: 'owner-1',
      fileId: 'file-1',
    });
    expect(res.json).toHaveBeenCalledWith({ deleted: true });
  });
});
