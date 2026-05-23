/**
 * Suggestion candidate + rule evaluation types (Phase 5B).
 */

import type { Prisma, PrismaClient } from '@prisma/client';
import type { AISuggestionSignal } from '@prisma/client';
import type { DomainEvent } from '../../events/types';
import type { SuggestionExplainability } from './suggestionTypes';

export interface SuggestionCandidate {
  userId: string;
  dashboardId: string;
  businessId?: string | null;
  householdId?: string | null;
  suggestionType: string;
  title: string;
  body: string;
  actionData: Prisma.InputJsonValue;
  confidence: number;
  explainability: SuggestionExplainability;
  correlationRuleId: string;
  suppressionKey: string;
  priority?: 'low' | 'normal' | 'high';
  expiresAt?: Date;
  sourceEventIds: string[];
}

export interface SuggestionRuleContext {
  event: DomainEvent;
  signalId: string;
  db: PrismaClient;
  recentSignals: AISuggestionSignal[];
}

export interface SuggestionRuleDefinition {
  id: string;
  triggerEventTypes: readonly string[];
  minConfidence: number;
  evaluate: (ctx: SuggestionRuleContext) => Promise<SuggestionCandidate | null>;
}
