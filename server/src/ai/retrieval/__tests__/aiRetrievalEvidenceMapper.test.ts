import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  mapSearchResultToEvidence,
  normalizeEvidenceConfidence,
} from '../aiRetrievalEvidenceMapper';

describe('aiRetrievalEvidenceMapper', () => {
  const baseResult = {
    id: 'file-1',
    title: 'Q1 Plan',
    description: 'Quarterly planning doc',
    moduleId: 'drive',
    moduleName: 'Drive',
    url: '/drive/file-1',
    type: 'file',
    metadata: { mimeType: 'application/pdf' },
    permissions: [{ type: 'read' as const, granted: true }],
    lastModified: new Date('2026-01-01'),
    relevanceScore: 0.82,
  };

  it('maps search result fields to normalized evidence', () => {
    const evidence = mapSearchResultToEvidence(baseResult);
    expect(evidence.sourceType).toBe('search');
    expect(evidence.sourceModule).toBe('drive');
    expect(evidence.entityId).toBe('file-1');
    expect(evidence.entityType).toBe('file');
    expect(evidence.title).toBe('Q1 Plan');
    expect(evidence.summary).toBe('Quarterly planning doc');
    expect(evidence.score).toBe(0.82);
    expect(evidence.confidence).toBe(0.82);
    expect(evidence.route).toBe('/drive/file-1');
    expect(evidence.permissionsVerified).toBe(true);
    expect(evidence.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('normalizes confidence to 0-1 range', () => {
    expect(normalizeEvidenceConfidence(1.5)).toBe(1);
    expect(normalizeEvidenceConfidence(-0.2)).toBe(0);
    expect(normalizeEvidenceConfidence(undefined)).toBeUndefined();
  });

  it('normalizes route when url is missing', () => {
    const evidence = mapSearchResultToEvidence({ ...baseResult, url: '' });
    expect(evidence.route).toBe('/drive/file-1');
  });

  it('prefixes route when url lacks leading slash', () => {
    const evidence = mapSearchResultToEvidence({ ...baseResult, url: 'drive/file-1' });
    expect(evidence.route).toBe('/drive/file-1');
  });

  it('marks permissionsVerified false when any permission is denied', () => {
    const denied = {
      ...baseResult,
      permissions: [
        { type: 'read' as const, granted: true },
        { type: 'write' as const, granted: false },
      ],
    };
    expect(mapSearchResultToEvidence(denied).permissionsVerified).toBe(false);
  });
});
