/**
 * Shared helpers for suggestion rule evaluation (Phase 5C).
 */

import type { PrismaClient } from '@prisma/client';
import type { AISuggestionSignal } from '@prisma/client';
import type { DomainEvent } from '../../../events/types';
import { resolveDashboardIdFromEvent } from '../suggestionEventUtils';

export async function resolveBusinessIdFromDashboard(
  db: PrismaClient,
  dashboardId: string
): Promise<string | null> {
  const dashboard = await db.dashboard.findUnique({
    where: { id: dashboardId },
    select: { businessId: true },
  });
  return dashboard?.businessId ?? null;
}

export async function resolveTenantScope(
  event: DomainEvent,
  db: PrismaClient
): Promise<{ dashboardId: string | null; businessId: string | null }> {
  const dashboardId = resolveDashboardIdFromEvent(event);
  const businessId =
    event.businessId ?? (dashboardId ? await resolveBusinessIdFromDashboard(db, dashboardId) : null);
  return { dashboardId, businessId };
}

export function parseSignalMetadata(signal: AISuggestionSignal): Record<string, unknown> {
  if (!signal.metadata || typeof signal.metadata !== 'object' || Array.isArray(signal.metadata)) {
    return {};
  }
  return signal.metadata as Record<string, unknown>;
}

export function signalsOfType(
  signals: AISuggestionSignal[],
  domainEventType: string
): AISuggestionSignal[] {
  return signals.filter((s) => s.domainEventType === domainEventType);
}

export function isWithinMs(date: Date, windowMs: number, reference: Date = new Date()): boolean {
  return reference.getTime() - date.getTime() <= windowMs && date.getTime() <= reference.getTime();
}

export function isWithinFutureMs(date: Date, windowMs: number, reference: Date = new Date()): boolean {
  const delta = date.getTime() - reference.getTime();
  return delta >= 0 && delta <= windowMs;
}

/** Same local calendar day (UTC-normalized for deterministic tests). */
export function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function filterSignalsByTenant(
  signals: AISuggestionSignal[],
  scope: { dashboardId?: string | null; businessId?: string | null }
): AISuggestionSignal[] {
  return signals.filter((signal) => {
    if (scope.dashboardId && signal.dashboardId && signal.dashboardId !== scope.dashboardId) {
      return false;
    }
    if (scope.businessId && signal.businessId && signal.businessId !== scope.businessId) {
      return false;
    }
    return true;
  });
}

export function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function uniqueEventIds(...groups: Array<Array<string | null | undefined>>): string[] {
  const ids = new Set<string>();
  for (const group of groups) {
    for (const id of group) {
      if (typeof id === 'string' && id.trim()) ids.add(id.trim());
    }
  }
  return [...ids];
}
