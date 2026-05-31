import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as driveVisibility from '../driveVisibilityService';
import {
  validateMessageAttachmentFileIds,
  withFullFileUrls,
} from '../chatAttachmentService';
import { ChatServiceError } from '../chat/chatErrors';

describe('chatAttachmentService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty array when no fileIds', async () => {
    const result = await validateMessageAttachmentFileIds('u1', undefined);
    expect(result).toEqual([]);
  });

  it('throws when Drive denies file access', async () => {
    vi.spyOn(driveVisibility, 'validateAccessibleFileIds').mockResolvedValue({
      accessibleIds: ['f1'],
      deniedIds: ['f2'],
    });

    await expect(
      validateMessageAttachmentFileIds('u1', ['f1', 'f2'])
    ).rejects.toThrow(ChatServiceError);
  });

  it('returns accessible ids when all pass', async () => {
    vi.spyOn(driveVisibility, 'validateAccessibleFileIds').mockResolvedValue({
      accessibleIds: ['f1', 'f2'],
      deniedIds: [],
    });

    const result = await validateMessageAttachmentFileIds('u1', ['f1', 'f2']);
    expect(result).toEqual(['f1', 'f2']);
  });

  it('withFullFileUrls prefixes API base', () => {
    const message = withFullFileUrls({
      id: 'm1',
      fileReferences: [{ file: { url: '/api/files/x' } }],
    });
    expect(message.fileReferences[0].file.url).toContain('/api/files/x');
    expect(message.fileReferences[0].file.url).toMatch(/^https?:\/\//);
  });
});
