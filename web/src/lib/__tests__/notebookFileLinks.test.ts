import { describe, expect, it } from 'vitest';
import {
  formatFileSize,
  fileTypeLabel,
  getDriveFileOpenUrl,
} from '../notebookFileLinks';

describe('notebookFileLinks', () => {
  it('formatFileSize handles bytes and KB', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('fileTypeLabel prefers extension', () => {
    expect(fileTypeLabel('application/pdf', 'pdf')).toBe('PDF');
  });

  it('getDriveFileOpenUrl uses Drive file query param', () => {
    expect(getDriveFileOpenUrl('f-1')).toBe('/drive?file=f-1');
    expect(getDriveFileOpenUrl('f-1', 'dash-1')).toBe('/drive?file=f-1&dashboard=dash-1');
  });
});
