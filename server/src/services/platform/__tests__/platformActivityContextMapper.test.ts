import { describe, expect, it } from 'vitest';
import {
  toAiContextActivityRow,
  toAiRecentActivityDebugRow,
} from '../platformActivityContextMapper';
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

describe('platformActivityContextMapper', () => {
  it('maps platform records for AI context analysis', () => {
    const row = toAiContextActivityRow(sampleRecord);
    expect(row).toMatchObject({
      id: 'log-1',
      module: 'drive',
      action: 'drive_upload',
      type: 'drive_upload',
      timestamp: sampleRecord.timestamp,
      details: { fileName: 'report.pdf' },
    });
  });

  it('maps platform records for AI debug / twin slices', () => {
    const row = toAiRecentActivityDebugRow(sampleRecord);
    expect(row).toMatchObject({
      id: 'log-1',
      type: 'drive_upload',
      details: { fileName: 'report.pdf' },
      timestamp: sampleRecord.timestamp,
    });
  });
});
