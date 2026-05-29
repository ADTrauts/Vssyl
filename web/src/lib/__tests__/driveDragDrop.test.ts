import { describe, expect, it } from 'vitest';
import {
  isExternalFileDragTransfer,
  isInternalDriveItemDragTransfer,
  resolveDriveUploadFolderId,
} from '../driveDragDrop';

function mockTransfer(types: string[], files: File[] = []): DataTransfer {
  return {
    types,
    files,
  } as unknown as DataTransfer;
}

describe('driveDragDrop', () => {
  it('detects external OS file drag', () => {
    expect(isExternalFileDragTransfer(mockTransfer(['Files']))).toBe(true);
    expect(
      isExternalFileDragTransfer(
        mockTransfer(['Files'], [new File(['x'], 'a.txt', { type: 'text/plain' })])
      )
    ).toBe(true);
  });

  it('rejects internal drive item drag as external upload', () => {
    expect(isExternalFileDragTransfer(mockTransfer(['Files', 'application/json']))).toBe(false);
    expect(isInternalDriveItemDragTransfer(mockTransfer(['application/json']))).toBe(true);
  });

  it('prefers current folder over selected folder for uploads', () => {
    expect(resolveDriveUploadFolderId('folder-a', 'folder-b')).toBe('folder-a');
    expect(resolveDriveUploadFolderId(null, 'folder-b')).toBe('folder-b');
    expect(resolveDriveUploadFolderId(null, null)).toBe(null);
  });
});
