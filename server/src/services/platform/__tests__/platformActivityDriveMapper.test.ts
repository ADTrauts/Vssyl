import { describe, expect, it } from 'vitest';
import {
  mapDriveLegacyActionType,
  toDriveLegacyActivityRow,
  toNormalizedModuleActivityLogRow,
} from '../platformActivityDriveMapper';
import type { PlatformActivityRecord } from '../platformActivityTypes';

const sampleRecord: PlatformActivityRecord = {
  logId: 'log-1',
  eventId: 'evt-1',
  timestamp: new Date('2026-06-22T12:00:00.000Z'),
  moduleId: 'drive',
  action: 'upload',
  targetType: 'file',
  targetId: 'file-1',
  metadata: { fileName: 'report.pdf' },
  actorUserId: 'u1',
};

describe('platformActivityDriveMapper', () => {
  it('maps normalized log rows for Drive APIs', () => {
    const row = toNormalizedModuleActivityLogRow(sampleRecord);
    expect(row.id).toBe('log-1');
    expect(row.module).toBe('drive');
    expect(row.metadata).toMatchObject({
      action: 'upload',
      target: { type: 'file', id: 'file-1' },
    });
  });

  it('maps drive actions to legacy Activity.type values', () => {
    expect(mapDriveLegacyActionType('upload')).toBe('create');
    expect(mapDriveLegacyActionType('share')).toBe('share');
    expect(mapDriveLegacyActionType('trash')).toBe('delete');
    expect(mapDriveLegacyActionType('download')).toBe('download');
  });

  it('builds legacy drive activity rows for recent activity UI', () => {
    const row = toDriveLegacyActivityRow({
      record: sampleRecord,
      user: { id: 'u1', name: 'Tester', email: 't@test.com' },
      file: {
        id: 'file-1',
        name: 'report.pdf',
        type: 'application/pdf',
        size: 1024,
        path: '/files/report.pdf',
        url: 'https://example.com/report.pdf',
        starred: false,
        folderId: null,
        createdAt: new Date('2026-06-20T00:00:00.000Z'),
        updatedAt: new Date('2026-06-21T00:00:00.000Z'),
      },
    });

    expect(row.type).toBe('create');
    expect(row.user.name).toBe('Tester');
    expect(row.file.name).toBe('report.pdf');
  });
});
