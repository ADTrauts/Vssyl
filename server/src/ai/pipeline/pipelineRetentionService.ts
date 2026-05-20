/**
 * Phase 5 — diagnostic retention, export, and purge.
 */

import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import type { AIPipelineTrace, PipelineRetentionSettings } from '../types/pipelineDiagnostics';
import { rowToPipelineTrace } from './pipelineDiagnosticPersistence';
import { evidenceBundleFromTrace } from './buildPipelineEvidenceBundle';

const DEFAULT_RETENTION: PipelineRetentionSettings = {
  diagnosticRetentionDays: 90,
  exportRedactUserMessages: true,
  exportRedactResponsePreviews: true,
};

export async function getPipelineRetentionSettings(): Promise<PipelineRetentionSettings> {
  const row = await prisma.aIPipelineSettings.findUnique({ where: { id: 'default' } });
  if (!row) return DEFAULT_RETENTION;
  return {
    diagnosticRetentionDays: row.diagnosticRetentionDays,
    exportRedactUserMessages: row.exportRedactUserMessages,
    exportRedactResponsePreviews: row.exportRedactResponsePreviews,
  };
}

export async function updatePipelineRetentionSettings(
  body: Partial<PipelineRetentionSettings>,
  adminUserId: string
): Promise<PipelineRetentionSettings> {
  const existing = await prisma.aIPipelineSettings.findUnique({ where: { id: 'default' } });
  const retentionDays =
    typeof body.diagnosticRetentionDays === 'number'
      ? Math.min(365, Math.max(7, Math.floor(body.diagnosticRetentionDays)))
      : (existing?.diagnosticRetentionDays ?? DEFAULT_RETENTION.diagnosticRetentionDays);

  const updated = existing
    ? await prisma.aIPipelineSettings.update({
        where: { id: 'default' },
        data: {
          diagnosticRetentionDays: retentionDays,
          ...(typeof body.exportRedactUserMessages === 'boolean'
            ? { exportRedactUserMessages: body.exportRedactUserMessages }
            : {}),
          ...(typeof body.exportRedactResponsePreviews === 'boolean'
            ? { exportRedactResponsePreviews: body.exportRedactResponsePreviews }
            : {}),
          updatedByAdminId: adminUserId,
        },
      })
    : await prisma.aIPipelineSettings.create({
        data: {
          id: 'default',
          weakGenericPhrases: [],
          diagnosticRetentionDays: retentionDays,
          exportRedactUserMessages:
            body.exportRedactUserMessages ?? DEFAULT_RETENTION.exportRedactUserMessages,
          exportRedactResponsePreviews:
            body.exportRedactResponsePreviews ?? DEFAULT_RETENTION.exportRedactResponsePreviews,
          updatedByAdminId: adminUserId,
        },
      });

  return {
    diagnosticRetentionDays: updated.diagnosticRetentionDays,
    exportRedactUserMessages: updated.exportRedactUserMessages,
    exportRedactResponsePreviews: updated.exportRedactResponsePreviews,
  };
}

export async function purgeExpiredPipelineDiagnostics(options?: {
  dryRun?: boolean;
}): Promise<{ deleted: number; cutoff: string }> {
  const settings = await getPipelineRetentionSettings();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - settings.diagnosticRetentionDays);

  if (options?.dryRun) {
    const count = await prisma.aIPipelineDiagnostic.count({
      where: { createdAt: { lt: cutoff } },
    });
    return { deleted: count, cutoff: cutoff.toISOString() };
  }

  const result = await prisma.aIPipelineDiagnostic.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  void logger.info('Pipeline diagnostics purge completed', {
    operation: 'pipeline_diagnostics_purge',
    deleted: result.count,
    cutoff: cutoff.toISOString(),
    retentionDays: settings.diagnosticRetentionDays,
  });

  return { deleted: result.count, cutoff: cutoff.toISOString() };
}

export interface ExportPipelineDiagnosticsParams {
  days?: number;
  userId?: string;
  atRiskOnly?: boolean;
  limit?: number;
  redact?: Partial<PipelineRetentionSettings>;
}

function redactTrace(
  trace: AIPipelineTrace,
  settings: PipelineRetentionSettings
): Record<string, unknown> {
  const bundle = evidenceBundleFromTrace(trace);
  return {
    traceId: trace.traceId,
    userId: trace.userId,
    conversationId: trace.conversationId,
    conversationHistoryId: trace.conversationHistoryId,
    userMessage: settings.exportRedactUserMessages ? '[redacted]' : trace.userMessage,
    finalResponsePreview: settings.exportRedactResponsePreviews
      ? '[redacted]'
      : trace.finalResponsePreview,
    intentDetected: trace.intentDetected,
    groundingRequired: trace.groundingRequired,
    retrievalPerformed: trace.retrievalPerformed,
    genericResponseRisk: trace.genericResponseRisk,
    confidenceLevel: trace.confidenceLevel,
    issues: trace.issues,
    enforcementAction: trace.enforcementAction,
    createdAt: trace.createdAt,
    evidenceBundle: bundle,
  };
}

export async function exportPipelineDiagnostics(
  params: ExportPipelineDiagnosticsParams
): Promise<{ format: 'json'; exportedAt: string; count: number; records: Record<string, unknown>[] }> {
  const settings = await getPipelineRetentionSettings();
  const redact: PipelineRetentionSettings = {
    ...settings,
    ...(params.redact ?? {}),
  };

  const days = Math.min(params.days ?? 30, 90);
  const limit = Math.min(params.limit ?? 500, 1000);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await prisma.aIPipelineDiagnostic.findMany({
    where: {
      createdAt: { gte: since },
      ...(params.userId ? { userId: params.userId } : {}),
      ...(params.atRiskOnly ? { genericResponseRisk: true } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const records: Record<string, unknown>[] = [];
  for (const row of rows) {
    const trace = rowToPipelineTrace(row);
    if (!trace) continue;
    records.push(redactTrace(trace, redact));
  }

  return {
    format: 'json',
    exportedAt: new Date().toISOString(),
    count: records.length,
    records,
  };
}

export function exportRecordsToCsv(records: Record<string, unknown>[]): string {
  const header = [
    'traceId',
    'userId',
    'createdAt',
    'intentDetected',
    'groundingRequired',
    'retrievalPerformed',
    'genericResponseRisk',
    'confidenceLevel',
    'enforcementAction',
    'issues',
    'assembledEvidenceCount',
    'structuredEvidenceCount',
    'toolOutputsCount',
  ];
  const lines = [header.join(',')];
  for (const r of records) {
    const bundle = r.evidenceBundle as Record<string, unknown> | undefined;
    const row = [
      String(r.traceId ?? ''),
      String(r.userId ?? ''),
      String(r.createdAt ?? ''),
      JSON.stringify(r.intentDetected ?? []),
      String(r.groundingRequired ?? ''),
      String(r.retrievalPerformed ?? ''),
      String(r.genericResponseRisk ?? ''),
      String(r.confidenceLevel ?? ''),
      String(r.enforcementAction ?? ''),
      JSON.stringify(r.issues ?? []),
      String(Array.isArray(bundle?.assembledEvidence) ? bundle.assembledEvidence.length : 0),
      String(Array.isArray(bundle?.structuredEvidence) ? bundle.structuredEvidence.length : 0),
      String(Array.isArray(bundle?.toolOutputs) ? bundle.toolOutputs.length : 0),
    ];
    lines.push(row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','));
  }
  return lines.join('\n');
}
