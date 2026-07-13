/**
 * Phase 4 — Execution detail enrichment (reads linked stores; no duplication).
 */
import type { PrismaClient } from '@prisma/client';
import type { AIExecutionDetailView } from 'vssyl-shared';
import {
  getAIExecutionRecord,
  rowToSnapshot,
} from '../intelligence/executionRecordService';
import {
  mapCorrectionRow,
  mapEvaluationRow,
  mapRegressionRow,
} from './operationsQueryService';

export async function getExecutionDetail(
  prisma: PrismaClient,
  id: string
): Promise<AIExecutionDetailView | null> {
  const row = await prisma.aIExecutionRecord.findUnique({
    where: { id },
    include: {
      evaluations: { include: { rootCauses: true } },
      corrections: true,
      regressions: true,
    },
  });
  if (!row) return null;

  const record = rowToSnapshot(row);
  const linked =
    row.linkedArtifactsJson && typeof row.linkedArtifactsJson === 'object'
      ? (row.linkedArtifactsJson as {
          actionExecutionIds?: string[];
          approvalIds?: string[];
        })
      : {};

  const actionIds = linked.actionExecutionIds ?? [];
  const actionRows =
    actionIds.length > 0
      ? await prisma.aIActionExecution.findMany({
          where: { id: { in: actionIds } },
          select: {
            id: true,
            actionName: true,
            status: true,
            riskCategory: true,
            approvalId: true,
            executed: true,
            completedAt: true,
          },
        })
      : [];

  let promptSummary: string | undefined;
  let contextProviders: string[] | undefined;
  let retrievedSources: string[] | undefined;
  let diagnostics: Record<string, unknown> | undefined;

  if (row.pipelineDiagnosticId) {
    const diag = await prisma.aIPipelineDiagnostic.findUnique({
      where: { id: row.pipelineDiagnosticId },
    });
    if (diag?.traceJson && typeof diag.traceJson === 'object') {
      const trace = diag.traceJson as Record<string, unknown>;
      promptSummary =
        typeof trace.promptSummary === 'string'
          ? trace.promptSummary
          : typeof trace.finalResponse === 'string'
            ? `Response recorded (${trace.finalResponse.slice(0, 120)}…)`
            : undefined;
      if (Array.isArray(trace.contextRetrieved)) {
        contextProviders = trace.contextRetrieved
          .map((c) => (typeof c === 'object' && c && 'source' in c ? String((c as { source: string }).source) : null))
          .filter((s): s is string => !!s);
      }
      if (Array.isArray(trace.memoryRetrieved)) {
        retrievedSources = [
          ...(retrievedSources ?? []),
          ...trace.memoryRetrieved.map((m) =>
            typeof m === 'object' && m && 'id' in m ? `memory:${String((m as { id: string }).id)}` : 'memory'
          ),
        ];
      }
      diagnostics = {
        genericResponseRisk: diag.genericResponseRisk,
        groundingRequired: diag.groundingRequired,
        retrievalPerformed: diag.retrievalPerformed,
        confidenceLevel: diag.confidenceLevel,
        intentDetected: diag.intentDetected,
        issues: diag.issues,
      };
    }
  }

  if (row.conversationHistoryId && !promptSummary) {
    const hist = await prisma.aIConversationHistory.findUnique({
      where: { id: row.conversationHistoryId },
      select: { userQuery: true, aiResponse: true, context: true },
    });
    if (hist) {
      promptSummary = hist.userQuery.slice(0, 500);
      if (hist.context && typeof hist.context === 'object') {
        const ctx = hist.context as Record<string, unknown>;
        if (Array.isArray(ctx.contextProviders)) {
          contextProviders = ctx.contextProviders as string[];
        }
      }
    }
  }

  if (row.diagnosticsSummaryJson && typeof row.diagnosticsSummaryJson === 'object') {
    diagnostics = { ...diagnostics, ...(row.diagnosticsSummaryJson as Record<string, unknown>) };
  }

  return {
    record,
    evaluations: row.evaluations.map(mapEvaluationRow) as AIExecutionDetailView['evaluations'],
    corrections: row.corrections.map(mapCorrectionRow) as AIExecutionDetailView['corrections'],
    regressions: row.regressions.map(mapRegressionRow) as AIExecutionDetailView['regressions'],
    linkedActionExecutions: actionRows.map((a) => ({
      id: a.id,
      actionName: a.actionName,
      status: a.status,
      riskCategory: a.riskCategory,
      approvalId: a.approvalId ?? undefined,
      executed: a.executed,
      completedAt: a.completedAt?.toISOString(),
    })),
    promptSummary,
    contextProviders,
    retrievedSources,
    diagnostics,
  };
}
