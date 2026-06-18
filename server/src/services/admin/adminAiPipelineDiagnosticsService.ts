import { prisma } from '../../lib/prisma';
import { buildPipelineTrace } from '../../ai/pipeline/buildPipelineTrace';
import { mapOrchestrationToPipelineTraceInput } from '../../ai/pipeline/mapPipelineTraceInputs';
import { extractCanonicalPipelineTraceFromHistoryContext } from '../../ai/pipeline/mergeDiagnosticsFromHistoryContext';
import {
  findPipelineDiagnosticById,
  listPipelineDiagnosticsFromDb,
} from '../../ai/pipeline/pipelineDiagnosticPersistence';
import { getEffectivePipelineCatalog } from '../../ai/pipeline/pipelineCatalogService';
import { getPipelineTraceById } from '../../ai/pipeline/pipelineTraceStore';
import { enrichTraceWithInsights } from '../../ai/pipeline/pipelineTraceInsights';
import type { AIPipelineTrace } from '../../ai/types/pipelineDiagnostics';

type PipelineCatalog = Awaited<ReturnType<typeof getEffectivePipelineCatalog>>;

function enrichTracesForAdmin<T extends AIPipelineTrace>(traces: T[], catalog: PipelineCatalog) {
  return traces.map((trace) => {
    const withSource = trace as T & { diagnosticSource?: 'TWIN' | 'TEST_LAB' };
    return enrichTraceWithInsights(trace, catalog, {
      diagnosticSource: withSource.diagnosticSource ?? 'TWIN',
    });
  });
}

function enrichSingleTraceForAdmin(
  trace: AIPipelineTrace,
  catalog: PipelineCatalog,
  diagnosticSource?: 'TWIN' | 'TEST_LAB',
) {
  return enrichTraceWithInsights(trace, catalog, {
    diagnosticSource: diagnosticSource ?? 'TWIN',
  });
}

async function buildLegacyHistoryTraces(
  options: { limit: number; userId?: string },
  seen: Set<string>,
  catalog: PipelineCatalog,
): Promise<AIPipelineTrace[]> {
  const legacy: AIPipelineTrace[] = [];
  const historyRows = await prisma.aIConversationHistory.findMany({
    where: options.userId ? { userId: options.userId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: options.limit,
    select: {
      id: true,
      userId: true,
      userQuery: true,
      aiResponse: true,
      confidence: true,
      context: true,
      createdAt: true,
    },
  });

  for (const row of historyRows) {
    const embedded = extractCanonicalPipelineTraceFromHistoryContext(row.context);
    const trace =
      embedded ??
      buildPipelineTrace(
        {
          ...mapOrchestrationToPipelineTraceInput({
            userId: row.userId,
            userMessage: row.userQuery,
            finalResponse: row.aiResponse,
            confidence: row.confidence,
            queryContext:
              row.context && typeof row.context === 'object' && !Array.isArray(row.context)
                ? (row.context as Record<string, unknown>)
                : undefined,
            traceId: `history-${row.id}`,
          }),
          createdAt: row.createdAt.toISOString(),
        },
        { catalog },
      );
    if (seen.has(trace.traceId)) continue;
    seen.add(trace.traceId);
    legacy.push({
      ...trace,
      conversationHistoryId: row.id,
    });
  }

  return legacy;
}

export async function listAdminPipelineDiagnostics(options: {
  limit: number;
  userId?: string;
}): Promise<{ traces: ReturnType<typeof enrichTracesForAdmin>; total: number }> {
  const catalog = await getEffectivePipelineCatalog();
  const dbTraces = await listPipelineDiagnosticsFromDb({ limit: options.limit, userId: options.userId });
  const seen = new Set(dbTraces.map((t) => t.traceId));

  if (dbTraces.length >= options.limit) {
    return {
      traces: enrichTracesForAdmin(dbTraces, catalog),
      total: dbTraces.length,
    };
  }

  const legacy = await buildLegacyHistoryTraces(options, seen, catalog);
  const combined = [...dbTraces, ...legacy]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, options.limit);

  return {
    traces: enrichTracesForAdmin(combined, catalog),
    total: combined.length,
  };
}

export type AdminPipelineDiagnosticLookup =
  | { found: true; data: ReturnType<typeof enrichSingleTraceForAdmin> }
  | { found: false };

export async function getAdminPipelineDiagnosticByTraceId(
  traceId: string,
): Promise<AdminPipelineDiagnosticLookup> {
  const catalog = await getEffectivePipelineCatalog();

  const fromDb = await findPipelineDiagnosticById(traceId);
  if (fromDb) {
    const row = await prisma.aIPipelineDiagnostic.findUnique({
      where: { id: traceId },
      select: { source: true },
    });
    const source = row?.source === 'TEST_LAB' ? 'TEST_LAB' : 'TWIN';
    return {
      found: true,
      data: enrichSingleTraceForAdmin(fromDb, catalog, source),
    };
  }

  const fromMemory = getPipelineTraceById(traceId);
  if (fromMemory) {
    return {
      found: true,
      data: enrichSingleTraceForAdmin(fromMemory, catalog, 'TWIN'),
    };
  }

  if (traceId.startsWith('history-')) {
    const historyId = traceId.slice('history-'.length);
    const row = await prisma.aIConversationHistory.findUnique({
      where: { id: historyId },
      select: {
        id: true,
        userId: true,
        userQuery: true,
        aiResponse: true,
        confidence: true,
        context: true,
        createdAt: true,
      },
    });
    if (!row) {
      return { found: false };
    }
    const embedded = extractCanonicalPipelineTraceFromHistoryContext(row.context);
    const trace =
      embedded ??
      buildPipelineTrace(
        {
          ...mapOrchestrationToPipelineTraceInput({
            userId: row.userId,
            userMessage: row.userQuery,
            finalResponse: row.aiResponse,
            confidence: row.confidence,
            queryContext:
              row.context && typeof row.context === 'object' && !Array.isArray(row.context)
                ? (row.context as Record<string, unknown>)
                : undefined,
            traceId: `history-${row.id}`,
          }),
          createdAt: row.createdAt.toISOString(),
        },
        { catalog },
      );
    return {
      found: true,
      data: enrichSingleTraceForAdmin(
        { ...trace, conversationHistoryId: row.id },
        catalog,
        'TWIN',
      ),
    };
  }

  return { found: false };
}
