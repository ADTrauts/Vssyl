import { Prisma } from '@prisma/client';
import {
  LEARNING_EVENT_TYPES,
  normalizeLearningEventType,
} from './learningProposalTypes';

export interface LearningEventArtifactEnvelope {
  artifact: unknown;
  dedupeKey?: string;
  impact?: 'low' | 'medium' | 'high' | 'critical';
  schemaVersion: 1;
}

export function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function readLearningEventArtifact(
  row: { newBehavior: string; patternData: unknown },
  fallback?: unknown
): unknown {
  if (isRecord(row.patternData) && 'artifact' in row.patternData) {
    return row.patternData.artifact;
  }
  const parsedBehavior = safeParseJson(row.newBehavior);
  if (parsedBehavior !== null) {
    return parsedBehavior;
  }
  return fallback ?? row.newBehavior;
}

export function buildLearningEventArtifactEnvelope(
  artifact: unknown,
  options?: { dedupeKey?: string; impact?: LearningEventArtifactEnvelope['impact'] }
): Prisma.InputJsonValue {
  const envelope: LearningEventArtifactEnvelope = {
    artifact,
    schemaVersion: 1,
    ...(options?.dedupeKey ? { dedupeKey: options.dedupeKey } : {}),
    ...(options?.impact ? { impact: options.impact } : {}),
  };
  return envelope as Prisma.InputJsonValue;
}

export function summarizePrimaryLearningBehavior(
  eventType: string,
  data: Record<string, unknown>
): string {
  if (typeof data.summary === 'string' && data.summary.trim()) {
    return data.summary.trim();
  }
  if (eventType === LEARNING_EVENT_TYPES.INTERACTION) {
    const query =
      (data.request as { query?: string } | undefined)?.query ??
      (typeof data.userQuery === 'string' ? data.userQuery : undefined) ??
      (typeof data.query === 'string' ? data.query : undefined);
    if (query && typeof query === 'string') {
      const trimmed = query.trim();
      return trimmed.length > 160 ? `${trimmed.slice(0, 157)}…` : trimmed;
    }
    return 'Chat interaction recorded for learning';
  }
  return 'Learning signal recorded';
}

export function buildPrimaryLearningEventWrite(input: {
  userId: string;
  eventType: string;
  context: string;
  data: Record<string, unknown>;
  confidence: number;
  impact?: LearningEventArtifactEnvelope['impact'];
  sourceModule?: string;
}): {
  userId: string;
  eventType: string;
  context: string;
  newBehavior: string;
  patternData: Prisma.InputJsonValue;
  confidence: number;
  frequency: number;
  applied: boolean;
  validated: boolean;
  sourceModule?: string;
} {
  const normalizedType = normalizeLearningEventType(input.eventType);
  const summary = summarizePrimaryLearningBehavior(normalizedType, input.data);

  return {
    userId: input.userId,
    eventType: normalizedType,
    context: input.context,
    sourceModule: input.sourceModule,
    newBehavior: summary,
    patternData: buildLearningEventArtifactEnvelope(input.data, {
      impact: input.impact ?? 'medium',
    }),
    confidence: input.confidence,
    frequency: 1,
    applied: false,
    validated: false,
  };
}

export function buildDerivedLearningEventWrite(input: {
  userId: string;
  eventType: string;
  contextKey: string;
  artifact: unknown;
  summary: string;
  confidence: number;
  dedupeKey: string;
  impact?: LearningEventArtifactEnvelope['impact'];
}): {
  userId: string;
  eventType: string;
  context: string;
  newBehavior: string;
  patternData: Prisma.InputJsonValue;
  confidence: number;
  frequency: number;
  applied: boolean;
  validated: boolean;
} {
  const normalizedType =
    input.eventType === 'pattern' ? LEARNING_EVENT_TYPES.PATTERN_DISCOVERY : input.eventType;

  return {
    userId: input.userId,
    eventType: normalizedType,
    context: input.contextKey,
    newBehavior: input.summary,
    patternData: buildLearningEventArtifactEnvelope(input.artifact, {
      dedupeKey: input.dedupeKey,
      impact: input.impact ?? 'medium',
    }),
    confidence: input.confidence,
    frequency: 1,
    applied: true,
    validated: true,
  };
}

export function parsePatternArtifact(row: {
  id: string;
  userId: string;
  newBehavior: string;
  patternData: unknown;
  confidence: number;
  frequency: number;
  createdAt: Date;
}): Record<string, unknown> | null {
  const raw = readLearningEventArtifact(row);
  if (!isRecord(raw)) return null;

  const patternType = typeof raw.patternType === 'string' ? raw.patternType : 'behavioral';
  return {
    id: typeof raw.id === 'string' ? raw.id : row.id,
    userId: typeof raw.userId === 'string' ? raw.userId : row.userId,
    patternType,
    confidence: typeof raw.confidence === 'number' ? raw.confidence : row.confidence,
    strength: typeof raw.strength === 'number' ? raw.strength : 0.5,
    frequency: typeof raw.frequency === 'number' ? raw.frequency : row.frequency,
    lastObserved:
      typeof raw.lastObserved === 'string' || raw.lastObserved instanceof Date
        ? raw.lastObserved
        : row.createdAt.toISOString(),
    data: isRecord(raw.data) ? raw.data : {},
    predictions: Array.isArray(raw.predictions) ? raw.predictions : [],
  };
}

export function parsePredictionArtifact(row: {
  id: string;
  userId: string;
  newBehavior: string;
  patternData: unknown;
  confidence: number;
  createdAt: Date;
}): Record<string, unknown> | null {
  const raw = readLearningEventArtifact(row);
  if (!isRecord(raw)) return null;

  return {
    id: typeof raw.id === 'string' ? raw.id : row.id,
    userId: typeof raw.userId === 'string' ? raw.userId : row.userId,
    type: typeof raw.type === 'string' ? raw.type : 'action',
    confidence: typeof raw.confidence === 'number' ? raw.confidence : row.confidence,
    probability: typeof raw.probability === 'number' ? raw.probability : 0.5,
    timeframe: typeof raw.timeframe === 'string' ? raw.timeframe : 'short_term',
    description: typeof raw.description === 'string' ? raw.description : row.newBehavior,
    data: isRecord(raw.data) ? raw.data : {},
    createdAt:
      typeof raw.createdAt === 'string' || raw.createdAt instanceof Date
        ? raw.createdAt
        : row.createdAt.toISOString(),
    expiresAt:
      typeof raw.expiresAt === 'string' || raw.expiresAt instanceof Date
        ? raw.expiresAt
        : new Date(row.createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    validated: typeof raw.validated === 'boolean' ? raw.validated : false,
  };
}

export function parseInsightArtifact(row: {
  id: string;
  userId: string;
  newBehavior: string;
  patternData: unknown;
  confidence: number;
  createdAt: Date;
}): Record<string, unknown> | null {
  const raw = readLearningEventArtifact(row);
  if (!isRecord(raw)) return null;

  return {
    id: typeof raw.id === 'string' ? raw.id : row.id,
    userId: typeof raw.userId === 'string' ? raw.userId : row.userId,
    insightType: typeof raw.insightType === 'string' ? raw.insightType : 'pattern_emergence',
    confidence: typeof raw.confidence === 'number' ? raw.confidence : row.confidence,
    significance: typeof raw.significance === 'number' ? raw.significance : 0.5,
    description: typeof raw.description === 'string' ? raw.description : row.newBehavior,
    recommendations: Array.isArray(raw.recommendations)
      ? raw.recommendations.filter((r): r is string => typeof r === 'string')
      : [],
    data: isRecord(raw.data) ? raw.data : {},
    createdAt:
      typeof raw.createdAt === 'string' || raw.createdAt instanceof Date
        ? raw.createdAt
        : row.createdAt.toISOString(),
  };
}
