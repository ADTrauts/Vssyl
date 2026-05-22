import { PrismaClient } from '@prisma/client';
import { hasExplicitRecallIntent } from '../utils/recallIntent';
import {
  isMemoryFactCategory,
  isMemoryFactSourceType,
} from './memoryFactTypes';
import {
  combinedMemoryScore,
  lexicalRelevanceScore,
  MEMORY_INFERRED_CONFIDENCE_FLOOR,
  MEMORY_PREDICATE_CHAR_BUDGET,
} from './memoryScoring';
import {
  buildUserMemoryFactListWhere,
  type RetrievedMemoryFact,
} from '../../services/userMemoryFactService';
import { prisma as defaultPrisma } from '../../lib/prisma';

export type MemoryRetrievalReasonCode =
  | 'recall_bias'
  | 'high_confidence_recent'
  | 'lexical_match'
  | 'explicit_boost'
  | 'inferred_threshold'
  | 'budget_trimmed'
  | 'scope_excluded';

export interface MemoryRetrievalCandidateSummary {
  factId: string;
  score: number;
  reasonCodes: MemoryRetrievalReasonCode[];
}

export interface MemoryRetrievalReport {
  factsLoaded: number;
  factsInfluenced: number;
  factIds: string[];
  influencedFactIds: string[];
  predicateCharsUsed: number;
  predicateCharBudget: number;
  isRecallQuery: boolean;
  candidates: MemoryRetrievalCandidateSummary[];
}

export interface MemoryRetrievalResult {
  facts: RetrievedMemoryFact[];
  report: MemoryRetrievalReport;
}

export interface MemoryRetrievalInput {
  userId: string;
  query: string;
  businessId?: string;
  isRecallQuery?: boolean;
  limit?: number;
  predicateCharBudget?: number;
}

type DbFact = {
  id: string;
  subject: string;
  predicate: string;
  confidence: number;
  sourceType: string;
  category: string;
  isExplicit: boolean;
  sourceConversationId: string | null;
  scope: string;
  businessId: string | null;
  updatedAt: Date;
};

function toRetrieved(f: DbFact, predicateOverride?: string): RetrievedMemoryFact {
  return {
    id: f.id,
    subject: f.subject,
    predicate: predicateOverride ?? f.predicate,
    confidence: f.confidence,
    sourceType: isMemoryFactSourceType(f.sourceType) ? f.sourceType : 'explicit_user',
    category: isMemoryFactCategory(f.category) ? f.category : 'other',
    isExplicit: f.isExplicit,
    sourceConversationId: f.sourceConversationId,
  };
}

function buildReasonCodes(input: {
  isRecallQuery: boolean;
  lexical: number;
  isExplicit: boolean;
  confidence: number;
  budgetTrimmed: boolean;
}): MemoryRetrievalReasonCode[] {
  const codes: MemoryRetrievalReasonCode[] = [];
  if (input.isRecallQuery) codes.push('recall_bias');
  if (input.lexical > 0) codes.push('lexical_match');
  else if (!input.isRecallQuery) codes.push('high_confidence_recent');
  if (input.isExplicit) codes.push('explicit_boost');
  if (!input.isExplicit && input.confidence >= MEMORY_INFERRED_CONFIDENCE_FLOOR) {
    codes.push('inferred_threshold');
  }
  if (input.budgetTrimmed) codes.push('budget_trimmed');
  return codes;
}

export class MemoryRetrievalService {
  constructor(private readonly db: PrismaClient = defaultPrisma) {}

  async retrieve(input: MemoryRetrievalInput): Promise<MemoryRetrievalResult> {
    const limit = input.limit ?? 8;
    const predicateCharBudget = input.predicateCharBudget ?? MEMORY_PREDICATE_CHAR_BUDGET;
    const isRecallQuery = input.isRecallQuery ?? hasExplicitRecallIntent(input.query);
    const now = new Date();

    const rows = await this.db.userMemoryFact.findMany({
      where: buildUserMemoryFactListWhere(input.userId, {
        businessId: input.businessId,
      }),
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        subject: true,
        predicate: true,
        confidence: true,
        sourceType: true,
        category: true,
        isExplicit: true,
        sourceConversationId: true,
        scope: true,
        businessId: true,
        updatedAt: true,
      },
    });

    const factsLoaded = rows.length;
    const factIds = rows.map((r) => r.id);

    const scored = rows
      .map((fact) => {
        if (!fact.isExplicit && fact.confidence < MEMORY_INFERRED_CONFIDENCE_FLOOR) {
          return null;
        }

        const lexical = lexicalRelevanceScore(
          input.query,
          fact.subject,
          fact.predicate
        );

        const score = combinedMemoryScore({
          confidence: fact.confidence,
          updatedAt: fact.updatedAt,
          query: input.query,
          subject: fact.subject,
          predicate: fact.predicate,
          isExplicit: fact.isExplicit,
          factScope: fact.scope,
          factBusinessId: fact.businessId,
          contextBusinessId: input.businessId,
          isRecallQuery,
          now,
        });

        if (score <= 0) return null;

        return {
          fact,
          score,
          lexical,
          reasonCodes: buildReasonCodes({
            isRecallQuery,
            lexical,
            isExplicit: fact.isExplicit,
            confidence: fact.confidence,
            budgetTrimmed: false,
          }),
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => b.score - a.score);

    const recallCap = isRecallQuery ? Math.min(limit, 5) : limit;
    const selected = scored.slice(0, recallCap);

    let predicateCharsUsed = 0;
    const influencedFacts: RetrievedMemoryFact[] = [];
    const influencedSummaries: MemoryRetrievalCandidateSummary[] = [];

    for (const item of selected) {
      const remaining = predicateCharBudget - predicateCharsUsed;
      if (remaining <= 0) break;

      let predicate = item.fact.predicate;
      let budgetTrimmed = false;
      if (predicate.length > remaining) {
        predicate = predicate.slice(0, remaining);
        budgetTrimmed = true;
      }
      predicateCharsUsed += predicate.length;

      const reasonCodes = budgetTrimmed
        ? [...new Set([...item.reasonCodes, 'budget_trimmed' as MemoryRetrievalReasonCode])]
        : item.reasonCodes;

      influencedFacts.push(toRetrieved(item.fact, predicate));
      influencedSummaries.push({
        factId: item.fact.id,
        score: Math.round(item.score * 1000) / 1000,
        reasonCodes,
      });
    }

    const report: MemoryRetrievalReport = {
      factsLoaded,
      factsInfluenced: influencedFacts.length,
      factIds,
      influencedFactIds: influencedFacts.map((f) => f.id),
      predicateCharsUsed,
      predicateCharBudget,
      isRecallQuery,
      candidates: influencedSummaries,
    };

    return { facts: influencedFacts, report };
  }
}

export const memoryRetrievalService = new MemoryRetrievalService();
