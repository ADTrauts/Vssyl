/**
 * Phase 4 — Query/list services for AI Operations Center.
 */
import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  AIOperationsListQuery,
  AIOperationsPagination,
  AIExecutionListItem,
} from 'vssyl-shared';
import { normalizeEvaluationWorkflowStatus } from 'vssyl-shared';
import { rowToSnapshot } from '../intelligence/executionRecordService';

function parsePage(query: AIOperationsListQuery): { skip: number; take: number; page: number; pageSize: number } {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
}

function buildPagination(total: number, page: number, pageSize: number): AIOperationsPagination {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listExecutionRecords(
  prisma: PrismaClient,
  query: AIOperationsListQuery,
  businessScope?: string
): Promise<{ items: AIExecutionListItem[]; pagination: AIOperationsPagination }> {
  const { skip, take, page, pageSize } = parsePage(query);
  const where: Prisma.AIExecutionRecordWhereInput = {};

  if (businessScope) where.businessId = businessScope;
  if (query.businessId) where.businessId = query.businessId;
  if (query.userId) where.userId = query.userId;
  if (query.provider) where.provider = query.provider;
  if (query.surface) where.surface = query.surface;
  if (query.conversationId) where.conversationId = query.conversationId;
  if (query.executionId) where.id = query.executionId;
  if (query.search?.trim()) {
    where.OR = [
      { userQuery: { contains: query.search.trim(), mode: 'insensitive' } },
      { aiResponseSummary: { contains: query.search.trim(), mode: 'insensitive' } },
      { id: query.search.trim() },
    ];
  }
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};
    if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
    if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
  }

  const orderBy: Prisma.AIExecutionRecordOrderByWithRelationInput = {
    [query.sortBy ?? 'createdAt']: query.sortDir ?? 'desc',
  };

  const [rows, total] = await Promise.all([
    prisma.aIExecutionRecord.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        evaluations: { select: { id: true, workflowStatus: true } },
        corrections: { select: { id: true, status: true } },
      },
    }),
    prisma.aIExecutionRecord.count({ where }),
  ]);

  const items: AIExecutionListItem[] = rows.map((row) => {
    const linked =
      row.linkedArtifactsJson && typeof row.linkedArtifactsJson === 'object'
        ? (row.linkedArtifactsJson as { approvalIds?: string[] })
        : {};
    return {
      id: row.id,
      userId: row.userId,
      businessId: row.businessId ?? undefined,
      surface: row.surface,
      userQuery: row.userQuery ?? undefined,
      provider: row.provider ?? undefined,
      model: row.model ?? undefined,
      createdAt: row.createdAt.toISOString(),
      completedAt: row.completedAt?.toISOString(),
      evaluationCount: row.evaluations.length,
      hasOpenEvaluation: row.evaluations.some((e) =>
        ['PENDING', 'ASSIGNED'].includes(e.workflowStatus)
      ),
      hasApproval: Array.isArray(linked.approvalIds) && linked.approvalIds.length > 0,
      errorSummary: row.errorSummary ?? undefined,
    };
  });

  return { items, pagination: buildPagination(total, page, pageSize) };
}

export async function listEvaluations(
  prisma: PrismaClient,
  query: AIOperationsListQuery,
  businessScope?: string
) {
  const { skip, take, page, pageSize } = parsePage(query);
  const where: Prisma.AIEvaluationWhereInput = {};
  if (query.workflowStatus) where.workflowStatus = query.workflowStatus;
  if (query.assignedToUserId) where.assignedToUserId = query.assignedToUserId;
  if (query.priority) where.priority = query.priority;
  if (businessScope || query.businessId) {
    where.executionRecord = { businessId: businessScope ?? query.businessId };
  }

  const [rows, total] = await Promise.all([
    prisma.aIEvaluation.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: query.sortDir ?? 'desc' },
      include: {
        rootCauses: true,
        executionRecord: { select: { id: true, userQuery: true, businessId: true, provider: true } },
      },
    }),
    prisma.aIEvaluation.count({ where }),
  ]);

  return {
    items: rows.map(mapEvaluationRow),
    pagination: buildPagination(total, page, pageSize),
  };
}

export async function listCorrections(
  prisma: PrismaClient,
  query: AIOperationsListQuery,
  businessScope?: string
) {
  const { skip, take, page, pageSize } = parsePage(query);
  const where: Prisma.AICorrectionRouteWhereInput = {};
  if (query.correctionStatus) where.status = query.correctionStatus;
  if (businessScope || query.businessId) {
    where.executionRecord = { businessId: businessScope ?? query.businessId };
  }

  const [rows, total] = await Promise.all([
    prisma.aICorrectionRoute.findMany({
      where,
      skip,
      take,
      orderBy: { updatedAt: 'desc' },
      include: { executionRecord: { select: { userQuery: true, businessId: true } } },
    }),
    prisma.aICorrectionRoute.count({ where }),
  ]);

  return {
    items: rows.map(mapCorrectionRow),
    pagination: buildPagination(total, page, pageSize),
  };
}

export async function listRegressions(
  prisma: PrismaClient,
  query: AIOperationsListQuery,
  businessScope?: string
) {
  const { skip, take, page, pageSize } = parsePage(query);
  const where: Prisma.AIRegressionCaseWhereInput = {};
  if (query.regressionStatus) where.status = query.regressionStatus;
  if (businessScope || query.businessId) {
    where.executionRecord = { businessId: businessScope ?? query.businessId };
  }

  const [rows, total] = await Promise.all([
    prisma.aIRegressionCase.findMany({
      where,
      skip,
      take,
      orderBy: { updatedAt: 'desc' },
      include: { executionRecord: { select: { id: true, userQuery: true } } },
    }),
    prisma.aIRegressionCase.count({ where }),
  ]);

  return {
    items: rows.map(mapRegressionRow),
    pagination: buildPagination(total, page, pageSize),
  };
}

export function mapEvaluationRow(row: {
  id: string;
  executionRecordId: string;
  evaluatorRole: string;
  labelsJson: unknown;
  score: number | null;
  notes: string | null;
  workflowStatus: string;
  assignedToUserId: string | null;
  priority: string | null;
  severity: string | null;
  confidence: number | null;
  resolutionCode?: string | null;
  commentsJson: unknown;
  historyJson?: unknown;
  createdAt: Date;
  updatedAt: Date;
  rootCauses: Array<{
    id: string;
    code: string;
    notes: string | null;
    reviewStatus: string;
    reviewedByUserId: string | null;
    reviewedAt: Date | null;
    confidence?: number | null;
    ownerUserId?: string | null;
    historyJson: unknown;
  }>;
}) {
  return {
    id: row.id,
    executionRecordId: row.executionRecordId,
    evaluatorRole: row.evaluatorRole,
    labels: Array.isArray(row.labelsJson) ? (row.labelsJson as string[]) : [],
    score: row.score ?? undefined,
    notes: row.notes ?? undefined,
    workflowStatus: row.workflowStatus,
    lifecycleStatus: normalizeEvaluationWorkflowStatus(row.workflowStatus),
    assignedToUserId: row.assignedToUserId ?? undefined,
    priority: row.priority ?? undefined,
    severity: row.severity ?? undefined,
    confidence: row.confidence ?? undefined,
    resolutionCode: row.resolutionCode ?? undefined,
    comments: Array.isArray(row.commentsJson) ? row.commentsJson : [],
    history: Array.isArray(row.historyJson) ? row.historyJson : [],
    rootCauses: row.rootCauses.map((rc) => ({
      id: rc.id,
      code: rc.code,
      notes: rc.notes ?? undefined,
      reviewStatus: rc.reviewStatus,
      reviewedByUserId: rc.reviewedByUserId ?? undefined,
      reviewedAt: rc.reviewedAt?.toISOString(),
      confidence: rc.confidence ?? undefined,
      ownerUserId: rc.ownerUserId ?? undefined,
      history: Array.isArray(rc.historyJson) ? rc.historyJson : [],
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapCorrectionRow(row: {
  id: string;
  executionRecordId: string;
  evaluationId: string | null;
  rootCauseCode: string;
  destinationsJson: unknown;
  overrideDestinationsJson: unknown;
  status: string;
  routingApprovalStatus: string;
  assignedOwnerId: string | null;
  rationale: string | null;
  commentsJson: unknown;
  historyJson?: unknown;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  workItems?: Array<{
    id: string;
    correctionRouteId: string;
    kind: string;
    destination: string;
    status: string;
    title: string;
    assignedOwnerId: string | null;
    historyJson: unknown;
    createdAt: Date;
    updatedAt: Date;
  }>;
}) {
  return {
    id: row.id,
    executionRecordId: row.executionRecordId,
    evaluationId: row.evaluationId ?? undefined,
    rootCauseCode: row.rootCauseCode,
    destinations: Array.isArray(row.destinationsJson) ? (row.destinationsJson as string[]) : [],
    overrideDestinations: Array.isArray(row.overrideDestinationsJson)
      ? (row.overrideDestinationsJson as string[])
      : undefined,
    status: row.status,
    routingApprovalStatus: row.routingApprovalStatus,
    assignedOwnerId: row.assignedOwnerId ?? undefined,
    rationale: row.rationale ?? undefined,
    comments: Array.isArray(row.commentsJson) ? row.commentsJson : [],
    history: Array.isArray(row.historyJson) ? row.historyJson : [],
    workItems: row.workItems?.map((w) => ({
      id: w.id,
      correctionRouteId: w.correctionRouteId,
      kind: w.kind,
      destination: w.destination,
      status: w.status,
      title: w.title,
      assignedOwnerId: w.assignedOwnerId ?? undefined,
      history: Array.isArray(w.historyJson) ? w.historyJson : [],
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString(),
  };
}

export function mapRegressionRow(row: {
  id: string;
  executionRecordId: string;
  title: string;
  originalRequest: string;
  status: string;
  ownerUserId: string | null;
  priority: string | null;
  tagsJson: unknown;
  expectationsJson: unknown;
  historyJson: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    executionRecordId: row.executionRecordId,
    title: row.title,
    originalRequest: row.originalRequest,
    status: row.status,
    ownerUserId: row.ownerUserId ?? undefined,
    priority: row.priority ?? undefined,
    tags: Array.isArray(row.tagsJson) ? (row.tagsJson as string[]) : [],
    expectations:
      row.expectationsJson && typeof row.expectationsJson === 'object'
        ? (row.expectationsJson as Record<string, unknown>)
        : {},
    history: Array.isArray(row.historyJson) ? row.historyJson : [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export { rowToSnapshot };
