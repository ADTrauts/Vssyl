import type { PlatformActivityRecord } from './platformActivityTypes';

/** Shape consumed by CrossModuleContextEngine activity analysis helpers. */
export interface AiContextActivityRow {
  id: string;
  module: string;
  action: string;
  type: string;
  timestamp: Date;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

export function toAiContextActivityRow(
  record: PlatformActivityRecord
): AiContextActivityRow {
  const compositeType = `${record.moduleId}_${record.action}`;
  return {
    id: record.logId,
    module: record.moduleId,
    action: compositeType,
    type: compositeType,
    timestamp: record.timestamp,
    details: record.metadata,
  };
}

/** Debug / twin context slice (legacy Activity select fields). */
export interface AiRecentActivityDebugRow {
  id: string;
  type: string;
  details: Record<string, unknown> | null;
  timestamp: Date;
}

export function toAiRecentActivityDebugRow(
  record: PlatformActivityRecord
): AiRecentActivityDebugRow {
  return {
    id: record.logId,
    type: `${record.moduleId}_${record.action}`,
    details: record.metadata,
    timestamp: record.timestamp,
  };
}
