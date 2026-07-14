/**
 * Phase 6 — Generate internal work items from accepted correction destinations.
 * Does not integrate external ticketing. Does not mutate Twin runtime.
 */
import { randomUUID } from 'crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  AICorrectionDestination,
  AICorrectionWorkItemKind,
  AICorrectionWorkItemView,
} from 'vssyl-shared';

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

const DESTINATION_TO_KIND: Partial<Record<AICorrectionDestination, AICorrectionWorkItemKind>> = {
  PROMPT_POLICY: 'PROMPT_REVIEW',
  ROUTING_POLICY: 'PROVIDER_REVIEW',
  GROUNDING_POLICY: 'GROUNDING_REVIEW',
  KNOWLEDGE_ENGINE: 'KNOWLEDGE_REVIEW',
  MEMORY_REVIEW: 'MEMORY_REVIEW',
  PERSONAL_MEMORY: 'MEMORY_REVIEW',
  BUSINESS_ADMIN: 'BUSINESS_REVIEW',
  TOOL_OWNER: 'TOOL_REVIEW',
  AUTHORIZATION_POLICY: 'ENGINEERING',
  APPROVAL_POLICY: 'ENGINEERING',
  SOURCE_OF_RECORD_OWNER: 'ENGINEERING',
  CALENDAR_MODULE: 'ENGINEERING',
  DRIVE_MODULE: 'ENGINEERING',
  CHAT_MODULE: 'ENGINEERING',
  TODO_MODULE: 'ENGINEERING',
  HR_MODULE: 'ENGINEERING',
  USER_EDUCATION: 'CUSTOMER_REVIEW',
  OPERATOR_TRIAGE: 'OPERATOR_TRIAGE',
  NONE: 'OPERATOR_TRIAGE',
};

export function kindForDestination(destination: string): AICorrectionWorkItemKind {
  return DESTINATION_TO_KIND[destination as AICorrectionDestination] ?? 'ENGINEERING';
}

export async function generateWorkItemsForCorrection(
  prisma: PrismaClient,
  correctionRouteId: string,
  actorUserId: string,
  destinations: string[],
  assignedOwnerId?: string | null
): Promise<AICorrectionWorkItemView[]> {
  const created: AICorrectionWorkItemView[] = [];
  for (const destination of destinations) {
    if (destination === 'NONE') continue;
    const kind = kindForDestination(destination);
    const title = `[${kind}] Address ${destination} for correction ${correctionRouteId.slice(0, 8)}`;
    const row = await prisma.aICorrectionWorkItem.create({
      data: {
        id: randomUUID(),
        correctionRouteId,
        kind,
        destination,
        status: 'OPEN',
        title,
        assignedOwnerId: assignedOwnerId ?? null,
        historyJson: asJson([
          {
            at: new Date().toISOString(),
            actorUserId,
            action: 'WORK_ITEM_CREATED',
            detail: { kind, destination },
          },
        ]),
      },
    });
    created.push(mapWorkItem(row));
  }
  return created;
}

export function mapWorkItem(row: {
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
}): AICorrectionWorkItemView {
  return {
    id: row.id,
    correctionRouteId: row.correctionRouteId,
    kind: row.kind as AICorrectionWorkItemKind,
    destination: row.destination,
    status: row.status as AICorrectionWorkItemView['status'],
    title: row.title,
    assignedOwnerId: row.assignedOwnerId ?? undefined,
    history: Array.isArray(row.historyJson)
      ? (row.historyJson as AICorrectionWorkItemView['history'])
      : [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listWorkItemsForCorrection(
  prisma: PrismaClient,
  correctionRouteId: string
): Promise<AICorrectionWorkItemView[]> {
  const rows = await prisma.aICorrectionWorkItem.findMany({
    where: { correctionRouteId },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(mapWorkItem);
}

export async function updateWorkItemStatus(
  prisma: PrismaClient,
  workItemId: string,
  actorUserId: string,
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED',
  assignedOwnerId?: string | null
) {
  const existing = await prisma.aICorrectionWorkItem.findUnique({ where: { id: workItemId } });
  if (!existing) return null;
  const history = Array.isArray(existing.historyJson) ? [...existing.historyJson] : [];
  history.push({
    at: new Date().toISOString(),
    actorUserId,
    action: 'WORK_ITEM_STATUS',
    detail: { status, assignedOwnerId },
  });
  const row = await prisma.aICorrectionWorkItem.update({
    where: { id: workItemId },
    data: {
      status,
      assignedOwnerId:
        assignedOwnerId !== undefined ? assignedOwnerId : existing.assignedOwnerId,
      historyJson: asJson(history),
    },
  });
  return mapWorkItem(row);
}
