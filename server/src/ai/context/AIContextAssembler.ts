/**
 * Conservative context assembly for AI providers: structured, evidence-aware view
 * of what is being sent to the model (additive; does not replace raw prompts).
 */

import type { UserContext } from './CrossModuleContextEngine';
import { logger } from '../../lib/logger';

/** Mirrors fields used from `LifeTwinQuery` without importing core (avoids circular deps). */
export interface AIContextAssemblyQuery {
  query: string;
  userId: string;
  context: Record<string, unknown>;
  conversationHistory?: Array<{ role: string; content: string; timestamp?: Date | string }>;
}

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
  | 'system'
  | 'unknown';

export interface AIAssembledContext {
  scope: 'personal' | 'business' | 'household' | 'cross_module';
  intent?: 'answer' | 'summary' | 'analysis' | 'recommendation' | 'action_plan' | 'comparison' | 'status_update';
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
    /** Set after relevance ranking (debug / tuning). */
    relevanceScore?: number;
    /** Estimated tokens for this block after budgeting (debug / tuning). */
    budgetTokensEstimate?: number;
  }>;
  assumptions: string[];
  risks: string[];
  missingContext: string[];
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
  currentModule?: string
): AIAssembledContext['contextBlocks'] {
  const totalBlocksBefore = blocks.length;
  const scored = blocks.map((b) => ({
    ...b,
    relevanceScore: scoreContextBlock({ queryText, block: b, currentModule }),
  }));
  scored.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

  const highs = scored.filter((b) => b.priority === 'high');
  const others = scored.filter((b) => b.priority !== 'high');
  const out: typeof scored = [...highs];
  for (const b of others) {
    if (out.length >= MAX_CONTEXT_BLOCKS_AFTER_RANK) break;
    out.push(b);
  }

  void logger.debug('[AI_CONTEXT_RELEVANCE]', {
    totalBlocksBefore,
    totalBlocksAfter: out.length,
    topBlocks: scored.slice(0, 5).map((b) => ({
      title: b.title,
      sourceType: b.sourceType,
      priority: b.priority,
      score: b.relevanceScore,
    })),
  });

  return out;
}

function blockPayloadForTokenEstimate(b: AIAssembledContext['contextBlocks'][number]): Record<string, unknown> {
  return {
    title: b.title,
    sourceType: b.sourceType,
    priority: b.priority,
    content: b.content,
    relevanceScore: b.relevanceScore,
  };
}

/**
 * Cheap deterministic size proxy (~4 chars per token).
 */
export function estimateTokenCount(value: unknown): number {
  try {
    const s = typeof value === 'string' ? value : JSON.stringify(value);
    return Math.ceil(s.length / 4);
  } catch {
    return 0;
  }
}

function estimateBlockTokens(b: AIAssembledContext['contextBlocks'][number]): number {
  return estimateTokenCount(blockPayloadForTokenEstimate(b));
}

/**
 * Trim ranked blocks to an estimated token budget; highs kept even if over budget.
 */
export function applyContextBudget(input: {
  blocks: AIAssembledContext['contextBlocks'];
  maxEstimatedTokens: number;
}): AIAssembledContext['contextBlocks'] {
  const { blocks, maxEstimatedTokens } = input;
  const blocksBefore = blocks.length;
  const keptIndices = new Set<number>();

  let totalTokens = 0;

  const highEntries = blocks.map((b, i) => ({ b, i })).filter(({ b }) => b.priority === 'high');
  const restEntries = blocks.map((b, i) => ({ b, i })).filter(({ b }) => b.priority !== 'high');

  for (const { b, i } of highEntries) {
    keptIndices.add(i);
    totalTokens += estimateBlockTokens(b);
  }

  for (const { b, i } of restEntries) {
    const cost = estimateBlockTokens(b);
    if (totalTokens + cost <= maxEstimatedTokens) {
      keptIndices.add(i);
      totalTokens += cost;
    }
  }

  const typesInRanked = [...new Set(blocks.map((bl) => bl.sourceType))];
  const typesInKept = new Set([...keptIndices].map((idx) => blocks[idx].sourceType));
  const missingTypes = typesInRanked.filter((t) => !typesInKept.has(t));

  const smallestPerMissingType: Array<{ b: AIAssembledContext['contextBlocks'][number]; idx: number }> =
    [];
  for (const st of missingTypes) {
    const candidates = blocks
      .map((b, idx) => ({ b, idx }))
      .filter(({ b, idx }) => b.sourceType === st && !keptIndices.has(idx))
      .sort((a, c) => estimateBlockTokens(a.b) - estimateBlockTokens(c.b));
    const first = candidates[0];
    if (first) smallestPerMissingType.push(first);
  }
  smallestPerMissingType.sort((a, c) => estimateBlockTokens(a.b) - estimateBlockTokens(c.b));

  for (const pick of smallestPerMissingType) {
    const cost = estimateBlockTokens(pick.b);
    if (totalTokens + cost <= maxEstimatedTokens) {
      keptIndices.add(pick.idx);
      totalTokens += cost;
    }
  }

  const result: AIAssembledContext['contextBlocks'] = blocks
    .map((b, idx) => ({ b, idx }))
    .filter(({ idx }) => keptIndices.has(idx))
    .map(({ b }) => {
      const budgetTokensEstimate = estimateBlockTokens(b);
      return { ...b, budgetTokensEstimate };
    });

  const estimatedTokensKept = result.reduce((sum, b) => sum + (b.budgetTokensEstimate ?? 0), 0);

  void logger.debug('[AI_CONTEXT_BUDGET]', {
    maxEstimatedTokens,
    blocksBefore,
    blocksAfter: result.length,
    estimatedTokensKept,
  });

  return result;
}

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

function inferIntent(queryText: string): AIAssembledContext['intent'] {
  const q = queryText.toLowerCase();
  if (/\b(summarize|summary|tldr|tl;dr)\b/.test(q)) return 'summary';
  if (/\b(analyze|analysis|why\b|issue|pattern)\b/.test(q)) return 'analysis';
  if (/\b(recommend|should i|next step|suggest)\b/.test(q)) return 'recommendation';
  if (/\b(plan|steps|roadmap|how do i)\b/.test(q)) return 'action_plan';
  if (/\b(compare|versus|vs\.?|difference)\b/.test(q)) return 'comparison';
  if (/\b(status|update|progress)\b/.test(q)) return 'status_update';
  return 'answer';
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
export function assembleAIContext(input: AIContextAssemblyInput): AIAssembledContext {
  const { query, userContext, analysis, attachedFiles, smartAnalysis, semanticEnhancement, userDefinedContext, globalPatterns } =
    input;

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
    priority: 'high',
  });
  evidence.push({
    label: 'User module context (active modules & focus)',
    sourceType: 'module',
    detail: truncateString(JSON.stringify({ activeModules: userContext.activeModules, currentFocus: userContext.currentFocus })),
    confidence: 'medium',
  });

  const recentActivity = ctx.recentActivity;
  if (Array.isArray(recentActivity) && recentActivity.length > 0) {
    contextBlocks.push({
      title: 'Recent activity (request context)',
      sourceType: 'system',
      content: recentActivity.slice(0, 20),
      priority: 'medium',
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
      });
      evidence.push({
        label: 'Calendar-tagged items in recent activity',
        sourceType: 'calendar',
        detail: `${calendarSlice.length} item(s)`,
        confidence: 'medium',
      });
    }
  }

  if (userContext.crossModuleInsights?.length) {
    contextBlocks.push({
      title: 'Cross-module insights',
      sourceType: 'module',
      content: userContext.crossModuleInsights.slice(0, 15).map((i) => ({
        title: i.title,
        description: truncateString(i.description, 500),
        modules: i.modules,
      })),
      priority: 'medium',
    });
    evidence.push({
      label: 'Cross-module insights from context engine',
      sourceType: 'module',
      detail: `${userContext.crossModuleInsights.length} insight(s)`,
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
    });
    evidence.push({
      label: 'Household dashboard context',
      sourceType: 'personal',
      confidence: 'medium',
    });
  }

  const history = query.conversationHistory;
  if (Array.isArray(history) && history.length > 0) {
    contextBlocks.push({
      title: 'Conversation history (excerpt)',
      sourceType: 'chat',
      content: history.slice(-10).map((m) => ({
        role: m.role,
        content: typeof m.content === 'string' ? truncateString(m.content, 800) : m.content,
      })),
      priority: 'medium',
    });
    evidence.push({
      label: 'Prior messages in this conversation',
      sourceType: 'chat',
      detail: `${history.length} message(s)`,
      confidence: 'high',
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

  const intent = inferIntent(query.query);

  const compressedBlocks = contextBlocks.map((block) => ({
    ...block,
    content: compressBlockContent(block),
  }));

  void logger.debug('[AI_CONTEXT_COMPRESSION]', {
    totalBlocks: compressedBlocks.length,
  });

  const rankedContextBlocks = rankContextBlocksForProvider(
    compressedBlocks,
    query.query,
    currentModule || undefined
  );

  const budgetedContextBlocks = applyContextBudget({
    blocks: rankedContextBlocks,
    maxEstimatedTokens: DEFAULT_CONTEXT_BUDGET_ESTIMATED_TOKENS,
  });

  return {
    scope,
    intent,
    currentModule: currentModule || undefined,
    usedModules,
    evidence,
    contextBlocks: budgetedContextBlocks,
    assumptions,
    risks,
    missingContext,
  };
}
