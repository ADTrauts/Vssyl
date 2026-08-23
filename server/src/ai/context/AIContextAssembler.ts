/**
 * Conservative context assembly for AI providers: structured, evidence-aware view
 * of what is being sent to the model (additive; does not replace raw prompts).
 */

import type { UserContext } from './CrossModuleContextEngine';
import { logger } from '../../lib/logger';
import type { AIResponseDensity, AIResponseMode } from '../types/structuredResponse';
import { inferQueryIntent, type QueryIntent } from '../utils/queryIntent';
import {
  inferStructuredResponseMode,
  type InferStructuredResponseModeResult,
} from '../utils/structuredResponseMode';
import {
  applyContextProfile,
  contextBudgetTokensForProfile,
  isSyntheticInsight,
  maxBlocksForProfile,
  resolveContextProfile,
  conversationRankFilter,
  type ContextProfile,
} from './contextProfile';
import type { ContextSynthesisResult } from './ContextSynthesisService';
import { isSyntheticContextEnabled } from './syntheticContextPolicy';
import {
  applyContextBudget,
  estimateTokenCount,
} from './ContextBudgetManager';
import { buildConversationThreadHints } from '../utils/conversationContinuity';
import type { EffectivePreferencesContextBlock } from '../preferences/preferenceTypes';
import { PREFERENCE_CONTEXT_BLOCK_TITLE } from '../preferences/PreferenceResolver';
import {
  BUSINESS_WORKSPACE_POLICY_BLOCK_TITLE,
  type BusinessWorkspaceBoundaryBlock,
} from '../enterprise/businessWorkspaceBoundaries';
import { prepareMemoryFactsForAssembly } from '../memory/memoryContextInjection';
import type { VLinkPipelineContextResult } from './vlinkPipelineContextService';
import type { GraphBundlePipelineContextResult } from './graphBundlePipelineContextService';
import {
  buildNeighborhoodAssemblyContent,
  neighborhoodsFromGraphContext,
  resolvePipelineConsumerIntent,
} from '../../knowledge/knowledgeNeighborhoodService.js';
import {
  resolveNeighborhoodConsumer,
  shouldConsumeNeighborhoodsDirectly,
} from '../../knowledge/projectAssistantNeighborhoodConsumer.js';

/** Mirrors fields used from `LifeTwinQuery` without importing core (avoids circular deps). */
export interface AIContextAssemblyQuery {
  query: string;
  userId: string;
  context: Record<string, unknown>;
  conversationHistory?: Array<{ role: string; content: string; timestamp?: Date | string }>;
  continuityState?: unknown;
  activeTopic?: unknown;
}

export type AIContextTier = 'tier1_recent_conversation' | 'tier2_continuity' | 'tier3_profile' | 'tier4_cross_module';

export interface AIContextAssemblyAttachedFile {
  id: string;
  name: string;
  size?: number | null;
  summary?: string;
}

export type AIAssembledEvidenceSourceType =
  | 'module'
  | 'file'
  | 'chat'
  | 'calendar'
  | 'drive'
  | 'business'
  | 'personal'
  | 'vlink'
  | 'graph_bundle'
  | 'system'
  | 'unknown';

export interface AIAssembledContext {
  scope: 'personal' | 'business' | 'household' | 'cross_module';
  intent?: QueryIntent;
  /** Authoritative structured JSON mode for provider prompts and normalization. */
  structuredResponseMode?: AIResponseMode;
  /** Internal pacing hint (not exposed to clients yet). */
  responseDensity?: AIResponseDensity;
  currentModule?: string;
  usedModules: string[];
  evidence: Array<{
    label: string;
    sourceType: AIAssembledEvidenceSourceType;
    sourceId?: string;
    detail?: string;
    confidence?: 'low' | 'medium' | 'high';
  }>;
  contextBlocks: Array<{
    title: string;
    sourceType: AIAssembledEvidenceSourceType;
    content: unknown;
    priority: 'low' | 'medium' | 'high';
    tier?: AIContextTier;
    inclusionReason?: string;
    /** Set after relevance ranking (debug / tuning). */
    relevanceScore?: number;
    /** Estimated tokens for this block after budgeting (debug / tuning). */
    budgetTokensEstimate?: number;
    /** Block was considered for the prompt (Phase 3D). */
    available?: boolean;
    /** Block was included in the provider prompt after budgeting (Phase 3D). */
    usedInPrompt?: boolean;
  }>;
  assumptions: string[];
  risks: string[];
  missingContext: string[];
  /** Available vs used context rows after budgeting (Phase 3D). */
  contextAvailability?: Array<{
    title: string;
    sourceType: string;
    tier?: AIContextTier;
    relevanceScore?: number;
    available: true;
    usedInPrompt: boolean;
    dropReason?: string;
    budgetTokensEstimate?: number;
  }>;
  /** Assembly pipeline metrics for context density reporting (Phase 3A). */
  assemblyMetrics?: {
    blocksLoaded: number;
    blocksAfterProfile: number;
    blocksRanked: number;
    blocksInjected: number;
    profileExcludedCount: number;
    contextBudgetTokens: number;
    tokensUsedEstimate: number;
    moduleContextsLoaded: number;
    moduleBlocksLoaded: number;
    matchedHighRelevance: number;
    memoryFactsLoaded: number;
    memoryFactsInjected: number;
    recalledMessagesLoaded: number;
    blocksDropped?: number;
  };
}

export interface AIContextAssemblyInput {
  query: AIContextAssemblyQuery;
  /** UserContext may carry dashboardContext at runtime (smart context merge). */
  userContext: UserContext & { dashboardContext?: Record<string, unknown> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analysis?: any;
  attachedFiles?: AIContextAssemblyAttachedFile[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  smartAnalysis?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  semanticEnhancement?: any;
  userDefinedContext?: Array<Record<string, unknown>>;
  globalPatterns?: Array<Record<string, unknown>>;
  /** Live module provider payloads from ModuleAIContextService (keyed by moduleId). */
  moduleContexts?: Record<string, unknown>;
  /** Data-backed cross-module synthesis from live module payloads (Phase 3C). */
  crossModuleSynthesis?: ContextSynthesisResult;
  /** Summaries from other recent AI chat threads (cross-session). */
  recentConversationMemory?: Array<{
    id: string;
    title: string;
    threadSummary: string | null;
    topics?: import('../../services/aiConversationMemoryService').ConversationTopicsPayload | null;
    lastMessageAt: Date | string;
  }>;
  recalledMessages?: Array<{
    messageId: string;
    conversationId: string;
    role: string;
    contentSnippet: string;
    similarity: number;
  }>;
  userMemoryFacts?: Array<{
    id?: string;
    subject: string;
    predicate: string;
    confidence: number;
    sourceType?: string;
    isExplicit?: boolean;
  }>;
  toneMode?: string;
  explicitStructuredMode?: string;
  /**
   * Pre-resolved structured response decision from DigitalLifeTwinCore (canonical Twin path).
   * When set, assembler does not re-run inferStructuredResponseMode.
   */
  structuredResolution?: InferStructuredResponseModeResult;
  /** Resolved user communication / autonomy preferences (compact, no raw questionnaire). */
  effectivePreferencesContextBlock?: EffectivePreferencesContextBlock;
  /** Business workspace policies when chatting with businessId (separate from personal prefs). */
  businessWorkspaceBoundaries?: BusinessWorkspaceBoundaryBlock;
  /** Confirmed V_Link pipeline context (first-class source; excludes unapproved suggestions). */
  vlinkPipelineContext?: VLinkPipelineContextResult;
  /** Formal Context Graph bundles via Tier 0 provider (ContextBundleDescriptor). */
  graphBundlePipelineContext?: GraphBundlePipelineContextResult;
}

export interface ModuleContextAssemblyEntry {
  moduleId: string;
  moduleName?: string;
  providerName?: string;
  relevance?: string;
  data: unknown;
  cached?: boolean;
}

const MAX_STRING = 4000;
const MAX_ITEMS = 30;
const MAX_CONTEXT_BLOCKS_AFTER_RANK = 12;
/** Rough provider prompt budget for assembled context blocks only (chars/4 heuristic). */
const DEFAULT_CONTEXT_BUDGET_ESTIMATED_TOKENS = 6000;

/** Deterministic context compression (before ranking / provider). */
const COMPRESS_STRING_MAX = 800;
const COMPRESS_ARRAY_MAX = 10;
const COMPRESS_MAX_DEPTH = 12;

function compressTrimString(s: string, max = COMPRESS_STRING_MAX): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

/**
 * Shrink noisy/large nested values: strip nullish keys, cap strings and arrays, recurse objects.
 */
export function compressContextContent(content: unknown, depth = 0): unknown {
  if (depth > COMPRESS_MAX_DEPTH) return content;
  if (content === null || content === undefined) return content;
  if (typeof content === 'string') return compressTrimString(content, COMPRESS_STRING_MAX);
  if (typeof content === 'number' || typeof content === 'boolean') return content;

  if (Array.isArray(content)) {
    return content.slice(0, COMPRESS_ARRAY_MAX).map((item) => compressContextContent(item, depth + 1));
  }

  if (typeof content === 'object') {
    const o = content as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) {
      if (v === null || v === undefined) continue;
      const cv = compressContextContent(v, depth + 1);
      if (cv !== undefined) out[k] = cv;
    }
    return out;
  }

  return content;
}

function compressRecentActivityArray(arr: unknown[]): unknown {
  return arr.slice(0, COMPRESS_ARRAY_MAX).map((item) => {
    if (!item || typeof item !== 'object') return compressContextContent(item);
    const o = item as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of ['id', 'type', 'module', 'description', 'timestamp']) {
      const v = o[k];
      if (v === null || v === undefined) continue;
      out[k] = typeof v === 'string' ? compressTrimString(v, COMPRESS_STRING_MAX) : compressContextContent(v);
    }
    return out;
  });
}

function compressFilePayloadArray(arr: unknown[]): unknown {
  return arr.slice(0, COMPRESS_ARRAY_MAX).map((item) => {
    if (!item || typeof item !== 'object') return compressContextContent(item);
    const o = item as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    if (o.id !== undefined && o.id !== null) out.id = o.id;
    if (o.name !== undefined && o.name !== null) {
      out.name =
        typeof o.name === 'string' ? compressTrimString(o.name, COMPRESS_STRING_MAX) : compressContextContent(o.name);
    }
    if (typeof o.summary === 'string') {
      out.summary = compressTrimString(o.summary, COMPRESS_STRING_MAX);
    }
    return out;
  });
}

function compressBlockContent(block: AIAssembledContext['contextBlocks'][number]): unknown {
  const titleLower = block.title.toLowerCase();
  if (!Array.isArray(block.content)) {
    return compressContextContent(block.content);
  }
  if (block.sourceType === 'file' || titleLower.includes('attached files')) {
    return compressFilePayloadArray(block.content);
  }
  if (block.sourceType === 'calendar' || titleLower.includes('recent activity')) {
    return compressRecentActivityArray(block.content);
  }
  return compressContextContent(block.content);
}

const PLACEHOLDER_SNIPPETS = [
  'learning your patterns',
  'learning query patterns',
  'system is learning',
  'building predictive insights',
];

function queryTokens(queryText: string): string[] {
  const q = queryText.toLowerCase();
  const raw = q.match(/[a-z0-9]{3,}/g) ?? [];
  return [...new Set(raw)];
}

function contentStringForScoring(content: unknown): string {
  if (content == null) return '';
  if (typeof content === 'string') return content.toLowerCase();
  try {
    return JSON.stringify(content).toLowerCase();
  } catch {
    return '';
  }
}

function isEmptyContent(content: unknown): boolean {
  if (content == null) return true;
  if (Array.isArray(content)) return content.length === 0;
  if (typeof content === 'object') {
    const keys = Object.keys(content as object);
    return keys.length === 0;
  }
  if (typeof content === 'string') return content.trim().length === 0;
  return false;
}

function isNullHeavyContent(content: unknown): boolean {
  if (content == null) return true;
  if (typeof content !== 'object' || Array.isArray(content)) return false;
  const o = content as Record<string, unknown>;
  const vals = Object.values(o);
  if (vals.length === 0) return false;
  const nullish = vals.filter((v) => v == null).length;
  return nullish / vals.length > 0.6;
}

/**
 * Deterministic keyword relevance for a single context block (no embeddings).
 */
export function scoreContextBlock(input: {
  queryText: string;
  block: AIAssembledContext['contextBlocks'][number];
  currentModule?: string;
}): number {
  const { queryText, block, currentModule } = input;
  const q = queryText.toLowerCase();
  const titleLower = (block.title || '').toLowerCase();
  const source = block.sourceType;
  const contentStr = contentStringForScoring(block.content);

  let score =
    block.priority === 'high' ? 60 : block.priority === 'medium' ? 40 : 20;

  if (block.tier === 'tier1_recent_conversation') score += 22;
  if (block.tier === 'tier2_continuity') score += 16;
  if (block.tier === 'tier3_profile') score += 8;
  if (block.tier === 'tier4_cross_module') score -= 4;

  const tokens = queryTokens(queryText);
  for (const t of tokens) {
    if (titleLower.includes(t) || source === t) {
      score += 5;
    }
  }
  const contentTokenBonus = Math.min(
    tokens.filter((t) => contentStr.includes(t)).length * 3,
    25
  );
  score += contentTokenBonus;

  if (currentModule?.trim()) {
    const mod = currentModule.trim().toLowerCase();
    if (mod && (titleLower.includes(mod) || contentStr.includes(mod))) {
      score += 8;
    }
  }

  if ((source === 'file' || source === 'drive') && /\b(file|files|document|pdf|attachment|drive|upload|spreadsheet)\b/i.test(q)) {
    score += 10;
  }
  if (
    source === 'calendar' &&
    /\b(schedule|meeting|event|calendar|date|time)\b/i.test(q)
  ) {
    score += 10;
  }
  if (
    source === 'business' &&
    /\b(business|team|employee|role|workspace|operations)\b/i.test(q)
  ) {
    score += 10;
  }
  if (
    source === 'chat' &&
    /\b(chat|message|conversation|thread)\b/i.test(q)
  ) {
    score += 10;
  }

  const blob = `${titleLower} ${contentStr}`;
  if (PLACEHOLDER_SNIPPETS.some((p) => blob.includes(p))) {
    score -= 15;
  }
  if (isEmptyContent(block.content)) {
    score -= 10;
  }
  if (isNullHeavyContent(block.content)) {
    score -= 8;
  }

  return score;
}

function rankContextBlocksForProvider(
  blocks: AIAssembledContext['contextBlocks'],
  queryText: string,
  currentModule?: string,
  profile: ContextProfile = 'enterprise'
): AIAssembledContext['contextBlocks'] {
  const totalBlocksBefore = blocks.length;
  const maxBlocks = maxBlocksForProfile(profile);
  const scored = blocks.map((b) => ({
    ...b,
    relevanceScore: scoreContextBlock({ queryText, block: b, currentModule }),
  }));
  let filtered =
    profile === 'conversation'
      ? conversationRankFilter(scored)
      : scored.filter((b) => {
          if (b.tier === 'tier4_cross_module') {
            return (b.relevanceScore ?? 0) >= 35 || b.priority === 'high';
          }
          return true;
        });
  filtered.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

  const highs =
    profile === 'conversation'
      ? filtered.filter((b) => b.priority === 'high' && (b.relevanceScore ?? 0) >= 40)
      : filtered.filter((b) => b.priority === 'high');
  const highSet = new Set(highs);
  const others = filtered.filter((b) => !highSet.has(b));
  const out: AIAssembledContext['contextBlocks'] = [...highs];
  for (const b of others) {
    if (out.length >= maxBlocks) break;
    out.push(b);
  }

  void logger.debug('[AI_CONTEXT_RELEVANCE]', {
    totalBlocksBefore,
    totalBlocksAfter: out.length,
    topBlocks: filtered.slice(0, 5).map((b) => ({
      title: b.title,
      sourceType: b.sourceType,
      tier: b.tier,
      priority: b.priority,
      score: b.relevanceScore,
      inclusionReason: b.inclusionReason,
    })),
  });

  return out;
}

export { estimateTokenCount } from './ContextBudgetManager';

function truncateString(s: string, max = MAX_STRING): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…[truncated]`;
}

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const s = raw.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function inferIntent(queryText: string): QueryIntent {
  return inferQueryIntent(queryText);
}

function inferTierForBlock(block: AIAssembledContext['contextBlocks'][number]): AIContextTier {
  if (block.tier) return block.tier;
  const title = block.title.toLowerCase();
  if (title.includes('conversation history')) return 'tier1_recent_conversation';
  if (title.includes('continuity') || title.includes('active topic')) return 'tier2_continuity';
  if (title.includes('user-defined') || title.includes('preferences') || title.includes('personality')) {
    return 'tier3_profile';
  }
  return 'tier4_cross_module';
}

function countDistinctContextSources(blocks: AIAssembledContext['contextBlocks']): number {
  const keys = new Set<string>();
  for (const b of blocks) {
    keys.add(`${b.sourceType}:${b.title}`);
  }
  return keys.size;
}

/**
 * Build assembled context for provider `data.assembledContext`.
 */
function normalizeModuleContexts(
  raw: Record<string, unknown> | undefined
): ModuleContextAssemblyEntry[] {
  if (!raw || typeof raw !== 'object') return [];
  const entries: ModuleContextAssemblyEntry[] = [];
  for (const [moduleId, value] of Object.entries(raw)) {
    if (!value || typeof value !== 'object') continue;
    const o = value as Record<string, unknown>;
    const payload = o.data !== undefined ? o.data : value;
    entries.push({
      moduleId,
      moduleName: typeof o.moduleName === 'string' ? o.moduleName : undefined,
      providerName: typeof o.providerName === 'string' ? o.providerName : undefined,
      relevance: typeof o.relevance === 'string' ? o.relevance : undefined,
      data: payload,
      cached: o.cached === true,
    });
  }
  return entries;
}

export function assembleAIContext(input: AIContextAssemblyInput): AIAssembledContext {
  const {
    query,
    userContext,
    analysis,
    attachedFiles,
    smartAnalysis,
    semanticEnhancement,
    userDefinedContext,
    globalPatterns,
    moduleContexts: rawModuleContexts,
    crossModuleSynthesis,
    recentConversationMemory,
    recalledMessages,
    userMemoryFacts,
    effectivePreferencesContextBlock,
    businessWorkspaceBoundaries,
    vlinkPipelineContext,
    graphBundlePipelineContext,
  } = input;

  const dashboardCtx =
    userContext.dashboardContext && typeof userContext.dashboardContext === 'object'
      ? (userContext.dashboardContext as Record<string, unknown>)
      : undefined;
  const ctx = query.context;
  const businessId =
    ctx.businessId && typeof ctx.businessId === 'string' && ctx.businessId.trim() ? ctx.businessId.trim() : undefined;
  const hasBusinessTenant = !!(dashboardCtx?.business ?? businessId);
  const hasHouseholdTenant = !!dashboardCtx?.household;

  const currentModule =
    (typeof ctx.currentModule === 'string' && ctx.currentModule) || userContext.currentFocus?.module;
  const scopeModules: string[] = Array.isArray(analysis?.scope?.modules) ? analysis.scope.modules : [];
  const usedModules = uniqueStrings([
    ...userContext.activeModules.map((m) => String(m)),
    ...scopeModules.map((m: string) => String(m)),
    ...(currentModule ? [String(currentModule)] : []),
  ]);

  const contextBlocks: AIAssembledContext['contextBlocks'] = [];
  const evidence: AIAssembledContext['evidence'] = [];
  const missingContext: string[] = [];
  const risks: string[] = [];
  const assumptions: string[] = [];

  assumptions.push('User intent was inferred from query wording using simple keyword heuristics.');

  const hasHistoryEarly =
    Array.isArray(query.conversationHistory) && query.conversationHistory.length > 0;
  const intentEarly = inferIntent(query.query);
  const structuredEarly =
    input.structuredResolution ??
    inferStructuredResponseMode({
      query: query.query,
      explicitMode: input.explicitStructuredMode,
      toneMode: input.toneMode,
      assembledIntent: intentEarly,
      isFollowUp: hasHistoryEarly,
      fileIds: ctx.fileIds,
      businessId,
      currentModule: typeof currentModule === 'string' ? currentModule : undefined,
      hasAttachedFiles: Boolean(attachedFiles && attachedFiles.length > 0),
    });
  const contextProfile = resolveContextProfile(structuredEarly.mode, {
    responseContract: structuredEarly.responseContract,
    requiresAuthoritativeContext: structuredEarly.requiresAuthoritativeContext,
  });

  if (attachedFiles && attachedFiles.length > 0) {
    const filePayload = attachedFiles.slice(0, MAX_ITEMS).map((f) => ({
      id: f.id,
      name: f.name,
      summary: f.summary ? truncateString(String(f.summary), 1500) : undefined,
    }));
    contextBlocks.push({
      title: 'Attached files (Drive)',
      sourceType: 'file',
      content: filePayload,
      priority: 'high',
    });
    for (const f of attachedFiles.slice(0, 20)) {
      evidence.push({
        label: `Attached file: ${f.name || f.id}`,
        sourceType: 'file',
        sourceId: f.id,
        detail: f.summary ? truncateString(String(f.summary), 500) : undefined,
        confidence: f.summary && f.summary.trim().length > 20 ? 'high' : 'medium',
      });
    }
  }

  contextBlocks.push({
    title: 'Active modules and current focus',
    sourceType: 'module',
    content: {
      activeModules: userContext.activeModules,
      currentFocus: userContext.currentFocus,
      currentModule: currentModule ?? null,
    },
    priority: contextProfile === 'conversation' ? 'medium' : 'high',
    tier: 'tier4_cross_module',
    inclusionReason:
      contextProfile === 'conversation'
        ? 'module focus — included only when query-relevant'
        : 'module focus baseline',
  });
  evidence.push({
    label: 'User module context (active modules & focus)',
    sourceType: 'module',
    detail: truncateString(JSON.stringify({ activeModules: userContext.activeModules, currentFocus: userContext.currentFocus })),
    confidence: 'medium',
  });

  const recentActivity = ctx.recentActivity;
  if (query.continuityState || query.activeTopic) {
    contextBlocks.push({
      title: 'Conversation continuity state',
      sourceType: 'chat',
      content: {
        continuityState: query.continuityState ?? null,
        activeTopic: query.activeTopic ?? null,
      },
      priority: 'high',
      tier: 'tier2_continuity',
      inclusionReason: 'carry forward active topic and user goal',
    });
    evidence.push({
      label: 'Continuity/topic state from prior turns',
      sourceType: 'chat',
      confidence: 'high',
    });
  }

  const history = query.conversationHistory;
  if (Array.isArray(history) && history.length > 0) {
    const historyLimit = contextProfile === 'conversation' ? 12 : 10;
    const perMessageChars = contextProfile === 'conversation' ? 1200 : 800;

    if (contextProfile === 'conversation') {
      const threadHints = buildConversationThreadHints({
        latestUserMessage: query.query,
        recentMessages: history.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: typeof m.content === 'string' ? m.content : String(m.content ?? ''),
          timestamp: m.timestamp,
        })),
        continuity:
          query.continuityState && typeof query.continuityState === 'object'
            ? (query.continuityState as import('../utils/conversationContinuity').ConversationContinuityState)
            : undefined,
        activeTopic:
          query.activeTopic && typeof query.activeTopic === 'object'
            ? (query.activeTopic as import('../utils/conversationContinuity').ActiveTopicState)
            : undefined,
      });
      contextBlocks.push({
        title: 'Active conversation thread',
        sourceType: 'chat',
        content: {
          threadSummary: threadHints.threadSummary,
          momentum: threadHints.momentum,
          narrowingConstraints: threadHints.narrowingConstraints,
          lastAssistantMessage: threadHints.lastAssistantMessage
            ? truncateString(threadHints.lastAssistantMessage, 600)
            : undefined,
          priorPlaceSuggestions: threadHints.priorPlaceSuggestions,
        },
        priority: 'high',
        tier: 'tier1_recent_conversation',
        inclusionReason: 'conversation momentum and thread summary for follow-up turns',
      });
    }

    contextBlocks.push({
      title: 'Conversation history (excerpt)',
      sourceType: 'chat',
      content: history.slice(-historyLimit).map((m) => ({
        role: m.role,
        content: typeof m.content === 'string' ? truncateString(m.content, perMessageChars) : m.content,
      })),
      priority: 'high',
      tier: 'tier1_recent_conversation',
      inclusionReason: 'maintain recent conversational continuity',
    });
    evidence.push({
      label: 'Prior messages in this conversation',
      sourceType: 'chat',
      detail: `${history.length} message(s)`,
      confidence: 'high',
    });
  }

  if (Array.isArray(recentActivity) && recentActivity.length > 0) {
    contextBlocks.push({
      title: 'Recent activity (request context)',
      sourceType: 'system',
      content: recentActivity.slice(0, 20),
      priority: 'medium',
      tier: 'tier4_cross_module',
      inclusionReason: 'request-supplied recent activity context',
    });
    evidence.push({
      label: 'Recent activity items supplied with the request',
      sourceType: 'system',
      detail: `${recentActivity.length} item(s)`,
      confidence: 'medium',
    });
    const calendarSlice = recentActivity
      .filter((item) => {
        if (!item || typeof item !== 'object') return false;
        const o = item as Record<string, unknown>;
        const mod = o.module != null ? String(o.module).toLowerCase() : '';
        const typ = o.type != null ? String(o.type).toLowerCase() : '';
        return mod.includes('calendar') || typ.includes('calendar') || typ.includes('event');
      })
      .slice(0, 15);
    if (calendarSlice.length > 0) {
      contextBlocks.push({
        title: 'Calendar-related activity (from recent activity)',
        sourceType: 'calendar',
        content: calendarSlice,
        priority: 'medium',
        tier: 'tier4_cross_module',
        inclusionReason: 'calendar relevance from activity context',
      });
      evidence.push({
        label: 'Calendar-tagged items in recent activity',
        sourceType: 'calendar',
        detail: `${calendarSlice.length} item(s)`,
        confidence: 'medium',
      });
    }
  }

  const insightsForAssembly = (userContext.crossModuleInsights || []).filter((i) => {
    if (isSyntheticInsight(i) && !isSyntheticContextEnabled()) {
      return false;
    }
    if (contextProfile === 'conversation' && isSyntheticInsight(i)) {
      return false;
    }
    return true;
  });

  if (insightsForAssembly.length) {
    contextBlocks.push({
      title: 'Cross-module insights',
      sourceType: 'module',
      content: insightsForAssembly.slice(0, 15).map((i) => ({
        title: i.title,
        description: truncateString(i.description, 500),
        modules: i.modules,
      })),
      priority: 'medium',
      tier: 'tier4_cross_module',
      inclusionReason: 'cross-module insights for broader context',
    });
    evidence.push({
      label: 'Cross-module insights from context engine',
      sourceType: 'module',
      detail: `${insightsForAssembly.length} insight(s)`,
      confidence: 'medium',
    });
  }

  if (userContext.patterns?.length) {
    contextBlocks.push({
      title: 'Observed patterns',
      sourceType: 'module',
      content: userContext.patterns.slice(0, 15).map((p) => ({
        pattern: p.pattern,
        modules: p.modules,
        confidence: p.confidence,
      })),
      priority: 'low',
      tier: 'tier3_profile',
      inclusionReason: 'persistent user behavior patterns',
    });
    evidence.push({
      label: 'Behavioral/context patterns',
      sourceType: 'module',
      detail: `${userContext.patterns.length} pattern(s)`,
      confidence: 'medium',
    });
  }

  const smartPatterns = smartAnalysis && typeof smartAnalysis === 'object' ? (smartAnalysis as Record<string, unknown>).patterns : undefined;
  const smartPredictions = smartAnalysis && typeof smartAnalysis === 'object' ? (smartAnalysis as Record<string, unknown>).predictions : undefined;
  if ((Array.isArray(smartPatterns) && smartPatterns.length > 0) || (Array.isArray(smartPredictions) && smartPredictions.length > 0)) {
    contextBlocks.push({
      title: 'Smart pattern analysis',
      sourceType: 'system',
      content: { patterns: smartPatterns ?? [], predictions: smartPredictions ?? [] },
      priority: 'medium',
    });
    evidence.push({
      label: 'Smart pattern engine output',
      sourceType: 'system',
      confidence: 'medium',
    });
  }

  if (semanticEnhancement && typeof semanticEnhancement === 'object') {
    const se = semanticEnhancement as Record<string, unknown>;
    contextBlocks.push({
      title: 'Semantic enhancement',
      sourceType: 'system',
      content: {
        relatedQueries: se.relatedQueries,
        suggestedCategories: se.suggestedCategories,
        confidenceBoost: se.confidenceBoost,
      },
      priority: 'low',
    });
    evidence.push({
      label: 'Semantic query enhancement',
      sourceType: 'system',
      confidence: 'low',
    });
  }

  if (Array.isArray(recalledMessages) && recalledMessages.length > 0) {
    contextBlocks.push({
      title: 'Recalled prior messages (semantic)',
      sourceType: 'chat',
      content: recalledMessages.map((m) => ({
        role: m.role,
        snippet: truncateString(m.contentSnippet, 500),
        conversationId: m.conversationId,
        similarity: Math.round(m.similarity * 100) / 100,
      })),
      priority: 'high',
      tier: 'tier2_continuity',
      inclusionReason: 'explicit recall intent matched indexed messages',
    });
    evidence.push({
      label: 'Semantic message recall',
      sourceType: 'chat',
      detail: `${recalledMessages.length} chunk(s)`,
      confidence: 'high',
    });
  }

  let memoryAssemblyStats: { factsLoaded: number; factsInjected: number } | undefined;

  if (Array.isArray(userMemoryFacts) && userMemoryFacts.length > 0) {
    const prepared = prepareMemoryFactsForAssembly(userMemoryFacts, truncateString);
    memoryAssemblyStats = {
      factsLoaded: userMemoryFacts.length,
      factsInjected: prepared.items.length,
    };
    const explicitItems = prepared.items.filter((i) => i.injectionTier === 'explicit');
    const inferredItems = prepared.items.filter((i) => i.injectionTier === 'inferred');

    if (explicitItems.length > 0) {
      contextBlocks.push({
        title: 'User memory facts (saved by you)',
        sourceType: 'personal',
        content: explicitItems.map((f) => ({
          id: f.id,
          subject: f.subject,
          fact: f.fact,
          confidence: f.confidence,
          sourceType: f.sourceType,
          isExplicit: true,
          injectionTier: 'explicit' as const,
        })),
        priority: 'high',
        tier: 'tier3_profile',
        inclusionReason: 'explicit user memory — always included when retrieved',
      });
    }

    if (inferredItems.length > 0) {
      contextBlocks.push({
        title: 'User memory facts (inferred)',
        sourceType: 'personal',
        content: inferredItems.map((f) => ({
          id: f.id,
          subject: f.subject,
          fact: f.fact,
          confidence: f.confidence,
          sourceType: f.sourceType,
          isExplicit: false,
          injectionTier: 'inferred' as const,
        })),
        priority: 'medium',
        tier: 'tier3_profile',
        inclusionReason: 'inferred memory — confidence at or above retrieval threshold',
      });
    }

    if (prepared.items.length > 0) {
      evidence.push({
        label: 'Stored user memory facts',
        sourceType: 'personal',
        detail: `${prepared.explicitCount} explicit, ${prepared.inferredCount} inferred`,
        confidence: 'high',
      });
    }
  }

  if (Array.isArray(recentConversationMemory) && recentConversationMemory.length > 0) {
    const withSummary = recentConversationMemory.filter((c) => c.threadSummary && c.threadSummary.trim());
    if (withSummary.length > 0) {
      contextBlocks.push({
        title: 'Recent conversations (other threads)',
        sourceType: 'chat',
        content: withSummary.slice(0, 5).map((c) => ({
          conversationId: c.id,
          title: c.title,
          summary: truncateString(String(c.threadSummary), 600),
          lastMessageAt: c.lastMessageAt,
        })),
        priority: contextProfile === 'conversation' ? 'high' : 'medium',
        tier: 'tier2_continuity',
        inclusionReason: 'cross-session thread summaries for recall',
      });
      evidence.push({
        label: 'Prior thread summaries',
        sourceType: 'chat',
        detail: `${withSummary.length} conversation(s)`,
        confidence: 'medium',
      });
    }

    const topicsOnly = recentConversationMemory.filter(
      (c) => (!c.threadSummary || !c.threadSummary.trim()) && c.topics
    );
    if (topicsOnly.length > 0) {
      contextBlocks.push({
        title: 'Recent conversation topics (other threads)',
        sourceType: 'chat',
        content: topicsOnly.slice(0, 5).map((c) => {
          const t = c.topics;
          return {
            conversationId: c.id,
            title: c.title,
            activeTopic: t?.activeTopic?.label ?? null,
            domain: t?.activeTopic?.domain ?? null,
            entities: t?.activeTopic?.entities?.slice(0, 8) ?? [],
            narrowingConstraints: t?.continuityState?.narrowingConstraints ?? [],
            lastAssistantSummary: t?.continuityState?.lastAssistantTurnSummary
              ? truncateString(t.continuityState.lastAssistantTurnSummary, 400)
              : undefined,
          };
        }),
        priority: contextProfile === 'conversation' ? 'high' : 'medium',
        tier: 'tier2_continuity',
        inclusionReason: 'cross-session topic state when thread summary not yet rolled up',
      });
    }
  }

  const moduleContextEntries = normalizeModuleContexts(rawModuleContexts).filter(
    (entry) => entry.moduleId !== 'vlink'
  );
  const moduleBlocksLoaded = Math.min(moduleContextEntries.length, MAX_ITEMS);
  for (const entry of moduleContextEntries.slice(0, MAX_ITEMS)) {
    const label = entry.moduleName || entry.moduleId;
    const priority: 'low' | 'medium' | 'high' =
      entry.relevance === 'high' ? 'high' : entry.relevance === 'medium' ? 'medium' : 'medium';
    contextBlocks.push({
      title: `Module live context: ${label}`,
      sourceType: 'module',
      content: compressContextContent(entry.data),
      priority,
      tier: contextProfile === 'conversation' ? 'tier4_cross_module' : 'tier3_profile',
      inclusionReason: `live context from ${entry.moduleId}${entry.providerName ? `.${entry.providerName}` : ''}`,
    });
    evidence.push({
      label: `Live module data: ${label}`,
      sourceType: 'module',
      sourceId: entry.moduleId,
      detail: entry.providerName ? `provider ${entry.providerName}` : undefined,
      confidence: entry.relevance === 'high' ? 'high' : 'medium',
    });
  }

  if (vlinkPipelineContext && vlinkPipelineContext.vlinksUsed > 0) {
    contextBlocks.push({
      title: 'V_Link Relationships (confirmed)',
      sourceType: 'vlink',
      content: {
        vlinks: vlinkPipelineContext.items.map((item) => ({
          vlinkId: item.vlinkId,
          publicCode: item.publicCode,
          title: item.title,
          scope: item.scope,
          parentVLinkId: item.parentVLinkId,
          updatedAt: item.updatedAt,
          accessibleLinkedEntities: item.linkedEntities
            .filter((e) => e.access === 'full')
            .slice(0, 8)
            .map((e) => ({
              entityType: e.entityType,
              entityId: e.entityId,
              moduleId: e.moduleId,
              title: e.title,
              url: e.url,
            })),
          restrictedLinkedEntityCount: item.restrictedLinkedEntityCount,
        })),
        suggestionsIgnored: vlinkPipelineContext.suggestionsIgnored,
      },
      priority: 'high',
      tier: 'tier4_cross_module',
      inclusionReason: 'confirmed V_Link relationships (permission-filtered; unapproved suggestions excluded)',
    });
    evidence.push({
      label: 'V_Link Relationships',
      sourceType: 'vlink',
      sourceId: 'vlink',
      detail: `${vlinkPipelineContext.vlinksUsed} vlink(s); ${vlinkPipelineContext.accessibleLinkedEntities} accessible linked entity reference(s); ${vlinkPipelineContext.restrictedLinkedEntities} restricted`,
      confidence: 'high',
    });
  } else if (vlinkPipelineContext?.skippedReason === 'source_disabled') {
    missingContext.push('V_Link context source disabled in pipeline catalog');
  }

  const pipelineConsumerIntent = resolvePipelineConsumerIntent(rawModuleContexts);
  const neighborhoodConsumer = resolveNeighborhoodConsumer(pipelineConsumerIntent);
  const graphNeighborhoods = neighborhoodsFromGraphContext(
    graphBundlePipelineContext,
    neighborhoodConsumer
  );
  const useNeighborhoodBlock = shouldConsumeNeighborhoodsDirectly(
    pipelineConsumerIntent,
    graphBundlePipelineContext
  );

  if (useNeighborhoodBlock && graphNeighborhoods.length > 0) {
    const neighborhoodContent = buildNeighborhoodAssemblyContent(
      graphNeighborhoods,
      neighborhoodConsumer,
      graphBundlePipelineContext?.knowledgeBundles
    );
    contextBlocks.push({
      title: 'Knowledge Neighborhood (connected understanding)',
      sourceType: 'graph_bundle',
      content: neighborhoodContent,
      priority: 'high',
      tier: 'tier4_cross_module',
      inclusionReason:
        'canonical Knowledge Neighborhood read model — summary, facts, relationships, activity, history, confidence, provenance (no manual bundle reconstruction)',
    });
    evidence.push({
      label: 'Knowledge Neighborhood',
      sourceType: 'graph_bundle',
      sourceId: 'knowledge_neighborhood',
      detail: `${neighborhoodContent.cards.length} neighborhood card(s); ${neighborhoodContent.serviceDiagnostics.relationshipCount} relationship(s); ${neighborhoodContent.serviceDiagnostics.factCount} fact(s)`,
      confidence: 'high',
    });
  } else if (graphBundlePipelineContext && graphBundlePipelineContext.bundlesUsed > 0) {
    contextBlocks.push({
      title: 'Context Graph Bundles (formal)',
      sourceType: 'graph_bundle',
      content: {
        contractVersion: '1.0',
        bundles: graphBundlePipelineContext.groundingPayloads.map((payload) => ({
          bundleId: payload.bundleId,
          kind: payload.kind,
          root: payload.root,
          summaries: payload.summaries,
          permissionOutcome: payload.permissionOutcome,
          provenance: payload.provenance,
          nodes: payload.nodes.slice(0, 12),
          edges: payload.edges.slice(0, 12),
          estimatedTokens: payload.estimatedTokens,
        })),
        totalNodes: graphBundlePipelineContext.totalNodes,
        totalRestrictedNodes: graphBundlePipelineContext.totalRestrictedNodes,
        totalOmittedNodes: graphBundlePipelineContext.totalOmittedNodes,
      },
      priority: 'high',
      tier: 'tier4_cross_module',
      inclusionReason:
        'formal ContextBundleDescriptor from Tier 0 Context Graph provider (read-only; PE at every hop)',
    });
    evidence.push({
      label: 'Context Graph Bundles',
      sourceType: 'graph_bundle',
      sourceId: 'graph_bundle',
      detail: `${graphBundlePipelineContext.bundlesUsed} bundle(s); ${graphBundlePipelineContext.totalNodes} node(s); ${graphBundlePipelineContext.estimatedTokens} est. tokens`,
      confidence: 'high',
    });
  } else if (graphBundlePipelineContext?.skippedReason === 'source_disabled') {
    missingContext.push('Context Graph bundle source disabled in pipeline catalog');
  }

  if (
    crossModuleSynthesis?.dataBacked &&
    crossModuleSynthesis.modulesIncluded.length >= 2 &&
    crossModuleSynthesis.bulletPoints.length > 0
  ) {
    contextBlocks.push({
      title: 'Cross-module summary',
      sourceType: 'module',
      content: {
        summary: crossModuleSynthesis.summary,
        bulletPoints: crossModuleSynthesis.bulletPoints.slice(0, 15),
        modulesIncluded: crossModuleSynthesis.modulesIncluded,
        linkedPeople: crossModuleSynthesis.linkedEntities.linkedPeople.map((p) => ({
          name: p.name,
          modules: p.modules,
        })),
        linkedFiles: crossModuleSynthesis.linkedEntities.linkedFiles.map((f) => ({
          fileId: f.fileId,
          fileName: f.fileName,
          modules: f.modules,
        })),
      },
      priority: 'high',
      tier: 'tier4_cross_module',
      inclusionReason: 'data-backed synthesis from live module contexts and entity links',
    });
    evidence.push({
      label: 'Cross-module synthesis',
      sourceType: 'module',
      detail: `${crossModuleSynthesis.modulesIncluded.length} module(s); ${crossModuleSynthesis.linkedEntities.links.length} entity link(s)`,
      confidence: 'high',
    });
  }

  if (businessWorkspaceBoundaries) {
    contextBlocks.push({
      title: BUSINESS_WORKSPACE_POLICY_BLOCK_TITLE,
      sourceType: 'business',
      content: {
        businessId: businessWorkspaceBoundaries.businessId,
        businessName: businessWorkspaceBoundaries.businessName,
        securityLevel: businessWorkspaceBoundaries.securityLevel,
        complianceMode: businessWorkspaceBoundaries.complianceMode,
        policies: businessWorkspaceBoundaries.policyLines,
        voiceHints: businessWorkspaceBoundaries.businessVoiceHints,
      },
      priority: 'high',
      tier: 'tier2_continuity',
      inclusionReason: 'business workspace AI configuration (admin-controlled; not personal Control Center)',
    });
    evidence.push({
      label: BUSINESS_WORKSPACE_POLICY_BLOCK_TITLE,
      sourceType: 'business',
      sourceId: businessWorkspaceBoundaries.businessId,
      detail: businessWorkspaceBoundaries.businessName,
      confidence: 'high',
    });
  }

  if (effectivePreferencesContextBlock) {
    contextBlocks.push({
      title: PREFERENCE_CONTEXT_BLOCK_TITLE,
      sourceType: 'personal',
      content: effectivePreferencesContextBlock,
      priority: 'high',
      tier: 'tier3_profile',
      inclusionReason: businessWorkspaceBoundaries
        ? 'personal communication preferences (business policies apply separately above)'
        : 'resolved communication and action-boundary preferences',
    });
    evidence.push({
      label: 'User communication and AI preference settings',
      sourceType: 'personal',
      confidence: 'high',
    });
  }

  if (userDefinedContext && userDefinedContext.length > 0) {
    contextBlocks.push({
      title: 'User-defined AI context',
      sourceType: 'personal',
      content: userDefinedContext.slice(0, 10).map((c) => ({
        title: c.title,
        scope: c.scope,
        moduleId: c.moduleId,
        content: typeof c.content === 'string' ? truncateString(c.content, 2000) : c.content,
      })),
      priority: 'high',
      tier: 'tier3_profile',
      inclusionReason: 'explicit user-defined preferences/instructions',
    });
    evidence.push({
      label: 'User-defined context entries',
      sourceType: 'personal',
      detail: `${userDefinedContext.length} entries`,
      confidence: 'high',
    });
  }

  if (globalPatterns && globalPatterns.length > 0) {
    contextBlocks.push({
      title: 'Collective learning patterns',
      sourceType: 'system',
      content: globalPatterns.slice(0, 8),
      priority: 'low',
      tier: 'tier4_cross_module',
      inclusionReason: 'collective patterns when relevant',
    });
    evidence.push({
      label: 'Global/collective patterns',
      sourceType: 'system',
      confidence: 'low',
    });
  }

  if (hasBusinessTenant) {
    contextBlocks.push({
      title: 'Business workspace scope',
      sourceType: 'business',
      content: {
        businessId: businessId ?? null,
        dashboardBusinessPresent: !!dashboardCtx?.business,
      },
      priority: 'high',
      tier: 'tier4_cross_module',
      inclusionReason: 'tenant isolation and scope guardrail',
    });
    evidence.push({
      label: 'Business tenant context',
      sourceType: 'business',
      sourceId: businessId,
      confidence: businessId ? 'medium' : 'low',
    });
  }

  if (hasHouseholdTenant) {
    contextBlocks.push({
      title: 'Household scope',
      sourceType: 'personal',
      content: { householdPresent: true },
      priority: 'medium',
      tier: 'tier4_cross_module',
      inclusionReason: 'household tenant scope context',
    });
    evidence.push({
      label: 'Household dashboard context',
      sourceType: 'personal',
      confidence: 'medium',
    });
  }


  const queryMentionsFile = /\b(file|files|document|pdf|attachment|drive|upload|spreadsheet)\b/i.test(query.query);
  const hasFiles = !!(attachedFiles && attachedFiles.length > 0);
  if (queryMentionsFile && !hasFiles) {
    missingContext.push('The query references files or documents, but no file attachments were provided with this request.');
    risks.push('Answer may lack file-grounded evidence unless content exists elsewhere in context.');
  }

  if (!currentModule && usedModules.length <= 1 && (userContext.activeModules?.length ?? 0) <= 1) {
    missingContext.push('No specific module context was supplied beyond defaults.');
  }

  if (hasBusinessTenant && businessId && !dashboardCtx?.business) {
    missingContext.push('Business scope is indicated (businessId) but rich business dashboard payload was not included in assembled blocks.');
    risks.push('Business-specific data may be incomplete; prefer confirming against live business workspace data.');
  }

  const genericInsights =
    !userContext.crossModuleInsights?.length &&
    !userContext.patterns?.length &&
    (!smartPatterns || !Array.isArray(smartPatterns) || smartPatterns.length === 0);
  if (genericInsights && !hasFiles) {
    risks.push('Context is mostly high-level; detailed module or file data may be limited.');
  }

  const sourceCount = countDistinctContextSources(contextBlocks);
  let scope: AIAssembledContext['scope'];
  if (sourceCount >= 2 || usedModules.length >= 2 || scopeModules.length >= 2) {
    scope = 'cross_module';
  } else if (hasBusinessTenant) {
    scope = 'business';
  } else if (hasHouseholdTenant) {
    scope = 'household';
  } else {
    scope = 'personal';
  }

  const intent = intentEarly;
  const structuredResponseMode = structuredEarly.mode;
  const responseDensity = structuredEarly.responseDensity;

  const compressedBlocks = contextBlocks.map((block) => ({
    ...block,
    tier: inferTierForBlock(block),
    inclusionReason: block.inclusionReason ?? 'context block selected for provider prompt',
    content: compressBlockContent(block),
  }));

  void logger.debug('[AI_CONTEXT_COMPRESSION]', {
    totalBlocks: compressedBlocks.length,
  });

  const scoredForProfile = compressedBlocks.map((b) => {
    let relevanceScore = scoreContextBlock({
      queryText: query.query,
      block: b,
      currentModule: currentModule || undefined,
    });
    if (contextProfile === 'conversation') {
      const title = (b.title || '').toLowerCase();
      if (title.includes('conversation history') || title.includes('active conversation thread')) {
        relevanceScore += 45;
      }
      if (title.includes('continuity')) {
        relevanceScore += 30;
      }
    }
    return { ...b, relevanceScore };
  });

  const profileApplied = applyContextProfile({
    profile: contextProfile,
    queryText: query.query,
    blocks: scoredForProfile,
  });

  void logger.debug('[AI_CONTEXT_PROFILE]', {
    contextProfile,
    structuredResponseMode,
    contextBlockCount: profileApplied.blocks.length,
    includedContextTitles: profileApplied.includedTitles,
    excludedContextTitles: profileApplied.excludedTitles,
  });

  const rankedContextBlocks = rankContextBlocksForProvider(
    profileApplied.blocks,
    query.query,
    currentModule || undefined,
    contextProfile
  );

  const contextBudget = contextBudgetTokensForProfile(contextProfile);

  const budgetResult = applyContextBudget({
    blocks: rankedContextBlocks,
    maxEstimatedTokens: contextBudget,
    alwaysKeepHighPriority: contextProfile !== 'conversation',
  });
  const budgetedContextBlocks = budgetResult.injectedBlocks;
  const tokensUsedEstimate = budgetResult.totalTokensUsed;

  const matchedHighRelevance =
    typeof analysis?.matchedModules === 'undefined'
      ? moduleContextEntries.filter((e) => e.relevance === 'high').length
      : Array.isArray(analysis?.matchedModules)
        ? (analysis.matchedModules as Array<{ relevance?: string }>).filter(
            (m) => m.relevance === 'high'
          ).length
        : moduleContextEntries.length;

  return {
    scope,
    intent,
    structuredResponseMode,
    responseDensity,
    currentModule: currentModule || undefined,
    usedModules,
    evidence,
    contextBlocks: budgetedContextBlocks,
    contextAvailability: budgetResult.contextAvailability,
    assumptions,
    risks,
    missingContext,
    assemblyMetrics: {
      blocksLoaded: compressedBlocks.length,
      blocksAfterProfile: profileApplied.blocks.length,
      blocksRanked: rankedContextBlocks.length,
      blocksInjected: budgetedContextBlocks.length,
      profileExcludedCount: profileApplied.excludedTitles.length,
      contextBudgetTokens: contextBudget,
      tokensUsedEstimate,
      blocksDropped: budgetResult.droppedBlocks.length,
      moduleContextsLoaded: moduleContextEntries.length,
      moduleBlocksLoaded,
      matchedHighRelevance,
      memoryFactsLoaded: memoryAssemblyStats?.factsLoaded ?? 0,
      memoryFactsInjected: memoryAssemblyStats?.factsInjected ?? 0,
      recalledMessagesLoaded: Array.isArray(recalledMessages) ? recalledMessages.length : 0,
    },
  };
}
