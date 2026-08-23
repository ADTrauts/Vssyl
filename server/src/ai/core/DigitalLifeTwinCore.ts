import { PrismaClient } from '@prisma/client';
import { CrossModuleContextEngine, UserContext, CrossModuleInsight } from '../context/CrossModuleContextEngine';
import { PersonalityEngine } from './PersonalityEngine';
import { DecisionEngine } from './DecisionEngine';
import { AdvancedLearningEngine } from '../learning/AdvancedLearningEngine';
import { userLearningSignalService } from '../../services/userLearningSignalService';
import { collectModulesReferenced } from '../learning/learningSignalTypes';
import { ActionExecutor } from './ActionExecutor';
import { SmartPatternEngine } from '../intelligence/SmartPatternEngine';
import { CentralizedLearningEngine } from '../learning/CentralizedLearningEngine';
import { userAllowsCollectiveLearning } from '../learning/collectiveLearningConsent';
import {
  buildContextDensityReport,
  buildOrchestrationDiagnosticsFromQueryContext,
  toContextDensitySummary,
  type ProviderFetchAttempt,
} from '../context/contextDensityReport';
import { appendOrchestrationSnapshot } from '../context/orchestrationSnapshot';
import type { AIOrchestrationSnapshot } from '../../../../shared/src/types/ai-orchestration-snapshot';
import { randomUUID } from 'crypto';
import { prisma as sharedPrisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import type { StructuredAIResponse } from '../types/structuredResponse';
import type { FileIssue } from '../types/fileIssues';
import { getMessageForCode } from '../types/fileIssues';
import { executeGovernedTool } from '../governance/governedToolExecutor';
import { fetchAccessibleActiveFiles } from '../../services/driveVisibilityService';
import { AI_TOOL_DEFINITIONS } from '../tools/toolDefinitions';
import type { AIToolName } from '../tools/toolDefinitions';
import { getModel } from '../providers/modelCatalog';
import { resolveAIProvider } from '../providers/aiProviderFactory';
import {
  finalizeRoutingEffectiveProvider,
  resolveLlmFallback,
  resolveVisionModelForProvider,
  selectLlmProvider,
} from '../providers/providerRouting';
import { assembleAIContext } from '../context/AIContextAssembler';
import type { AIAssembledContext } from '../context/AIContextAssembler';
import {
  synthesizeCrossModuleContext,
  type ContextSynthesisResult,
} from '../context/ContextSynthesisService';
import {
  buildConnectionsFromEntityLinks,
  linkEntitiesAcrossModules,
  type EntityLinkingResult,
} from '../context/entityLinking';
import {
  fetchVLinkPipelineContext,
  toPersistedVLinksForEntityLinking,
  type VLinkPipelineContextResult,
} from '../context/vlinkPipelineContextService';
import { isSyntheticContextEnabled } from '../context/syntheticContextPolicy';
import { validateAIResponseQuality } from '../utils/validateAIResponseQuality';
import {
  buildConversationThreadHints,
  updateConversationContinuityState,
  type ConversationContinuityState,
  type ActiveTopicState,
} from '../utils/conversationContinuity';
import { runConversationReasoning } from '../conversation/conversationReasoningLayer';
import type { ConversationReasoningResult } from '../conversation/conversationTypes';
import { inferResponseMode, type AIResponseMode } from '../utils/responseMode';
import { inferQueryIntent } from '../utils/queryIntent';
import { inferStructuredResponseMode } from '../utils/structuredResponseMode';
import { buildProviderData } from '../utils/buildProviderData';
import type { AIResponseMode as StructuredAIResponseMode } from '../types/structuredResponse';
import { PreferenceResolver } from '../preferences/PreferenceResolver';
import type { RetrievedMemoryFact } from '../../services/userMemoryFactService';
import { detectSessionSoftPreferenceOverrides } from '../preferences/sessionPreferenceDetection';
import { applySessionPreferenceOverrides } from '../preferences/applySessionPreferenceOverrides';
import type { SessionSoftPreferenceOverrides } from '../preferences/preferenceTypes';
import type { ResolvedEffectivePreferences } from '../preferences/preferenceTypes';
import {
  loadBusinessWorkspaceBoundaryBlock,
  type BusinessWorkspaceBoundaryBlock,
} from '../enterprise/businessWorkspaceBoundaries';
import {
  applyResolvedPreferencesToProviderOptions,
  buildProviderUserContextFromPreferences,
} from '../preferences/preferenceProviderWiring';
import {
  buildResponseInfluence,
  type ResponseInfluenceSummary,
} from '../preferences/buildResponseInfluence';
import { buildPipelineTrace } from '../pipeline/buildPipelineTrace';
import {
  applyPipelineEnforcement,
  resolvePipelineEnforcementSettings,
  shouldRunGroundingRetrievalPrepass,
} from '../pipeline/pipelineEnforcement';
import { runPipelineGroundingRetrieval } from '../pipeline/pipelineGroundingRetrieval';
import { buildPipelineEvidenceBundle } from '../pipeline/buildPipelineEvidenceBundle';
import { getEffectivePipelineCatalog } from '../pipeline/pipelineCatalogService';
import { mapOrchestrationToPipelineTraceInput } from '../pipeline/mapPipelineTraceInputs';
import type {
  AIPipelineTrace,
  PipelineContextRetrievedRecord,
  PipelineToolUsageRecord,
} from '../types/pipelineDiagnostics';
import {
  emitTwinObservation,
  emitTwinTurnCompleted,
  emitTwinTurnFailed,
  emitTwinTurnStarted,
} from '../observation/runtimeObservation';

const VISION_PIPELINE_PREFIX = '[VISION_PIPELINE]';
const MODEL_PREF_KEYS: Record<string, string> = {
  openai: 'ai_preferred_model_openai',
  anthropic: 'ai_preferred_model_anthropic',
};
const MAX_TOOL_CALL_ROUNDS = 3;

export interface DigitalLifeTwinResponse {
  response: string;
  confidence: number;
  actions: LifeTwinAction[];
  insights: CrossModuleInsight[];
  reasoning: string;
  personalityAlignment: number;
  crossModuleConnections: CrossModuleConnection[];
  /** When set, frontend should use AIResponseRenderer for polished section/action UI */
  structured?: StructuredAIResponse;
  /** Phase 5: deterministic file/attachment issues for UI to render (message is user-facing). */
  fileIssues?: FileIssue[];
  /** Optional: true when the model used vision parts (images) in this reply; UI can show "Image used in this reply". */
  usedVisionParts?: boolean;
  metadata: {
    contextUsed: string[];
    /** Available vs used context rows (Phase 3D diagnostics). */
    contextAvailability?: AIAssembledContext['contextAvailability'];
    modulesFocused: string[];
    patternMatches: string[];
    processingTime: number;
    provider: string;
    smartContext?: {
      queryAnalysis: {
        relevantModules: Array<{ name: string; relevance: string }>;
        contextProvidersFetched: string[];
      };
      performanceGain: {
        modulesAnalyzed: number;
        totalModulesAvailable: number;
      };
    };
    /** Debug: quality guardrail warnings from validateAIResponseQuality (additive). */
    aiResponseQualityWarnings?: string[];
    responseMode?: AIResponseMode;
    continuityState?: ConversationContinuityState;
    activeTopic?: ActiveTopicState;
    /** Inferred context awaiting user consent (not used in prompts until promoted). */
    pendingLearning?: {
      count: number;
      latest?: { id: string; title: string; content: string };
    };
    /** Ephemeral style adjustments from this thread (not persisted until user promotes). */
    sessionPreferenceAdjustments?: SessionSoftPreferenceOverrides;
    /** Active business workspace (policies from Business AI Control Center, not personal prefs). */
    businessWorkspace?: {
      active: boolean;
      businessId: string;
      businessName?: string;
    };
    /** Human-readable factors that shaped this assistant turn (no prompts or provenance keys). */
    responseInfluence?: ResponseInfluenceSummary;
    /** Admin pipeline diagnostics (additive). */
    pipelineTrace?: AIPipelineTrace;
    /** Conversation reasoning layer (objective, confidence, coaching policy). */
    conversationReasoning?: ConversationReasoningResult;
    /** Phase 1B: governed tool proposals awaiting user approval (approve via POST /api/ai/approvals/:id/respond). */
    pendingToolApprovals?: Array<{
      approvalId: string;
      executionId?: string;
      tool: string;
      riskCategory?: string;
      args?: Record<string, unknown>;
    }>;
    /** Phase 5 observation correlation (emit-only; does not change Twin behavior). */
    requestId?: string;
  };
}

export interface LifeTwinActionData {
  targetId?: string;
  operation?: string;
  parameters?: Record<string, unknown>;
  context?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface LifeTwinAction {
  id: string;
  type: 'schedule' | 'communicate' | 'organize' | 'analyze' | 'create' | 'update' | 'delete';
  module: string;
  description: string;
  data: LifeTwinActionData;
  requiresApproval: boolean;
  approvalReason?: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number; // minutes
  peopleAffected: string[];
  consequences: string[];
}

export interface CrossModuleConnection {
  type: 'workflow' | 'relationship' | 'pattern' | 'opportunity';
  description: string;
  modules: string[];
  strength: number;
  actionable: boolean;
  suggestedAction?: string;
}

export interface RecentActivityItem {
  id: string;
  type: string;
  timestamp: Date | string;
  module?: string;
  description?: string;
  [key: string]: unknown;
}

export interface ConversationHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date | string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AttachedFileContext {
  id: string;
  name: string;
  size?: number | null;
  createdAt?: Date | string;
  summary?: string;
}

export interface LifeTwinQuery {
  query: string;
  context: {
    currentModule?: string;
    dashboardType?: string;
    dashboardName?: string;
    recentActivity?: RecentActivityItem[];
    urgency?: 'low' | 'medium' | 'high';
    // Optional list of Drive file IDs attached to this query
    fileIds?: string[];
    /** When set (e.g. business workspace), module context fetches use this tenant explicitly. */
    businessId?: string;
    /** Optional response mode override from caller. */
    responseMode?: AIResponseMode;
    /** Optional structured JSON mode override (e.g. conversation, analysis). */
    structuredResponseMode?: StructuredAIResponseMode | string;
    conversationId?: string;
    dashboardId?: string;
    /** Cross-session thread summaries (populated by DigitalLifeTwinService). */
    recentConversationMemory?: unknown[];
    /** Semantic recall chunks (populated by DigitalLifeTwinService). */
    recalledMessages?: unknown[];
    /** Structured user memory facts (populated by DigitalLifeTwinService). */
    userMemoryFacts?: unknown[];
    /** Admin pipeline / test-lab flags (optional). */
    pipelineOptions?: {
      adminDryRun?: boolean;
      skipLearning?: boolean;
      skipRememberThat?: boolean;
      skipEnforcement?: boolean;
    };
    /** Set by twin route for pipeline location grounding (Phase 4). */
    clientIp?: string;
    [key: string]: unknown;
  };
  userId: string;
  conversationHistory?: ConversationHistoryItem[];
  continuityState?: ConversationContinuityState;
  activeTopic?: ActiveTopicState;
  preferredProvider?: 'auto' | 'openai' | 'anthropic';
  /** Optional model id override (e.g. gpt-4o-mini). Validated in Core against modelCatalog. */
  preferredModel?: string;
}

const MAX_CONTEXT_GENERATIONS_PER_REQUEST = 2;

function appendContextGenerationRecord(
  queryContext: Record<string, unknown>,
  record: Record<string, unknown>
): void {
  const existing = Array.isArray(queryContext.contextGenerations)
    ? (queryContext.contextGenerations as Record<string, unknown>[])
    : [];
  const next = [...existing, record].slice(-MAX_CONTEXT_GENERATIONS_PER_REQUEST);
  queryContext.contextGenerations = next;
  if (typeof record.contextGenerationId === 'string') {
    queryContext.contextGenerationId = record.contextGenerationId;
  }
}

export class DigitalLifeTwinCore {
  private prisma: PrismaClient;
  private contextEngine: CrossModuleContextEngine;
  private personalityEngine: PersonalityEngine;
  private decisionEngine: DecisionEngine;
  private learningEngine: AdvancedLearningEngine;
  private actionExecutor: ActionExecutor;
  private smartPatternEngine: SmartPatternEngine;
  private centralizedLearning: CentralizedLearningEngine;
  private preferenceResolver: PreferenceResolver;

  constructor(contextEngine?: CrossModuleContextEngine, prismaClient?: PrismaClient) {
    this.prisma = prismaClient || sharedPrisma;
    
    this.contextEngine = contextEngine || new CrossModuleContextEngine();
    
    try {
      this.personalityEngine = new PersonalityEngine(this.prisma);
      this.decisionEngine = new DecisionEngine(this.prisma);
      this.learningEngine = new AdvancedLearningEngine(this.prisma);
      this.actionExecutor = new ActionExecutor(this.prisma);
      this.smartPatternEngine = new SmartPatternEngine(this.prisma);
      this.centralizedLearning = new CentralizedLearningEngine(this.prisma);
      this.preferenceResolver = new PreferenceResolver(this.prisma);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.error('Error initializing DigitalLifeTwinCore engines', {
        operation: 'digital_life_twin_core_init',
        error: { message: err.message, stack: err.stack },
      });
      throw error; // Re-throw to prevent using uninitialized engines
    }
  }

  /** Options for streaming: when set, provider streams text via onChunk and tools are disabled. */
  public static readonly STREAM_OPTIONS_KEY = 'streamOptions' as const;

  /**
   * Main interface - process a query as the user's Digital Life Twin
   */
  async processAsDigitalTwin(
    query: LifeTwinQuery,
    streamOptions?: { stream: boolean; onChunk: (text: string) => void }
  ): Promise<DigitalLifeTwinResponse> {
    const startTime = Date.now();
    const requestId = randomUUID();
    const context = query.context as Record<string, unknown> | undefined;
    const conversationId = (context?.conversationId != null && typeof context.conversationId === 'string') ? context.conversationId : undefined;
    const observationBusinessId =
      context && typeof context.businessId === 'string' && context.businessId.trim() !== ''
        ? context.businessId.trim()
        : null;

    emitTwinTurnStarted({
      requestId,
      userId: query.userId,
      conversationId,
      businessId: observationBusinessId,
      userQuery: typeof query.query === 'string' ? query.query : undefined,
    });

    try {
      // Validate input
      if (!query || !query.query || !query.userId) {
        throw new Error('Invalid query: missing required fields');
      }

      // 1. 🚀 NEW: Get SMART context - only fetches relevant modules based on query
      let userContext: UserContext;
      let smartContext: Record<string, unknown> | null = null;
      let moduleContextsForAssembly: Record<string, unknown> | undefined;
      try {
        const ctx = query.context as Record<string, unknown> | undefined;
        const businessId =
          ctx && typeof ctx.businessId === 'string' && ctx.businessId.trim() !== ''
            ? ctx.businessId.trim()
            : undefined;
        const dashboardIdForContext =
          ctx && typeof ctx.dashboardId === 'string' && ctx.dashboardId.trim() !== ''
            ? ctx.dashboardId.trim()
            : undefined;
        const householdIdForContext =
          ctx && typeof ctx.householdId === 'string' && ctx.householdId.trim() !== ''
            ? ctx.householdId.trim()
            : undefined;
        const conversationIdForContext =
          ctx && typeof ctx.conversationId === 'string' && ctx.conversationId.trim() !== ''
            ? ctx.conversationId.trim()
            : undefined;
        smartContext = await this.contextEngine?.getContextForAIQuery(query.userId, query.query, {
          businessId,
          dashboardId: dashboardIdForContext,
          householdId: householdIdForContext,
          requestId,
          conversationId: conversationIdForContext,
        });
        
        // Convert smart context to UserContext format for backward compatibility
        userContext = (smartContext as any)?.fullContext || await this.contextEngine?.getUserContext(query.userId) || this.createFallbackUserContext(query.userId);

        const sc = smartContext as Record<string, unknown> | null;
        if (sc?.moduleContexts && typeof sc.moduleContexts === 'object' && !Array.isArray(sc.moduleContexts)) {
          moduleContextsForAssembly = sc.moduleContexts as Record<string, unknown>;
        }

        emitTwinObservation({
          requestId,
          userId: query.userId,
          conversationId,
          businessId: observationBusinessId,
          type: 'ContextBuilt',
          surface: 'TWIN',
          metadata: {
            relevantModuleCount:
              typeof (sc as { relevantModuleCount?: unknown } | null)?.relevantModuleCount === 'number'
                ? (sc as { relevantModuleCount: number }).relevantModuleCount
                : undefined,
          },
        });

        const ctxRecordEarly = query.context as Record<string, unknown>;
        const businessIdForVLink =
          ctx && typeof ctx.businessId === 'string' && ctx.businessId.trim() !== ''
            ? ctx.businessId.trim()
            : undefined;
        const dashboardIdForVLink =
          typeof ctxRecordEarly.dashboardId === 'string' && ctxRecordEarly.dashboardId.trim() !== ''
            ? ctxRecordEarly.dashboardId.trim()
            : undefined;
        const householdIdForVLink =
          typeof ctxRecordEarly.householdId === 'string' && ctxRecordEarly.householdId.trim() !== ''
            ? ctxRecordEarly.householdId.trim()
            : undefined;

        let vlinkPipelineContext: VLinkPipelineContextResult | undefined;
        try {
          const pipelineCatalogEarly = await getEffectivePipelineCatalog();
          const vlinkSourceEnabled = pipelineCatalogEarly.contextSources.some(
            (s) => s.id === 'vlink' && s.enabled && !s.archived
          );
          vlinkPipelineContext = await fetchVLinkPipelineContext({
            userId: query.userId,
            query: query.query,
            businessId: businessIdForVLink,
            dashboardId: dashboardIdForVLink,
            householdId: householdIdForVLink,
            catalogEnabled: vlinkSourceEnabled,
          });
          ctxRecordEarly.vlinkPipelineContext = vlinkPipelineContext;
        } catch (vlinkError: unknown) {
          const err = vlinkError instanceof Error ? vlinkError : new Error(String(vlinkError));
          void logger.warn('V_Link pipeline context fetch failed', {
            operation: 'digital_life_twin_vlink_context',
            error: { message: err.message },
          });
        }

        const hasModuleContexts =
          moduleContextsForAssembly && Object.keys(moduleContextsForAssembly).length > 0;
        const hasVLinkContext = (vlinkPipelineContext?.vlinksUsed ?? 0) > 0;

        if (hasModuleContexts || hasVLinkContext) {
          const entityLinks = linkEntitiesAcrossModules({
            moduleContexts: moduleContextsForAssembly ?? {},
            query: query.query,
            persistedVLinks: toPersistedVLinksForEntityLinking(vlinkPipelineContext),
          });
          const memoryFacts = Array.isArray((query.context as Record<string, unknown>).userMemoryFacts)
            ? ((query.context as Record<string, unknown>).userMemoryFacts as Array<{
                subject: string;
                predicate: string;
              }>)
            : undefined;
          const crossModuleSynthesis = synthesizeCrossModuleContext({
            query: query.query,
            moduleContexts: moduleContextsForAssembly ?? {},
            entityLinks,
            memoryFacts,
          });
          (query.context as Record<string, unknown>).entityLinks = entityLinks;
          (query.context as Record<string, unknown>).crossModuleSynthesis = crossModuleSynthesis;
        }
        if (Array.isArray(sc?.providerFetchAudit)) {
          (query.context as Record<string, unknown>).providerFetchAudit = sc.providerFetchAudit;
        }
        if (Array.isArray(sc?.providerSelectionDiagnostics)) {
          (query.context as Record<string, unknown>).providerSelectionDiagnostics =
            sc.providerSelectionDiagnostics;
        }
        if (sc?.contextOrchestration && typeof sc.contextOrchestration === 'object') {
          appendContextGenerationRecord(query.context as Record<string, unknown>, {
            ...(sc.contextOrchestration as Record<string, unknown>),
            groundingFailure: sc.groundingFailure === true,
            requiredSourceFailures: Array.isArray(sc.requiredSourceFailures)
              ? (sc.requiredSourceFailures as string[])
              : [],
          });
        }
        if (Array.isArray(sc?.requiredSourceFailures) && sc.requiredSourceFailures.length > 0) {
          (query.context as Record<string, unknown>).requiredSourceFailures =
            sc.requiredSourceFailures;
        }
        if (sc?.groundingFailure === true) {
          (query.context as Record<string, unknown>).contextGroundingFailure = true;
        }
        if (Array.isArray(sc?.staleContextWarnings)) {
          (query.context as Record<string, unknown>).staleContextWarnings = sc.staleContextWarnings;
        }
        if (
          sc?.orchestrationSnapshot &&
          typeof sc.orchestrationSnapshot === 'object' &&
          !Array.isArray(sc.orchestrationSnapshot)
        ) {
          appendOrchestrationSnapshot(
            query.context as Record<string, unknown>,
            sc.orchestrationSnapshot as AIOrchestrationSnapshot
          );
        }
        if (Array.isArray(sc?.groundingSourceToProvider)) {
          (query.context as Record<string, unknown>).groundingSourceToProvider =
            sc.groundingSourceToProvider;
        }
        if (Array.isArray(sc?.installedModuleIds) && sc.installedModuleIds.length > 0) {
          userContext = {
            ...userContext,
            activeModules: sc.installedModuleIds as string[],
          };
        }
        
        void logger.info('Smart context fetched', {
          operation: 'digital_life_twin_smart_context',
          relevantModuleCount: (smartContext as Record<string, unknown>)?.relevantModuleCount ?? 0,
          moduleContextKeys: moduleContextsForAssembly ? Object.keys(moduleContextsForAssembly) : [],
        });
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        void logger.warn('Error getting smart context, falling back to full context', {
          operation: 'digital_life_twin_smart_context_fallback',
          error: { message: err.message, stack: err.stack },
        });
        // Fallback to old method if smart context fails
        try {
          userContext = await this.contextEngine?.getUserContext(query.userId) || this.createFallbackUserContext(query.userId);
        } catch (fallbackError: unknown) {
          const err = fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError));
          void logger.warn('Error getting user context', {
            operation: 'digital_life_twin_user_context_error',
            error: { message: err.message, stack: err.stack },
          });
          userContext = this.createFallbackUserContext(query.userId);
        }
      }

      // 1a. Get context for attached Drive files (metadata + content summaries) and vision image parts
      let attachedFiles: AttachedFileContext[] = [];
      let visionImageParts: Array<{ mimeType: string; dataBase64?: string; url?: string; fileName: string }> = [];
      /** Phase 5: collect file analysis results so we can build fileIssues for the response */
      let fileAnalysisResults: Array<{ id: string; name: string; summary: string; fileIssueCode?: string }> = [];
      try {
        const contextFileIds = Array.isArray(query.context.fileIds)
          ? query.context.fileIds.filter((id): id is string => typeof id === 'string')
          : [];

        logger.info('Processing attached files', {
          operation: 'digital_life_twin_files',
          fileIdsReceived: contextFileIds.length,
          fileIds: contextFileIds,
          userId: query.userId
        });

        if (contextFileIds.length > 0) {
          const t0 = Date.now();
          const files = await fetchAccessibleActiveFiles(query.userId, contextFileIds);
          const t_findMany_ms = Date.now() - t0;
          logger.info(`${VISION_PIPELINE_PREFIX} stage=findMany ms=${t_findMany_ms}`, {
            operation: 'vision_pipeline_timing',
            stage: 'findMany',
            ms: t_findMany_ms,
            requestId,
            conversationId,
            fileCount: files.length,
          });

          logger.info('Files found in database', {
            operation: 'digital_life_twin_files_found',
            requestedCount: contextFileIds.length,
            foundCount: files.length,
            fileNames: files.map(f => f.name),
            fileTypes: files.map(f => f.type)
          });

          await logger.debug(`${VISION_PIPELINE_PREFIX} after fetch files`, {
            operation: 'vision_pipeline_files',
            requestId,
            conversationId,
            userId: query.userId,
            filesLength: files.length,
            files: files.map((f) => ({ id: f.id, name: f.name, type: f.type, size: f.size, hasPath: !!f.path, hasUrl: !!f.url })),
          });

          attachedFiles = files.map((file) => ({
            id: file.id,
            name: file.name,
            size: file.size,
            createdAt: file.createdAt,
          }));

          // Extract text summaries for AI context (with timeout to prevent blocking)
          try {
            const t0_summaries = Date.now();
            const { getFileSummaries } = await import('../../services/fileAnalysisService');
            
            // Add timeout wrapper: max 30 seconds for file processing
            const summariesPromise = getFileSummaries(
              files.map((f) => ({
                id: f.id,
                name: f.name,
                path: f.path,
                url: f.url,
                size: f.size,
                type: f.type,
              }))
            );
            
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('File analysis timeout after 30 seconds')), 30000);
            });
            
            const summaries = await Promise.race([summariesPromise, timeoutPromise]);
            
            logger.info('File summaries generated', {
              operation: 'digital_life_twin_summaries',
              summaryCount: summaries.length,
              summaries: summaries.map(s => ({
                id: s.id,
                name: s.name,
                summaryLength: s.summary.length,
                hasContent: s.summary.length > 0 && !s.summary.startsWith('('),
                preview: s.summary.substring(0, 100)
              }))
            });

            const summaryMap = new Map(summaries.map((s) => [s.id, s.summary]));
            attachedFiles = attachedFiles.map((f) => ({
              ...f,
              summary: summaryMap.get(f.id),
            }));
          } catch (summaryError) {
            const err = summaryError instanceof Error ? summaryError : new Error(String(summaryError));
            logger.error('Error extracting file summaries (continuing without summaries)', {
              operation: 'digital_life_twin_summary_error',
              error: { message: err.message, stack: err.stack },
              fileCount: files.length,
              fileNames: files.map(f => f.name)
            });
            // Continue without summaries - attachedFiles already has metadata, just no summaries
            // This allows the AI request to proceed even if file analysis fails
          }

          // Vision API: get image parts for attached image files so the model can "see" them
          try {
            const t0_vision = Date.now();
            const { getVisionImageParts } = await import('../../services/fileAnalysisService');
            // Limit to 1 image per message initially to avoid payload/CPU bottlenecks (can bump to 5 later)
            // Use 'both' transport - providers will choose URL or base64 based on their capabilities
            visionImageParts = await getVisionImageParts(
              files.map((f) => ({ id: f.id, name: f.name, path: f.path, url: f.url, size: f.size ?? 0, type: f.type })),
              1,
              5 * 1024 * 1024,
              'both'
            );
            const t_getVisionImageParts_ms = Date.now() - t0_vision;
            logger.info(`${VISION_PIPELINE_PREFIX} stage=visionParts ms=${t_getVisionImageParts_ms}`, {
              operation: 'vision_pipeline_timing',
              stage: 'visionParts',
              ms: t_getVisionImageParts_ms,
              requestId,
              conversationId,
              visionPartsCount: visionImageParts.length,
            });
            await logger.debug(`${VISION_PIPELINE_PREFIX} after getVisionImageParts`, {
              operation: 'vision_pipeline_vision_parts',
              requestId,
              conversationId,
              userId: query.userId,
              visionImagePartsLength: visionImageParts.length,
              fileNames: visionImageParts.map((p) => p.fileName),
              mimeTypes: visionImageParts.map((p) => p.mimeType),
            });

            // Phase 3: image-based PDFs – render PDF pages to images when summary is short and we have vision slots
            try {
              const { getPdfVisionParts } = await import('../../services/fileAnalysisService');
              const summaryMapForPdf = new Map(
                    (attachedFiles ?? [])
                      .filter((f) => f.summary != null)
                      .map((f) => [f.id, f.summary as string])
                  );
              for (const file of files) {
                if (visionImageParts.length >= 5) break;
                const name = (file.name ?? '').toLowerCase();
                if (!name.endsWith('.pdf')) continue;
                const summary = summaryMapForPdf.get(file.id);
                const pdfResult = await getPdfVisionParts(
                  { id: file.id, name: file.name ?? '', path: file.path, url: file.url, size: file.size ?? 0, type: file.type },
                  summary,
                  visionImageParts.length,
                  5
                );
                for (const p of pdfResult.parts) {
                  visionImageParts.push(p);
                  if (visionImageParts.length >= 5) break;
                }
                if (pdfResult.fileIssueCode && pdfResult.fileId) {
                  fileAnalysisResults.push({
                    id: pdfResult.fileId,
                    name: pdfResult.fileName ?? pdfResult.fileId,
                    summary: '',
                    fileIssueCode: pdfResult.fileIssueCode,
                  });
                }
              }
              if (visionImageParts.length > 0) {
                await logger.debug(`${VISION_PIPELINE_PREFIX} after PDF vision`, {
                  operation: 'vision_pipeline_pdf_vision',
                  requestId,
                  conversationId,
                  visionImagePartsLength: visionImageParts.length,
                  fileNames: visionImageParts.map((p) => p.fileName),
                });
              }
            } catch (pdfVisionErr) {
              const err = pdfVisionErr instanceof Error ? pdfVisionErr : new Error(String(pdfVisionErr));
              logger.warn('PDF vision parts failed (continuing with image parts only)', {
                operation: 'vision_pipeline_pdf_vision_error',
                requestId,
                conversationId,
                error: { message: err.message },
              });
            }
          } catch (visionErr) {
            const err = visionErr instanceof Error ? visionErr : new Error(String(visionErr));
            logger.warn('Failed to get vision image parts (continuing without)', {
              operation: 'vision_pipeline_vision_parts_error',
              requestId,
              conversationId,
              error: { message: err.message },
            });
          }
        } else {
          logger.info('No fileIds provided in context', { operation: 'digital_life_twin_files' });
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Error loading attached file context', {
          operation: 'digital_life_twin_file_context_error',
          error: { message: err.message, stack: err.stack }
        });
      }
      
      // 2. Get user's personality profile (with fallback)
      let personality;
      try {
        personality = await this.personalityEngine?.getPersonalityProfile(query.userId) || {};
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        void logger.warn('Error getting personality profile', {
          operation: 'digital_life_twin_personality_profile_error',
          error: { message: err.message, stack: err.stack },
        });
        personality = {};
      }

      // 2a. Get user-defined context entries (with fallback)
      let userDefinedContext: Array<Record<string, unknown>> = [];
      try {
        const contexts = await this.prisma.userAIContext.findMany({
          where: {
            userId: query.userId,
            active: true,
            learningStatus: 'active',
          },
          orderBy: [
            { priority: 'desc' },
            { updatedAt: 'desc' }
          ],
          take: 20 // Limit to top 20 most relevant contexts
        });
        userDefinedContext = contexts.map(ctx => ({
          scope: ctx.scope,
          moduleId: ctx.moduleId,
          contextType: ctx.contextType,
          title: ctx.title,
          content: ctx.content,
          tags: ctx.tags
        }));
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        void logger.warn('Error getting user-defined context', {
          operation: 'digital_life_twin_user_defined_context_error',
          error: { message: err.message, stack: err.stack },
        });
      }

      // 2b. Collective learning patterns — only when user explicitly opted in
      let globalPatterns: Array<Record<string, unknown>> = [];
      let collectiveConsent = false;
      try {
        collectiveConsent = await userAllowsCollectiveLearning(query.userId, this.prisma);
        if (collectiveConsent && this.centralizedLearning) {
          const userSegment = query.context.dashboardType === 'business' ? 'business' :
                             query.context.dashboardType === 'household' ? 'household' : 'personal';

          const patterns = await this.prisma.globalPattern.findMany({
            where: {
              OR: [
                { userSegment: 'all' },
                { userSegment: userSegment }
              ],
              confidence: { gte: 0.7 },
              impact: { in: ['positive', 'neutral'] }
            },
            orderBy: [
              { confidence: 'desc' },
              { frequency: 'desc' }
            ],
            take: 5
          });

          globalPatterns = patterns.map(p => ({
            type: p.patternType,
            description: p.description,
            frequency: p.frequency,
            confidence: p.confidence,
            recommendations: p.recommendations,
            modules: p.modules
          }));
        }
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        void logger.warn('Error getting global patterns', {
          operation: 'digital_life_twin_global_patterns_error',
          error: { message: err.message, stack: err.stack },
        });
      }
      
      // 3. Get smart pattern analysis and predictions
      let smartAnalysis: Record<string, unknown> = { patterns: [], predictions: [], suggestions: [] };
      try {
        smartAnalysis = await this.smartPatternEngine?.analyzeAndPredict(query.userId, {
          currentQuery: query.query,
          currentModule: query.context.currentModule,
          urgency: query.context.urgency
        }) || smartAnalysis;
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        void logger.warn('Error getting smart pattern analysis', {
          operation: 'digital_life_twin_smart_analysis_error',
          error: { message: err.message, stack: err.stack },
        });
      }

      // 4. Enhance query with semantic understanding
      let semanticEnhancement: Record<string, unknown> = { 
        originalQuery: query.query, 
        enhancedContext: query.query, 
        relatedQueries: [], 
        confidenceBoost: 0, 
        suggestedCategories: ['general'] 
      };
      try {
        semanticEnhancement = await this.smartPatternEngine?.enhanceQueryWithSemantics(query.query, query.userId) || semanticEnhancement;
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        void logger.warn('Error enhancing query with semantics', {
          operation: 'digital_life_twin_semantics_error',
          error: { message: err.message, stack: err.stack },
        });
      }

      // 5. Analyze the query intent and determine response strategy (enhanced with patterns and semantics)
      const queryAnalysis = await this.analyzeQuery(query, userContext, personality, smartAnalysis, semanticEnhancement);
      const responseMode = inferResponseMode({
        query: query.query,
        explicitMode: query.context.responseMode,
      });
      const continuityUpdate = updateConversationContinuityState({
        latestUserMessage: query.query,
        recentMessages: query.conversationHistory ?? [],
        previousState: query.continuityState,
        previousTopic: query.activeTopic,
      });

      const conversationReasoning = runConversationReasoning({
        query: query.query,
        conversationHistory: query.conversationHistory,
        continuityState: continuityUpdate.continuity,
        activeTopic: continuityUpdate.activeTopic,
        responseMode,
      });

      let effectivePreferences: ResolvedEffectivePreferences | undefined;
      let sessionPreferenceAdjustments: SessionSoftPreferenceOverrides | undefined;
      let businessWorkspaceBoundaries: BusinessWorkspaceBoundaryBlock | undefined;
      try {
        const ctxRecord = query.context as Record<string, unknown>;
        const businessId =
          typeof ctxRecord.businessId === 'string' && ctxRecord.businessId.trim()
            ? ctxRecord.businessId.trim()
            : undefined;
        const dashboardId =
          typeof ctxRecord.dashboardId === 'string' && ctxRecord.dashboardId.trim()
            ? ctxRecord.dashboardId.trim()
            : undefined;
        effectivePreferences = await this.preferenceResolver.resolve({
          userId: query.userId,
          businessId,
          dashboardId,
          retrievedMemoryFacts: Array.isArray(ctxRecord.userMemoryFacts)
            ? (ctxRecord.userMemoryFacts as RetrievedMemoryFact[])
            : undefined,
        });

        const sessionOverrides = detectSessionSoftPreferenceOverrides(
          query.query,
          query.conversationHistory
        );
        if (sessionOverrides) {
          sessionPreferenceAdjustments = sessionOverrides;
          if (effectivePreferences) {
            effectivePreferences = applySessionPreferenceOverrides(
              effectivePreferences,
              sessionOverrides
            );
          }
        }

        if (businessId) {
          const boundaries = await loadBusinessWorkspaceBoundaryBlock(query.userId, businessId);
          if (boundaries) {
            businessWorkspaceBoundaries = boundaries;
          }
        }

        const inferred = effectivePreferences?.inferred ?? [];
        const learningApplied = inferred.filter((item) => item.kind === 'learning_applied');
        const contextPrefs = inferred.filter((item) => item.kind === 'context');
        const confidenceItems = [...learningApplied, ...contextPrefs];
        const avgLearningConfidence =
          confidenceItems.length > 0
            ? confidenceItems.reduce((sum, item) => sum + item.confidence, 0) /
              confidenceItems.length
            : undefined;

        const { userAIContextLearningService } = await import(
          '../../services/userAIContextLearningService.js'
        );
        const pendingCount = await userAIContextLearningService.countPending(query.userId);

        ctxRecord.learningPipelineSnapshot = {
          pendingCount,
          appliedInferredCount: learningApplied.length,
          contextPreferencesActive: contextPrefs.length,
          resolverInferredCount: confidenceItems.length,
          avgLearningConfidence,
          collectivePatternsLoaded: globalPatterns.length,
          collectiveConsent,
        };
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        void logger.warn('Error resolving effective AI preferences', {
          operation: 'digital_life_twin_preference_resolve_error',
          error: { message: err.message, stack: err.stack },
        });
      }

      // 6. Generate Digital Life Twin response (enhanced with smart insights, semantics, collective learning, attached file context, and vision images)
      const t0_provider = Date.now();
      const crossModuleSynthesis =
        (query.context as Record<string, unknown>).crossModuleSynthesis as
          | ContextSynthesisResult
          | undefined;
      const response = await this.generateLifeTwinResponse(
        query,
        userContext,
        personality,
        queryAnalysis,
        smartAnalysis,
        semanticEnhancement,
        userDefinedContext,
        globalPatterns,
        responseMode,
        continuityUpdate.continuity,
        continuityUpdate.activeTopic,
        attachedFiles,
        visionImageParts,
        { requestId, conversationId, userId: query.userId },
        streamOptions,
        moduleContextsForAssembly,
        effectivePreferences,
        businessWorkspaceBoundaries,
        crossModuleSynthesis,
        conversationReasoning
      );
      const t_provider_ms = Date.now() - t0_provider;
      const t_total_ms = Date.now() - startTime;
      logger.info(`${VISION_PIPELINE_PREFIX} stage=provider ms=${t_provider_ms} stage=total ms=${t_total_ms}`, {
        operation: 'vision_pipeline_timing',
        stage: 'provider_and_total',
        t_provider_ms,
        t_total_ms,
        requestId,
        conversationId,
      });
      
      // 5. Identify cross-module connections and opportunities (with error handling)
      let connections: CrossModuleConnection[] = [];
      try {
        const entityLinks = (query.context as Record<string, unknown>).entityLinks as
          | EntityLinkingResult
          | undefined;
        connections = await this.identifyCrossModuleConnections(
          query,
          userContext,
          response,
          entityLinks
        );
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        void logger.warn('Error identifying cross-module connections', {
          operation: 'digital_life_twin_connections_error',
          error: { message: err.message, stack: err.stack },
        });
      }
      
      // 6. Determine actions the Digital Life Twin should take (with error handling)
      let actions: LifeTwinAction[] = [];
      try {
        actions = await this.determineActions(query, userContext, personality, response);
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        void logger.warn('Error determining actions', {
          operation: 'digital_life_twin_actions_error',
          error: { message: err.message, stack: err.stack },
        });
      }
      
      // 7. Extract relevant insights (with error handling)
      let relevantInsights: CrossModuleInsight[] = [];
      try {
        relevantInsights = this.extractRelevantInsights(userContext, query);
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        void logger.warn('Error extracting insights', {
          operation: 'digital_life_twin_insights_error',
          error: { message: err.message, stack: err.stack },
        });
      }
      
      // 8. Calculate personality alignment (with error handling)
      let personalityAlignment = 0.5;
      try {
        personalityAlignment = this.calculatePersonalityAlignment(response, personality);
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        void logger.warn('Error calculating personality alignment', {
          operation: 'digital_life_twin_alignment_error',
          error: { message: err.message, stack: err.stack },
        });
      }
      
      // 9. Learn from this interaction (skip for admin test-lab dry runs)
      const pipelineOptions = (query.context as Record<string, unknown>).pipelineOptions as
        | { skipLearning?: boolean }
        | undefined;
      if (!pipelineOptions?.skipLearning) {
      await this.learningEngine.processInteraction(
        {
          id: `ai_req_${Date.now()}`,
          userId: query.userId,
          query: query.query,
          context: query.context,
          timestamp: new Date(),
          priority: 'medium'
        },
        {
          id: `ai_res_${Date.now()}`,
          requestId: `ai_req_${Date.now()}`,
          response: response.response,
          confidence: response.confidence,
          reasoning: response.reasoning,
          metadata: {
            provider: 'hybrid',
            model: 'digital-life-twin',
            tokens: 0,
            cost: 0,
            processingTime: Date.now() - startTime
          }
        },
        {
          userId: query.userId,
          personality: await this.personalityEngine.getPersonalityProfile(query.userId),
          preferences: userContext.preferences,
          autonomySettings: {},
          currentModule: query.context.currentModule,
          recentActivity: []
        }
      );
      const ctxRecord = query.context as Record<string, unknown>;
      const businessId =
        typeof ctxRecord.businessId === 'string' && ctxRecord.businessId.trim()
          ? ctxRecord.businessId.trim()
          : undefined;
      const dashboardId =
        typeof ctxRecord.dashboardId === 'string' && ctxRecord.dashboardId.trim()
          ? ctxRecord.dashboardId.trim()
          : undefined;
      const conversationId =
        typeof ctxRecord.conversationId === 'string' && ctxRecord.conversationId.trim()
          ? ctxRecord.conversationId.trim()
          : undefined;
      const modulesReferenced = collectModulesReferenced({
        modulesFocused: response.modulesFocused,
        contextRetrieved: response.pipelineTrace?.contextRetrieved,
        currentModule:
          typeof ctxRecord.currentModule === 'string' ? ctxRecord.currentModule : undefined,
      });
      void userLearningSignalService
        .recordModuleUsageFromTwin({
          userId: query.userId,
          modulesReferenced,
          businessId,
          dashboardId,
          conversationId,
          traceId: response.pipelineTrace?.traceId,
        })
        .catch((signalErr: unknown) => {
          const err = signalErr instanceof Error ? signalErr : new Error(String(signalErr));
          void logger.warn('Failed to record module usage learning signal', {
            operation: 'digital_life_twin_module_usage_signal',
            error: { message: err.message },
          });
        });
      }

      const processingTime = Date.now() - startTime;

      const ctxForInfluence = query.context as Record<string, unknown>;
      const memoryFactsForInfluence = Array.isArray(ctxForInfluence.userMemoryFacts)
        ? (ctxForInfluence.userMemoryFacts as Array<{
            id?: string;
            subject: string;
            predicate: string;
            sourceType?: string;
            confidence?: number;
            isExplicit?: boolean;
          }>)
        : undefined;
      const recalledCount = Array.isArray(ctxForInfluence.recalledMessages)
        ? ctxForInfluence.recalledMessages.length
        : 0;

      let responseInfluence: ResponseInfluenceSummary | undefined;
      try {
        responseInfluence = buildResponseInfluence({
          effectivePreferences,
          sessionAdjustments: sessionPreferenceAdjustments,
          businessBoundaries: businessWorkspaceBoundaries,
          userMemoryFacts: memoryFactsForInfluence,
          recalledMessageCount: recalledCount,
          modulesFocused: response.modulesFocused,
          assembledContext: response.assembledContext,
          hasPersonalityProfile: Boolean(
            personality && typeof personality === 'object'
          ),
          hasAutonomySettings: true,
        });
      } catch (influenceErr: unknown) {
        const err = influenceErr instanceof Error ? influenceErr : new Error(String(influenceErr));
        void logger.warn('Failed to build response influence summary', {
          operation: 'digital_life_twin_response_influence_error',
          error: { message: err.message, stack: err.stack },
        });
      }

      let pendingLearning: DigitalLifeTwinResponse['metadata']['pendingLearning'];
      try {
        const { userAIContextLearningService } = await import(
          '../../services/userAIContextLearningService.js'
        );
        const count = await userAIContextLearningService.countPending(query.userId);
        if (count > 0) {
          const latest = await userAIContextLearningService.getLatestPendingSummary(query.userId);
          pendingLearning = {
            count,
            ...(latest && {
              latest: {
                id: latest.id,
                title: latest.title,
                content: latest.content.slice(0, 200),
              },
            }),
          };
        }
      } catch (pendingErr: unknown) {
        const err = pendingErr instanceof Error ? pendingErr : new Error(String(pendingErr));
        void logger.warn('Failed to load pending learning summary', {
          operation: 'digital_life_twin_pending_learning_error',
          error: { message: err.message, stack: err.stack },
        });
      }

      const includeDeveloperDetails = process.env.INCLUDE_FILE_ISSUE_DEVELOPER_DETAILS === 'true';
      const fileIssues: FileIssue[] = fileAnalysisResults
        .filter((r) => r.fileIssueCode)
        .map((r) => ({
          fileId: r.id,
          code: r.fileIssueCode as FileIssue['code'],
          message: getMessageForCode(r.fileIssueCode as FileIssue['code']),
          details: r.name,
          ...(includeDeveloperDetails && { developerDetails: r.summary }),
        }));

      if (fileIssues.length > 0) {
        emitTwinObservation({
          requestId,
          userId: query.userId,
          conversationId,
          businessId: observationBusinessId,
          type: 'FileIssueRecorded',
          sourceComponent: 'DigitalLifeTwinCore',
          idempotencyKey: `FileIssueRecorded:${fileIssues.map((f) => f.code).join(',')}`,
          metadata: {
            fileCount: fileIssues.length,
            fileIssueCodes: fileIssues.map((f) => f.code),
          },
        });
      }

      const contextUsedModuleNames =
        responseInfluence?.contextUsed
          ?.filter((item) => item.usedInPrompt)
          .map((item) => item.moduleName) ?? [];

      const pendingApprovals = Array.isArray(
        (response as { pendingToolApprovals?: unknown }).pendingToolApprovals
      )
        ? (
            response as {
              pendingToolApprovals: NonNullable<
                DigitalLifeTwinResponse['metadata']['pendingToolApprovals']
              >;
            }
          ).pendingToolApprovals
        : undefined;

      emitTwinTurnCompleted({
        requestId,
        userId: query.userId,
        conversationId,
        businessId: observationBusinessId,
        userQuery: query.query,
        aiResponseSummary: typeof response.response === 'string' ? response.response : undefined,
        provider: response.provider || 'hybrid',
        latencyMs: processingTime,
        pendingApprovals: pendingApprovals?.map((a) => ({
          approvalId: a.approvalId,
          tool: a.tool,
        })),
        actionExecutionIds: pendingApprovals
          ?.map((a) => a.executionId)
          .filter((id): id is string => typeof id === 'string'),
      });

      return {
        response: response.response,
        confidence: response.confidence,
        actions,
        insights: relevantInsights,
        reasoning: response.reasoning,
        personalityAlignment,
        crossModuleConnections: connections,
        structured: response.structured as StructuredAIResponse | undefined,
        ...(fileIssues.length > 0 && { fileIssues }),
        ...(response.usedVisionParts && { usedVisionParts: true }),
        metadata: {
          requestId,
          contextUsed: contextUsedModuleNames,
          contextAvailability: response.assembledContext?.contextAvailability,
          modulesFocused: response.modulesFocused || [],
          patternMatches: response.patternMatches || [],
          processingTime,
          provider: response.provider || 'hybrid',
          responseMode,
          continuityState: continuityUpdate.continuity,
          activeTopic: continuityUpdate.activeTopic,
          ...(response.aiResponseQualityWarnings &&
            response.aiResponseQualityWarnings.length > 0 && {
              aiResponseQualityWarnings: response.aiResponseQualityWarnings,
            }),
          ...(pendingLearning && { pendingLearning }),
          ...(sessionPreferenceAdjustments && { sessionPreferenceAdjustments }),
          ...(businessWorkspaceBoundaries && {
            businessWorkspace: {
              active: true,
              businessId: businessWorkspaceBoundaries.businessId,
              ...(businessWorkspaceBoundaries.businessName && {
                businessName: businessWorkspaceBoundaries.businessName,
              }),
            },
          }),
          ...(responseInfluence && { responseInfluence }),
          ...(response.pipelineTrace?.contextDensity && {
            contextDensity: toContextDensitySummary(
              response.pipelineTrace.contextDensity as Parameters<
                typeof toContextDensitySummary
              >[0]
            ),
          }),
          ...(response.pipelineTrace && { pipelineTrace: response.pipelineTrace }),
          conversationReasoning,
          ...(Array.isArray((response as { pendingToolApprovals?: unknown }).pendingToolApprovals) &&
            ((response as { pendingToolApprovals: unknown[] }).pendingToolApprovals.length > 0) && {
              pendingToolApprovals: (response as {
                pendingToolApprovals: DigitalLifeTwinResponse['metadata']['pendingToolApprovals'];
              }).pendingToolApprovals,
            }),
          // NEW: Smart context metadata
          smartContext: smartContext ? {
            queryAnalysis: {
              relevantModules: (smartContext as Record<string, any>).analysis?.matchedModules?.map((m: Record<string, unknown>) => ({
                name: m.moduleName as string,
                relevance: m.relevance as string
              })) || [],
              contextProvidersFetched: (smartContext as Record<string, any>).analysis?.suggestedContextProviders?.map((p: Record<string, unknown>) => p.providerName as string) || []
            },
            performanceGain: {
              modulesAnalyzed: (smartContext as any).relevantModuleCount || 0,
              totalModulesAvailable: (smartContext as any).analysis?.matchedModules?.length || 0
            }
          } : undefined
        }
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.error('Error in Digital Life Twin processing', {
        operation: 'digital_life_twin_processing_error',
        error: { message: err.message, stack: err.stack },
      });

      emitTwinTurnFailed({
        requestId,
        userId: query.userId,
        conversationId,
        businessId: observationBusinessId,
        message: err.message,
        latencyMs: Date.now() - startTime,
      });
      
      return {
        response: "I apologize, but I'm having trouble accessing your full digital context right now. Let me try to help with what I can access.",
        confidence: 0.3,
        actions: [],
        insights: [],
        reasoning: "Limited context due to system error",
        personalityAlignment: 0.5,
        crossModuleConnections: [],
        fileIssues: [],
        metadata: {
          requestId,
          contextUsed: [],
          modulesFocused: [],
          patternMatches: [],
          processingTime: Date.now() - startTime,
          provider: 'fallback'
        }
      };
    }
  }

  /**
   * Analyze query intent and context (enhanced with smart patterns and semantics)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async analyzeQuery(query: LifeTwinQuery, userContext: UserContext, personality: any, smartAnalysis?: any, semanticEnhancement?: any) {
    const queryLower = query.query.toLowerCase();
    
    // Determine query type
    const queryType = this.determineQueryType(queryLower);
    
    // Determine scope (single module vs cross-module)
    const scope = this.determineQueryScope(queryLower, userContext);
    
    // Determine urgency
    const urgency = this.determineUrgency(queryLower, query.context.urgency);
    
    // Find relevant patterns
    const relevantPatterns = userContext.patterns.filter(pattern => 
      this.isPatternRelevant(pattern as unknown as Record<string, unknown>, queryLower, queryType)
    );
    
    // Find relevant relationships
    const relevantRelationships = userContext.relationships.filter(rel =>
      this.isRelationshipRelevant(rel as unknown as Record<string, unknown>, queryLower, queryType)
    );
    
    return {
      queryType,
      scope,
      urgency,
      relevantPatterns,
      relevantRelationships,
      requiresAction: this.requiresAction(queryLower),
      moduleContext: query.context.currentModule,
      complexity: this.calculateQueryComplexity(queryLower, scope, relevantPatterns.length),
      responseMode: inferResponseMode({ query: query.query, explicitMode: query.context.responseMode }),
    };
  }

  /**
   * Generate response as Digital Life Twin (enhanced with smart insights and semantics)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async generateLifeTwinResponse(
    query: LifeTwinQuery, 
    userContext: UserContext, 
    personality: any, 
    analysis: any,
    smartAnalysis?: any,
    semanticEnhancement?: any,
    userDefinedContext?: Array<Record<string, unknown>>,
    globalPatterns?: Array<Record<string, unknown>>,
    responseMode?: AIResponseMode,
    continuityState?: ConversationContinuityState,
    activeTopic?: ActiveTopicState,
    attachedFiles?: AttachedFileContext[],
    visionImageParts?: Array<{ mimeType: string; dataBase64?: string; url?: string; fileName: string }>,
    traceContext?: { requestId?: string; conversationId?: string; userId?: string },
    streamOptions?: { stream: boolean; onChunk: (text: string) => void },
    moduleContexts?: Record<string, unknown>,
    effectivePreferences?: ResolvedEffectivePreferences,
    businessWorkspaceBoundaries?: BusinessWorkspaceBoundaryBlock,
    crossModuleSynthesis?: ContextSynthesisResult,
    conversationReasoning?: ConversationReasoningResult
  ) {
    const ctxForStructured = query.context as Record<string, unknown>;
    const structuredInference = inferStructuredResponseMode({
      query: query.query,
      explicitMode:
        typeof query.context.structuredResponseMode === 'string'
          ? query.context.structuredResponseMode
          : undefined,
      toneMode: responseMode,
      isFollowUp: Boolean(query.conversationHistory && query.conversationHistory.length > 0),
      fileIds: ctxForStructured.fileIds,
      businessId:
        typeof ctxForStructured.businessId === 'string' ? ctxForStructured.businessId : undefined,
      currentModule:
        typeof ctxForStructured.currentModule === 'string'
          ? ctxForStructured.currentModule
          : undefined,
      hasAttachedFiles: Boolean(
        (attachedFiles && attachedFiles.length > 0) ||
          (visionImageParts && visionImageParts.length > 0)
      ),
    });
    const structuredResponseMode = structuredInference.mode;
    const responseDensity = structuredInference.responseDensity;
    const informationalAnswerEscape = structuredInference.informationalAnswerEscape === true;
    const requiresAuthoritativeContextFlag =
      structuredInference.requiresAuthoritativeContext === true;
    const responseContract =
      structuredInference.responseContract ??
      (structuredResponseMode === 'conversation' ? 'conversation' : 'enterprise');
    const isActionRequest = structuredInference.isActionRequest === true;

    // Live prompt path: assembleAIContext + options.userQuery + provider system prompts.
    // See docs/architecture/AI_TWIN_PROMPT_PIPELINE.md (legacy buildDigitalTwinPrompt removed Phase 0B).

    // Get user preference if not provided in query
    let preferredProvider = query.preferredProvider;
    if (!preferredProvider || preferredProvider === 'auto') {
      try {
        const userPref = await this.prisma.userPreference.findUnique({
          where: { userId_key: { userId: query.userId, key: 'ai_preferred_provider' } }
        });
        if (userPref && userPref.value !== 'auto') {
          preferredProvider = userPref.value as 'auto' | 'openai' | 'anthropic';
        }
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        void logger.warn('Error getting user provider preference', {
          operation: 'digital_life_twin_provider_pref_error',
          error: { message: err.message, stack: err.stack },
        });
      }
    }
    
    const { provider: selectedProvider, routing: llmProviderRouting } = selectLlmProvider({
      query: query.query,
      complexity: (analysis as { complexity?: string })?.complexity || 'medium',
      preferredProvider,
      preferredModel: query.preferredModel,
    });
    let provider = selectedProvider;

    if (traceContext?.requestId) {
      emitTwinObservation({
        requestId: traceContext.requestId,
        userId: query.userId,
        conversationId: traceContext.conversationId,
        type: 'ProviderSelected',
        sourceComponent: 'DigitalLifeTwinCore',
        idempotencyKey: `ProviderSelected:${selectedProvider}`,
        metadata: {
          selectedProvider,
          requestedProvider: preferredProvider,
          requestedModel: query.preferredModel,
          selectionReason: 'selectLlmProvider',
          // Phase 7 shadow — observe-only; does not change selection
          ...(llmProviderRouting.shadowComparison
            ? { shadowComparison: llmProviderRouting.shadowComparison }
            : {}),
        },
      });
      if (llmProviderRouting.shadowComparison) {
        emitTwinObservation({
          requestId: traceContext.requestId,
          userId: query.userId,
          conversationId: traceContext.conversationId,
          type: 'ModelRoutingShadowCompared',
          sourceComponent: 'ModelRouter',
          idempotencyKey: `ModelRoutingShadowCompared:${llmProviderRouting.shadowComparison.proposedCatalogKey}`,
          metadata: {
            ...llmProviderRouting.shadowComparison,
          },
        });
      }
    }

    // Model selection: 1) request override (query.preferredModel) 2) user pref for this provider 3) vision block may override to vision-capable model when images present
    let resolvedModel: string | null = query.preferredModel && query.preferredModel.trim() ? query.preferredModel.trim() : null;
    if (!resolvedModel && (provider === 'openai' || provider === 'anthropic')) {
      try {
        const prefKey = MODEL_PREF_KEYS[provider];
        if (prefKey) {
          const userPref = await this.prisma.userPreference.findUnique({
            where: { userId_key: { userId: query.userId, key: prefKey } },
          });
          if (userPref?.value?.trim()) {
            const def = getModel(userPref.value.trim());
            if (def && def.provider === provider) resolvedModel = userPref.value.trim();
          }
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        void logger.warn('Error getting user model preference', {
          operation: 'digital_life_twin_model_pref_error',
          error: { message: error.message, stack: error.stack },
        });
      }
    }

    // Build options for provider (include visionImageParts when present for multimodal requests)
    const dashboardContext = (userContext as unknown as Record<string, unknown>)?.dashboardContext;
    const optionsDashboardId = dashboardContext && typeof dashboardContext === 'object' && 'dashboardId' in dashboardContext
      ? (dashboardContext as { dashboardId?: string }).dashboardId ?? null
      : null;
    const options: Record<string, unknown> = {
      temperature: 0.7,
      maxTokens: 1000,
      personalityMode: true,
      userId: query.userId,
      dashboardId: optionsDashboardId,
    };
    const ctxForScope = query.context as Record<string, unknown>;
    if (typeof ctxForScope.businessId === 'string' && ctxForScope.businessId.trim() !== '') {
      options.businessId = ctxForScope.businessId.trim();
    }
    if (typeof ctxForScope.conversationId === 'string' && ctxForScope.conversationId.trim() !== '') {
      options.conversationId = ctxForScope.conversationId.trim();
    } else if (traceContext?.conversationId) {
      options.conversationId = traceContext.conversationId;
    }
    if (visionImageParts && visionImageParts.length > 0) {
      options.visionImageParts = visionImageParts;
    }
    if (traceContext) {
      options.traceContext = traceContext;
    }
    if (provider === 'openai' && !streamOptions?.stream) {
      options.tools = AI_TOOL_DEFINITIONS;
    }
    if (streamOptions?.stream && streamOptions?.onChunk) {
      options.stream = true;
      options.onChunk = streamOptions.onChunk;
    }

    const visionParts = options.visionImageParts as unknown[] | undefined;
    const hasVisionParts = Array.isArray(visionParts) && visionParts.length > 0;
    const visionResolution = resolveVisionModelForProvider(
      provider,
      resolvedModel,
      hasVisionParts,
      llmProviderRouting
    );
    if (visionResolution.stripVisionParts) {
      delete options.visionImageParts;
      await logger.info(`${VISION_PIPELINE_PREFIX} vision not supported by provider, using file summaries only`, {
        operation: 'vision_pipeline_no_vision',
        requestId: traceContext?.requestId,
        conversationId: traceContext?.conversationId,
        provider,
      });
    } else if (visionResolution.modelOverride && hasVisionParts) {
      options.visionModelOverride = visionResolution.modelOverride;
      await logger.info(`${VISION_PIPELINE_PREFIX} vision request → model`, {
        operation: 'vision_pipeline_model_selection',
        requestId: traceContext?.requestId,
        conversationId: traceContext?.conversationId,
        provider,
        model: visionResolution.modelOverride,
        visionPartsCount: visionParts.length,
      });
    }
    const modelOverride = visionResolution.modelOverride;
    if (modelOverride && (provider === 'openai' || provider === 'anthropic')) {
      options.modelOverride = modelOverride;
    }

    const ctxRecord = query.context as Record<string, unknown>;
    ctxRecord.llmProviderRouting = llmProviderRouting;
    const pipelineOptions = ctxRecord.pipelineOptions as
      | { skipEnforcement?: boolean; adminDryRun?: boolean }
      | undefined;
    const pipelineCatalog = await getEffectivePipelineCatalog();
    const enforcementSettings = resolvePipelineEnforcementSettings(pipelineCatalog.enforcement);

    let mergedModuleContexts: Record<string, unknown> = {
      ...(moduleContexts && typeof moduleContexts === 'object' ? moduleContexts : {}),
    };
    let groundingBoostTools: PipelineToolUsageRecord[] = [];
    let groundingBoostRetrieved: PipelineContextRetrievedRecord[] = [];
    let groundingBoostSources: string[] = [];
    let retrievalBoostApplied = false;

    if (
      !pipelineOptions?.skipEnforcement &&
      shouldRunGroundingRetrievalPrepass(enforcementSettings)
    ) {
      const clientIp =
        typeof ctxRecord.clientIp === 'string'
          ? ctxRecord.clientIp
          : typeof ctxRecord._clientIp === 'string'
            ? ctxRecord._clientIp
            : undefined;
      const businessId =
        typeof ctxRecord.businessId === 'string' && ctxRecord.businessId.trim() !== ''
          ? ctxRecord.businessId.trim()
          : undefined;
      const dashboardId =
        typeof ctxRecord.dashboardId === 'string' && ctxRecord.dashboardId.trim() !== ''
          ? ctxRecord.dashboardId.trim()
          : undefined;
      const householdId =
        typeof ctxRecord.householdId === 'string' && ctxRecord.householdId.trim() !== ''
          ? ctxRecord.householdId.trim()
          : undefined;
      const existingVLinkPipelineContext = ctxRecord.vlinkPipelineContext as
        | VLinkPipelineContextResult
        | undefined;
      const conversationIdForGrounding =
        typeof ctxRecord.conversationId === 'string' && ctxRecord.conversationId.trim() !== ''
          ? ctxRecord.conversationId.trim()
          : traceContext?.conversationId;

      const boost = await runPipelineGroundingRetrieval({
        userId: query.userId,
        userMessage: query.query,
        catalog: pipelineCatalog,
        clientIp,
        businessId,
        dashboardId,
        householdId,
        existingModuleContexts: mergedModuleContexts,
        existingVLinkPipelineContext,
        requestId: traceContext?.requestId,
        conversationId: conversationIdForGrounding,
      });
      if (boost.vlinkPipelineContext) {
        ctxRecord.vlinkPipelineContext = boost.vlinkPipelineContext;
      }
      if (boost.graphBundlePipelineContext) {
        ctxRecord.graphBundlePipelineContext = boost.graphBundlePipelineContext;
      }
      mergedModuleContexts = { ...mergedModuleContexts, ...boost.moduleContextsPatch };
      if (boost.locationSummary) {
        mergedModuleContexts._pipeline_grounding = {
          ...(typeof mergedModuleContexts._pipeline_grounding === 'object' &&
          mergedModuleContexts._pipeline_grounding !== null
            ? (mergedModuleContexts._pipeline_grounding as Record<string, unknown>)
            : {}),
          locationSummary: boost.locationSummary,
        };
      }
      groundingBoostTools = boost.toolsUsed;
      groundingBoostRetrieved = boost.contextRetrieved;
      groundingBoostSources = boost.sourcesUsed;
      retrievalBoostApplied =
        boost.contextRetrieved.some((c) => c.itemCount > 0) || boost.toolsUsed.some((t) => t.success);

      if (boost.contextOrchestration) {
        appendContextGenerationRecord(ctxRecord, {
          ...boost.contextOrchestration,
          requiredSourceFailures: boost.requiredSourceFailures ?? [],
        });
      }
      if (boost.providerSelectionDiagnostics?.length) {
        const existing = Array.isArray(ctxRecord.providerSelectionDiagnostics)
          ? (ctxRecord.providerSelectionDiagnostics as unknown[])
          : [];
        ctxRecord.providerSelectionDiagnostics = [
          ...existing,
          ...boost.providerSelectionDiagnostics,
        ];
      }
      if (boost.requiredSourceFailures?.length) {
        const mergedFailures = [
          ...(Array.isArray(ctxRecord.requiredSourceFailures)
            ? (ctxRecord.requiredSourceFailures as string[])
            : []),
          ...boost.requiredSourceFailures,
        ];
        ctxRecord.requiredSourceFailures = [...new Set(mergedFailures)];
      }
      if (boost.staleContextWarnings?.length) {
        const mergedStale = [
          ...(Array.isArray(ctxRecord.staleContextWarnings)
            ? (ctxRecord.staleContextWarnings as string[])
            : []),
          ...boost.staleContextWarnings,
        ];
        ctxRecord.staleContextWarnings = [...new Set(mergedStale)];
      }
      if (boost.groundingSourceToProvider?.length) {
        ctxRecord.groundingSourceToProvider = boost.groundingSourceToProvider;
      }
      if (boost.orchestrationSnapshot) {
        appendOrchestrationSnapshot(ctxRecord, boost.orchestrationSnapshot);
      }
      if (boost.retrievalDiscovery) {
        ctxRecord.aiRetrievalDiscovery = boost.retrievalDiscovery;
      }
    }

    const recentConversationMemory = Array.isArray(ctxRecord.recentConversationMemory)
      ? (ctxRecord.recentConversationMemory as Array<{
          id: string;
          title: string;
          threadSummary: string | null;
          lastMessageAt: Date | string;
        }>)
      : undefined;
    const recalledMessages = Array.isArray(ctxRecord.recalledMessages)
      ? (ctxRecord.recalledMessages as Array<{
          messageId: string;
          conversationId: string;
          role: string;
          contentSnippet: string;
          similarity: number;
        }>)
      : undefined;
    const userMemoryFacts = Array.isArray(ctxRecord.userMemoryFacts)
      ? (ctxRecord.userMemoryFacts as Array<{
          id?: string;
          subject: string;
          predicate: string;
          confidence: number;
          sourceType?: string;
          isExplicit?: boolean;
        }>)
      : undefined;

    const vlinkPipelineContextForAssembly = ctxRecord.vlinkPipelineContext as
      | VLinkPipelineContextResult
      | undefined;
    const graphBundlePipelineContextForAssembly = ctxRecord.graphBundlePipelineContext as
      | import('../context/graphBundlePipelineContextService').GraphBundlePipelineContextResult
      | undefined;

    const assembledContext = assembleAIContext({
      query,
      userContext: userContext as UserContext & { dashboardContext?: Record<string, unknown> },
      analysis,
      attachedFiles,
      smartAnalysis,
      semanticEnhancement,
      userDefinedContext,
      globalPatterns,
      moduleContexts: mergedModuleContexts,
      crossModuleSynthesis,
      recentConversationMemory,
      recalledMessages,
      userMemoryFacts,
      toneMode: responseMode,
      explicitStructuredMode:
        typeof query.context.structuredResponseMode === 'string'
          ? query.context.structuredResponseMode
          : structuredResponseMode,
      effectivePreferencesContextBlock: effectivePreferences?.contextBlock,
      businessWorkspaceBoundaries,
      vlinkPipelineContext: vlinkPipelineContextForAssembly,
      graphBundlePipelineContext: graphBundlePipelineContextForAssembly,
    });
    options.assembledContext = assembledContext;

    const providerFetchAudit = Array.isArray(ctxRecord.providerFetchAudit)
      ? (ctxRecord.providerFetchAudit as ProviderFetchAttempt[])
      : [];
    const requiredSourceFailures = Array.isArray(ctxRecord.requiredSourceFailures)
      ? (ctxRecord.requiredSourceFailures as string[])
      : [];

    const densityReport = buildContextDensityReport({
      assembled: assembledContext,
      providerFetchAudit,
      requiredSourceFailures,
      orchestration: buildOrchestrationDiagnosticsFromQueryContext(ctxRecord),
      assemblyMetrics: assembledContext.assemblyMetrics,
    });
    ctxRecord.contextDensityReport = densityReport;

    if (effectivePreferences) {
      applyResolvedPreferencesToProviderOptions(options, effectivePreferences);
      options.resolvedEffectivePreferences = effectivePreferences;
    }
    options.structuredResponseMode = assembledContext.structuredResponseMode ?? structuredResponseMode;
    options.responseDensity = assembledContext.responseDensity ?? responseDensity;
    options.responseMode = responseMode;
    options.userQuery = query.query;
    // P3: promptProfile remains binary (conversation | enterprise) for legacy wiring;
    // responseContract independently selects thin grounded vs ENTERPRISE_V2 format.
    options.responseContract = responseContract;
    options.requiresAuthoritativeContext = requiresAuthoritativeContextFlag;
    options.promptProfile =
      responseContract === 'conversation' || responseContract === 'grounded_answer'
        ? 'conversation'
        : 'enterprise';

    const authoritativeSourceTypes = new Set([
      'module',
      'file',
      'calendar',
      'drive',
      'business',
    ]);
    const hasAuthoritativeBlocks = (assembledContext.contextBlocks || []).some((b) =>
      authoritativeSourceTypes.has(String(b.sourceType || ''))
    );
    const hasAuthoritativeEvidence = (assembledContext.evidence || []).some((e) =>
      authoritativeSourceTypes.has(String(e.sourceType || ''))
    );
    const contextGroundingFailure = ctxRecord.contextGroundingFailure === true;
    const groundingSatisfied =
      !requiresAuthoritativeContextFlag ||
      (!contextGroundingFailure &&
        (hasAuthoritativeBlocks ||
          hasAuthoritativeEvidence ||
          (assembledContext.usedModules?.length ?? 0) > 0));
    options.groundingSatisfied = groundingSatisfied;
    options.contextProfile =
      responseContract === 'grounded_answer'
        ? 'grounded'
        : responseContract === 'conversation'
          ? 'conversation'
          : 'enterprise';

    if (responseContract === 'conversation' || responseContract === 'grounded_answer') {
      options.conversationHistory = query.conversationHistory ?? [];
      options.conversationThread = buildConversationThreadHints({
        latestUserMessage: query.query,
        recentMessages: query.conversationHistory ?? [],
        continuity: continuityState,
        activeTopic: activeTopic,
      });
    }

    if (conversationReasoning) {
      options.conversationReasoning = conversationReasoning;
      const ctxRecord = query.context as Record<string, unknown>;
      ctxRecord.conversationReasoning = conversationReasoning;
    }

    void logger.debug('[AI_CONTEXT_ASSEMBLY] assembled context', {
      scope: assembledContext.scope,
      intent: assembledContext.intent,
      structuredResponseMode: assembledContext.structuredResponseMode,
      usedModules: assembledContext.usedModules,
      evidenceCount: assembledContext.evidence.length,
      contextBlockCount: assembledContext.contextBlocks.length,
      missingContextCount: assembledContext.missingContext.length,
      ...(conversationReasoning && {
        conversationObjective: conversationReasoning.conversationObjective,
        understandingConfidence: conversationReasoning.understandingConfidence,
        prematureSolutionRisk: conversationReasoning.prematureSolutionRisk,
        recommendedResponseAction: conversationReasoning.recommendedResponseAction,
      }),
    });

    const providerDataPreview = buildProviderData({ options });
    await logger.debug('[AI_PROVIDER_MODE]', {
      operation: 'ai_provider_mode_wiring',
      requestId: traceContext?.requestId,
      conversationId: traceContext?.conversationId,
      provider,
      structuredResponseMode: providerDataPreview.structuredResponseMode,
      responseMode: providerDataPreview.responseMode,
      responseDensity: providerDataPreview.responseDensity,
      promptProfile: providerDataPreview.promptProfile,
      responseContract: providerDataPreview.responseContract,
      hasAssembledContext: Boolean(providerDataPreview.assembledContext),
    });

    const routingConversationId =
      typeof options.conversationId === 'string' ? options.conversationId : traceContext?.conversationId;
    const routingCurrentModule =
      typeof ctxRecord.currentModule === 'string' ? ctxRecord.currentModule : undefined;
    const routingFileIds = ctxRecord.fileIds;
    const hasFileContext = Boolean(
      (attachedFiles && attachedFiles.length > 0) ||
        (visionImageParts && visionImageParts.length > 0) ||
        (Array.isArray(routingFileIds) && routingFileIds.length > 0)
    );
    const hasPlatformContext = Boolean(
      (assembledContext.usedModules?.length ?? 0) > 0 ||
        (assembledContext.contextBlocks?.length ?? 0) > 0
    );
    const routingModel =
      typeof options.modelOverride === 'string'
        ? options.modelOverride
        : resolvedModel ?? undefined;

    void logger.info('AI response routing', {
      operation: 'ai_response_routing',
      requestId: traceContext?.requestId,
      conversationId: routingConversationId,
      responseMode: providerDataPreview.responseMode,
      structuredResponseMode: providerDataPreview.structuredResponseMode,
      promptProfile: providerDataPreview.promptProfile,
      responseContract,
      contextProfile: options.contextProfile,
      informationalAnswerEscape,
      requiresAuthoritativeContext: requiresAuthoritativeContextFlag,
      groundingSatisfied,
      isActionRequest,
      inferredIntent: inferQueryIntent(query.query),
      provider,
      model: routingModel,
      streaming: Boolean(streamOptions?.stream),
      currentModule: routingCurrentModule,
      hasPlatformContext,
      hasFileContext,
    });

    // Phase 0.15: providerData trace before callAIProvider
    const dataKeys = Object.keys(options);
    await logger.debug(`${VISION_PIPELINE_PREFIX} providerData trace`, {
      operation: 'vision_pipeline_provider_data',
      requestId: traceContext?.requestId,
      conversationId: traceContext?.conversationId,
      userId: traceContext?.userId,
      provider,
      dataKeys,
      visionImagePartsLength: (options.visionImageParts as unknown[] | undefined)?.length ?? 0,
    });

    // Generate response — try selected provider, then auto-fallback to other provider on 429/unavailable
    let aiResponse = await this.callAIProvider(provider, query.query, options);
    let round = 0;
    const toolsUsedRecords: PipelineToolUsageRecord[] = [];
    const pendingToolApprovals: Array<{
      approvalId: string;
      executionId?: string;
      tool: string;
      riskCategory?: string;
      args?: Record<string, unknown>;
    }> = [];
    const toolContext = {
      userId: query.userId,
      dashboardId: options.dashboardId as string | null | undefined,
      prisma: this.prisma,
      requestId: traceContext?.requestId,
      conversationId:
        typeof options.conversationId === 'string'
          ? options.conversationId
          : traceContext?.conversationId,
      businessId:
        typeof options.businessId === 'string' && options.businessId.trim() !== ''
          ? options.businessId.trim()
          : undefined,
    };
    while (round < MAX_TOOL_CALL_ROUNDS) {
      const meta = aiResponse.metadata && typeof aiResponse.metadata === 'object' ? aiResponse.metadata as Record<string, unknown> : {};
      const toolCalls = meta.toolCalls as Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }> | undefined;
      if (!toolCalls || toolCalls.length === 0) break;
      const messagesSent = meta.messagesSent as Array<Record<string, unknown>> | undefined;
      if (!messagesSent || messagesSent.length === 0) break;
      round++;
      const results = await Promise.all(
        toolCalls.map(async (tc) => {
          let args: Record<string, unknown> = {};
          let success = true;
          try {
            args = (typeof tc.function?.arguments === 'string' ? JSON.parse(tc.function.arguments) : {}) as Record<string, unknown>;
          } catch {
            // ignore
          }
          let content = '';
          try {
            content = await executeGovernedTool(tc.function.name as AIToolName, args, toolContext);
            try {
              const parsed = JSON.parse(content) as {
                success?: boolean;
                governance?: {
                  status?: string;
                  approvalId?: string;
                  executionId?: string;
                  riskCategory?: string;
                };
                data?: { approvalId?: string; tool?: string; args?: Record<string, unknown> };
              };
              success = Boolean(parsed.success) || parsed.governance?.status === 'AWAITING_APPROVAL';
              if (parsed.governance?.status === 'AWAITING_APPROVAL' && parsed.governance.approvalId) {
                pendingToolApprovals.push({
                  approvalId: parsed.governance.approvalId,
                  executionId: parsed.governance.executionId,
                  tool: tc.function?.name ?? 'unknown',
                  riskCategory: parsed.governance.riskCategory,
                  args: parsed.data?.args ?? args,
                });
              }
            } catch {
              success = true;
            }
          } catch {
            success = false;
            content = 'Tool execution failed';
          }
          toolsUsedRecords.push({
            name: tc.function?.name ?? 'unknown',
            round,
            success,
          });
          return { role: 'tool' as const, tool_call_id: tc.id, content };
        })
      );
      const assistantMsg: Record<string, unknown> = {
        role: 'assistant',
        content: aiResponse.response || null,
        tool_calls: toolCalls.map((tc) => ({ id: tc.id, type: 'function' as const, function: { name: tc.function.name, arguments: tc.function.arguments } })),
      };
      options.messages = [...messagesSent, assistantMsg, ...results];
      aiResponse = await this.callAIProvider(provider, query.query, options);
    }
    const metadata = aiResponse.metadata && typeof aiResponse.metadata === 'object' ? aiResponse.metadata as Record<string, unknown> : {};
    const providerErrored = Boolean(metadata.error);
    const shouldFallback =
      providerErrored &&
      (metadata.code === 'RATE_LIMITED' || metadata.code === 'TEMP_UNAVAILABLE') &&
      (provider === 'openai' || provider === 'anthropic');

    let effectiveProvider = provider;
    if (shouldFallback) {
      const fallbackCode = typeof metadata.code === 'string' ? metadata.code : 'TEMP_UNAVAILABLE';
      if (traceContext?.requestId) {
        emitTwinObservation({
          requestId: traceContext.requestId,
          userId: query.userId,
          conversationId: traceContext.conversationId,
          type: 'ProviderCallFailed',
          sourceComponent: 'DigitalLifeTwinCore',
          idempotencyKey: `ProviderCallFailed:${provider}:${fallbackCode}`,
          metadata: {
            selectedProvider: provider,
            errorCode: fallbackCode,
            failureKind: 'provider',
          },
        });
      }
      const fallbackResolution = resolveLlmFallback(
        provider,
        fallbackCode,
        {
          vision: hasVisionParts && !visionResolution.stripVisionParts,
          toolCalls: Boolean(options.tools),
          streaming: Boolean(streamOptions?.stream),
        },
        llmProviderRouting
      );
      if (fallbackResolution) {
        const fallbackProvider = fallbackResolution.fallbackProvider;
        if (traceContext?.requestId) {
          emitTwinObservation({
            requestId: traceContext.requestId,
            userId: query.userId,
            conversationId: traceContext.conversationId,
            type: 'ProviderFallbackStarted',
            sourceComponent: 'DigitalLifeTwinCore',
            idempotencyKey: `ProviderFallbackStarted:${provider}:${fallbackProvider}`,
            metadata: {
              selectedProvider: provider,
              fallbackDestination: fallbackProvider,
              fallbackReason: fallbackCode,
            },
          });
        }
        await logger.info(`${VISION_PIPELINE_PREFIX} provider fallback (${provider} → ${fallbackProvider})`, {
          operation: 'vision_pipeline_fallback',
          requestId: traceContext?.requestId,
          conversationId: traceContext?.conversationId,
          fromProvider: provider,
          toProvider: fallbackProvider,
          reason: fallbackCode,
        });
        if (fallbackResolution.stripTools) {
          delete options.tools;
          delete options.messages;
        }
        if (fallbackResolution.stripVisionParts) {
          delete options.visionImageParts;
          delete options.visionModelOverride;
        }
        aiResponse = await this.callAIProvider(fallbackProvider, query.query, options);
        effectiveProvider = fallbackProvider;
        finalizeRoutingEffectiveProvider(llmProviderRouting, fallbackProvider);
        if (traceContext?.requestId) {
          emitTwinObservation({
            requestId: traceContext.requestId,
            userId: query.userId,
            conversationId: traceContext.conversationId,
            type: 'ProviderFallbackCompleted',
            sourceComponent: 'DigitalLifeTwinCore',
            idempotencyKey: `ProviderFallbackCompleted:${fallbackProvider}`,
            metadata: {
              selectedProvider: fallbackProvider,
              fallbackDestination: fallbackProvider,
              fallbackReason: fallbackCode,
            },
          });
        }
      }
    }
    ctxRecord.llmProviderRouting = llmProviderRouting;

    const response = typeof aiResponse.response === 'string' ? aiResponse.response : String(aiResponse.response || '');
    const confidence = typeof aiResponse.confidence === 'number' ? aiResponse.confidence : 0.5;
    const reasoning = typeof aiResponse.reasoning === 'string' ? aiResponse.reasoning : "Generated based on your digital life patterns and personality";
    const finalMetadata = aiResponse.metadata && typeof aiResponse.metadata === 'object' ? aiResponse.metadata as Record<string, unknown> : {};
    const finalProviderErrored = Boolean(finalMetadata.error);
    const usedVisionParts = hasVisionParts && !finalProviderErrored && !visionResolution.stripVisionParts;
    if (traceContext?.requestId && hasVisionParts) {
      emitTwinObservation({
        requestId: traceContext.requestId,
        userId: query.userId,
        conversationId: traceContext.conversationId,
        type: usedVisionParts ? 'VisionUsed' : 'VisionPrepared',
        sourceComponent: 'DigitalLifeTwinCore',
        idempotencyKey: usedVisionParts ? 'VisionUsed' : 'VisionPrepared',
        metadata: {
          visionPartCount: Array.isArray(visionParts) ? visionParts.length : 0,
          usedVision: usedVisionParts,
          pdfRenderFallback: Boolean(visionResolution.stripVisionParts),
        },
      });
    }

    const assembledForQuality =
      options?.assembledContext && typeof options.assembledContext === 'object'
        ? (options.assembledContext as {
            evidence?: unknown[];
            missingContext?: string[];
            risks?: string[];
            structuredResponseMode?: string;
          })
        : undefined;
    const quality = validateAIResponseQuality({
      structured: aiResponse.structured as StructuredAIResponse | undefined,
      response,
      assembledContext: assembledForQuality,
      currentConfidence: confidence,
    });
    if (quality.warnings.length > 0) {
      void logger.debug('[AI_RESPONSE_QUALITY]', {
        warnings: quality.warnings,
        adjustedConfidence: quality.adjustedConfidence,
        provider: effectiveProvider,
      });
    }
    const confidenceAfterQuality =
      typeof quality.adjustedConfidence === 'number' ? quality.adjustedConfidence : confidence;

    const assembledForTrace =
      options?.assembledContext && typeof options.assembledContext === 'object'
        ? options.assembledContext
        : undefined;
    const analysisRecord = analysis as Record<string, unknown> | undefined;
    let finalResponseText = response;
    let pipelineTrace = buildPipelineTrace(
      mapOrchestrationToPipelineTraceInput({
        userId: query.userId,
        conversationId: traceContext?.conversationId,
        userMessage: query.query,
        finalResponse: finalResponseText,
        confidence: confidenceAfterQuality,
        assembledContext: assembledForTrace as Record<string, unknown>,
        legacySignals: {
          queryIntent: typeof assembledForTrace === 'object' && assembledForTrace && 'intent' in assembledForTrace
            ? String((assembledForTrace as { intent?: string }).intent ?? '')
            : undefined,
          responseMode: typeof analysisRecord?.responseMode === 'string' ? analysisRecord.responseMode : undefined,
          queryType: typeof analysisRecord?.queryType === 'string' ? analysisRecord.queryType : undefined,
        },
        qualityWarnings: quality.warnings,
        toolsUsed: toolsUsedRecords,
        supplementalToolsUsed: groundingBoostTools,
        supplementalContextRetrieved: groundingBoostRetrieved,
        supplementalSourcesUsed: groundingBoostSources,
        queryContext: query.context as Record<string, unknown>,
        traceId: traceContext?.requestId,
        enforcementApplied: retrievalBoostApplied,
        enforcementAction: retrievalBoostApplied ? 'retrieval_boost' : 'none',
      }),
      { catalog: pipelineCatalog }
    );

    if (!pipelineOptions?.skipEnforcement) {
      if (traceContext?.requestId) {
        emitTwinObservation({
          requestId: traceContext.requestId,
          userId: query.userId,
          conversationId: traceContext.conversationId,
          type: 'GroundingStarted',
          sourceComponent: 'DigitalLifeTwinCore',
          idempotencyKey: 'GroundingStarted',
          metadata: { groundingRequired: true },
        });
      }
      const enforced = applyPipelineEnforcement(finalResponseText, pipelineTrace, enforcementSettings);
      finalResponseText = enforced.response;
      pipelineTrace = {
        ...pipelineTrace,
        ...enforced.tracePatch,
        finalResponsePreview: enforced.tracePatch.finalResponsePreview,
      };
      if (traceContext?.requestId) {
        emitTwinObservation({
          requestId: traceContext.requestId,
          userId: query.userId,
          conversationId: traceContext.conversationId,
          type: 'EnforcementApplied',
          sourceComponent: 'DigitalLifeTwinCore',
          idempotencyKey: 'EnforcementApplied',
          metadata: {
            enforcementResult: enforced.tracePatch.enforcementAction,
            groundingStatus: 'evaluated',
          },
        });
        emitTwinObservation({
          requestId: traceContext.requestId,
          userId: query.userId,
          conversationId: traceContext.conversationId,
          type: 'GroundingEvaluated',
          sourceComponent: 'DigitalLifeTwinCore',
          idempotencyKey: 'GroundingEvaluated',
          metadata: { groundingStatus: 'evaluated' },
        });
      }
    }

    const evidenceBundle = buildPipelineEvidenceBundle({
      trace: pipelineTrace,
      assembledContext: assembledForTrace as Record<string, unknown> | undefined,
      structuredResponse: aiResponse.structured as StructuredAIResponse | undefined,
    });
    pipelineTrace = { ...pipelineTrace, evidenceBundle };

    void logger.debug('[AI_PIPELINE_TRACE]', {
      operation: 'ai_pipeline_trace_built',
      traceId: pipelineTrace.traceId,
      intentDetected: pipelineTrace.intentDetected,
      groundingRequired: pipelineTrace.groundingRequired,
      genericResponseRisk: pipelineTrace.genericResponseRisk,
      retrievalPerformed: pipelineTrace.retrievalPerformed,
    });

    return {
      response: finalResponseText,
      confidence: confidenceAfterQuality,
      reasoning,
      modulesFocused: (analysis as any)?.scope?.modules || [],
      patternMatches: (analysis as any)?.relevantPatterns?.map((p: any) => p.id) || [],
      provider: effectiveProvider,
      structured: aiResponse.structured,
      usedVisionParts,
      pipelineTrace,
      assembledContext: assembledForTrace as AIAssembledContext | undefined,
      ...(quality.warnings.length > 0 && { aiResponseQualityWarnings: quality.warnings }),
      ...(pendingToolApprovals.length > 0 && { pendingToolApprovals }),
    };
  }


  /**
   * Identify cross-module connections and opportunities
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async identifyCrossModuleConnections(
    query: LifeTwinQuery, 
    userContext: UserContext, 
    response: any,
    entityLinks?: EntityLinkingResult
  ): Promise<CrossModuleConnection[]> {
    const connections: CrossModuleConnection[] = [];

    if (entityLinks && entityLinks.links.length > 0) {
      connections.push(...buildConnectionsFromEntityLinks(entityLinks));
    }

    if (connections.length > 0 || !isSyntheticContextEnabled()) {
      return connections;
    }
    
    // Legacy keyword heuristics (dev only when AI_SYNTHETIC_CONTEXT_ENABLED=true)
    // Workflow connections
    if (query.query.toLowerCase().includes('schedule') || query.query.toLowerCase().includes('meeting')) {
      connections.push({
        type: 'workflow',
        description: 'Scheduling affects Calendar, Chat notifications, and Drive document sharing',
        modules: ['household', 'chat', 'drive'],
        strength: 0.8,
        actionable: true,
        suggestedAction: 'Automatically share relevant documents with meeting participants'
      });
    }
    
    // Relationship connections
    const mentionedPeople = this.extractPeopleFromQuery(query.query);
    if (mentionedPeople.length > 0) {
      connections.push({
        type: 'relationship',
        description: `Actions involving ${mentionedPeople.join(', ')} may affect multiple communication channels`,
        modules: ['chat', 'business'],
        strength: 0.7,
        actionable: true,
        suggestedAction: 'Consider notifying all relevant channels'
      });
    }
    
    // Pattern-based connections
    const relevantPatterns = userContext.patterns.filter((p: any) => 
      this.isPatternRelevant(p as any, query.query.toLowerCase(), 'action')
    );
    
    relevantPatterns.forEach((pattern: any) => {
      if (pattern.modules.length > 1) {
        connections.push({
          type: 'pattern',
          description: `This aligns with your ${pattern.pattern} pattern across ${pattern.modules.join(' and ')}`,
          modules: pattern.modules,
          strength: pattern.confidence,
          actionable: pattern.impact === 'positive',
          suggestedAction: pattern.impact === 'positive' ? 'Leverage this pattern for efficiency' : 'Consider adjusting approach'
        });
      }
    });
    
    return connections;
  }

  /**
   * Determine actions the Digital Life Twin should take
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async determineActions(
    query: LifeTwinQuery, 
    userContext: UserContext, 
    personality: any, 
    response: any
  ): Promise<LifeTwinAction[]> {
    const actions: LifeTwinAction[] = [];
    const queryLower = query.query.toLowerCase();
    
    // Get autonomy settings
    const autonomySettings = await this.getAutonomySettings(query.userId);
    
    // Schedule-related actions
    if (queryLower.includes('schedule') || queryLower.includes('meeting') || queryLower.includes('calendar')) {
      const scheduleAction = await this.createScheduleAction(query, userContext, autonomySettings);
      if (scheduleAction) actions.push(scheduleAction);
    }
    
    // Communication actions
    if (queryLower.includes('message') || queryLower.includes('email') || queryLower.includes('notify')) {
      const commAction = await this.createCommunicationAction(query, userContext, autonomySettings);
      if (commAction) actions.push(commAction);
    }
    
    // File organization actions
    if (queryLower.includes('organize') || queryLower.includes('file') || queryLower.includes('folder')) {
      const fileAction = await this.createFileAction(query, userContext, autonomySettings);
      if (fileAction) actions.push(fileAction);
    }
    
    // Task management actions
    if (queryLower.includes('task') || queryLower.includes('todo') || queryLower.includes('remind')) {
      // Check if this is a priority-related query
      if (queryLower.includes('priorit') || queryLower.includes('focus') || 
          queryLower.includes('what should i') || queryLower.includes('optimize')) {
        const priorityAction = await this.createPriorityAction(query, userContext, autonomySettings);
        if (priorityAction) actions.push(priorityAction);
      } else {
        const taskAction = await this.createTaskAction(query, userContext, autonomySettings);
        if (taskAction) actions.push(taskAction);
      }
    }
    
    // Analysis actions
    if (queryLower.includes('analyze') || queryLower.includes('report') || queryLower.includes('summary')) {
      const analysisAction = await this.createAnalysisAction(query, userContext, autonomySettings);
      if (analysisAction) actions.push(analysisAction);
    }
    
    return actions;
  }

  // Action creation methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async createScheduleAction(query: LifeTwinQuery, userContext: UserContext, autonomySettings: any): Promise<LifeTwinAction | null> {
    if (autonomySettings?.scheduling < 30) return null; // User prefers manual scheduling
    
    return {
      id: `schedule_${Date.now()}`,
      type: 'schedule',
      module: 'household',
      description: 'Create calendar event based on request',
      data: {
        title: this.extractEventTitle(query.query),
        duration: this.extractDuration(query.query) || 60,
        participants: this.extractPeopleFromQuery(query.query)
      },
      requiresApproval: autonomySettings.scheduling < 70,
      approvalReason: autonomySettings.scheduling < 70 ? 'User prefers approval for scheduling' : undefined,
      confidence: 0.8,
      priority: 'medium',
      estimatedTime: 5,
      peopleAffected: this.extractPeopleFromQuery(query.query),
      consequences: ['Calendar will be updated', 'Participants will be notified']
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async createCommunicationAction(query: LifeTwinQuery, userContext: UserContext, autonomySettings: any): Promise<LifeTwinAction | null> {
    if (autonomySettings.communication < 40) return null;
    
    return {
      id: `comm_${Date.now()}`,
      type: 'communicate',
      module: 'chat',
      description: 'Send message or notification',
      data: {
        recipients: this.extractPeopleFromQuery(query.query),
        message: this.extractMessageContent(query.query),
        channel: 'chat'
      },
      requiresApproval: autonomySettings.communication < 80,
      confidence: 0.7,
      priority: 'medium',
      estimatedTime: 2,
      peopleAffected: this.extractPeopleFromQuery(query.query),
      consequences: ['Message will be sent', 'Recipients will be notified']
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async createFileAction(query: LifeTwinQuery, userContext: UserContext, autonomySettings: any): Promise<LifeTwinAction | null> {
    if (autonomySettings.fileManagement < 50) return null;
    
    return {
      id: `file_${Date.now()}`,
      type: 'organize',
      module: 'drive',
      description: 'Organize files based on patterns',
      data: {
        action: 'organize',
        criteria: this.extractOrganizationCriteria(query.query)
      },
      requiresApproval: autonomySettings.fileManagement < 80,
      confidence: 0.75,
      priority: 'low',
      estimatedTime: 15,
      peopleAffected: [],
      consequences: ['Files will be reorganized', 'Folder structure may change']
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async createTaskAction(query: LifeTwinQuery, userContext: UserContext, autonomySettings: any): Promise<LifeTwinAction | null> {
    if (autonomySettings.taskCreation < 40) return null;
    
    return {
      id: `task_${Date.now()}`,
      type: 'create',
      module: 'todo',
      description: 'Create task based on request',
      data: {
        title: this.extractTaskTitle(query.query),
        priority: this.extractPriority(query.query),
        dueDate: this.extractDueDate(query.query)
      },
      requiresApproval: autonomySettings.taskCreation < 70,
      confidence: 0.8,
      priority: 'medium',
      estimatedTime: 3,
      peopleAffected: [],
      consequences: ['New task will be created', 'Task will appear in To-Do module']
    };
  }

  /**
   * Create priority action for task prioritization
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async createPriorityAction(query: LifeTwinQuery, userContext: UserContext, autonomySettings: any): Promise<LifeTwinAction | null> {
    // Priority changes are lower risk, so allow with lower autonomy threshold
    if (autonomySettings.taskCreation < 30) return null;
    
    const queryLower = query.query.toLowerCase();
    const isBulk = queryLower.includes('all') || queryLower.includes('tasks') || queryLower.includes('my tasks');
    
    return {
      id: `priority_${Date.now()}`,
      type: 'organize' as const,
      module: 'todo',
      description: isBulk 
        ? 'Analyze and prioritize all tasks' 
        : 'Analyze and suggest task priorities',
      data: {
        action: isBulk ? 'bulk_prioritize' : 'analyze_priorities',
        targetId: undefined,
        operation: undefined,
        parameters: undefined,
        context: {
          dashboardId: (userContext as any).dashboardContext?.dashboardId,
          businessId: (userContext as any).dashboardContext?.businessId,
        },
      } as LifeTwinActionData,
      requiresApproval: autonomySettings.taskCreation < 60, // Lower threshold for priority changes
      approvalReason: autonomySettings.taskCreation < 60 
        ? 'User prefers approval for priority changes' 
        : undefined,
      confidence: 0.75,
      priority: 'medium',
      estimatedTime: 5,
      peopleAffected: [],
      consequences: ['Task priorities will be analyzed', 'Priority suggestions will be generated']
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async createAnalysisAction(query: LifeTwinQuery, userContext: UserContext, autonomySettings: any): Promise<LifeTwinAction | null> {
    return {
      id: `analysis_${Date.now()}`,
      type: 'analyze',
      module: 'ai',
      description: 'Generate analysis or insights',
      data: {
        type: 'insight_generation',
        scope: this.extractAnalysisScope(query.query)
      },
      requiresApproval: false, // Analysis generally doesn't require approval
      confidence: 0.9,
      priority: 'medium',
      estimatedTime: 10,
      peopleAffected: [],
      consequences: ['Analysis will be generated', 'Insights will be provided']
    };
  }

  // Utility methods
  private determineQueryType(query: string): string {
    if (query.includes('schedule') || query.includes('calendar')) return 'scheduling';
    if (query.includes('message') || query.includes('send') || query.includes('email')) return 'communication';
    if (query.includes('organize') || query.includes('file') || query.includes('folder')) return 'organization';
    if (query.includes('analyze') || query.includes('report') || query.includes('summary')) return 'analysis';
    if (query.includes('task') || query.includes('todo') || query.includes('remind')) return 'task_management';
    if (query.includes('?') || query.includes('how') || query.includes('what') || query.includes('why')) return 'question';
    return 'general';
  }

  private determineQueryScope(query: string, userContext: UserContext): { type: string; modules: string[] } {
    const modules = [];
    if (query.includes('drive') || query.includes('file') || query.includes('document')) modules.push('drive');
    if (query.includes('chat') || query.includes('message') || query.includes('conversation')) modules.push('chat');
    if (query.includes('household') || query.includes('task') || query.includes('schedule')) modules.push('household');
    if (query.includes('business') || query.includes('project') || query.includes('team')) modules.push('business');
    
    return {
      type: modules.length > 1 ? 'cross_module' : 'single_module',
      modules: modules.length > 0 ? modules : [userContext.currentFocus.module]
    };
  }

  private determineUrgency(query: string, contextUrgency?: string): string {
    if (contextUrgency) return contextUrgency;
    if (query.includes('urgent') || query.includes('asap') || query.includes('now')) return 'high';
    if (query.includes('soon') || query.includes('today')) return 'medium';
    return 'low';
  }

  private requiresAction(query: string): boolean {
    const actionWords = ['schedule', 'create', 'send', 'organize', 'delete', 'update', 'remind', 'notify'];
    return actionWords.some(word => query.includes(word));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private calculateQueryComplexity(query: string, scope: any, patternCount: number): string {
    let complexity = 0;
    complexity += query.split(' ').length > 10 ? 2 : 1;
    complexity += scope.type === 'cross_module' ? 2 : 1;
    complexity += patternCount > 3 ? 2 : 1;
    
    if (complexity >= 5) return 'high';
    if (complexity >= 3) return 'medium';
    return 'low';
  }

  private isPatternRelevant(pattern: Record<string, unknown>, query: string, queryType: string): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = pattern as any;
    return p.modules?.some((module: string) => query.includes(module)) ||
           p.type === queryType ||
           query.includes(p.pattern?.toLowerCase() || '');
  }

  private isRelationshipRelevant(relationship: Record<string, unknown>, query: string, queryType: string): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = relationship as any;
    return query.includes(r.name?.toLowerCase() || '') ||
           (queryType === 'communication' && r.modules?.includes('chat'));
  }

  private extractRelevantInsights(userContext: UserContext, query: LifeTwinQuery): CrossModuleInsight[] {
    return userContext.crossModuleInsights
      .filter(insight => {
        if (insight.synthetic && !isSyntheticContextEnabled()) {
          return false;
        }
        const queryLower = query.query.toLowerCase();
        return insight.modules.some(module => query.context.currentModule === module) ||
               queryLower.includes(insight.type) ||
               insight.title.toLowerCase().includes(queryLower.split(' ')[0]);
      })
      .slice(0, 3);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private calculatePersonalityAlignment(response: any, personality: any): number {
    // Calculate how well the response aligns with user's personality
    // This is a simplified calculation - could be much more sophisticated
    let alignment = 0.5; // Base alignment
    
    if (personality?.traits?.conscientiousness > 70 && response.response.includes('organize')) {
      alignment += 0.2;
    }
    
    if (personality?.traits?.extraversion > 70 && response.response.includes('collaborate')) {
      alignment += 0.2;
    }
    
    if (personality?.preferences?.communication?.formality === 'formal' && 
        !response.response.includes('hey') && !response.response.includes('cool')) {
      alignment += 0.1;
    }
    
    return Math.min(alignment, 1.0);
  }

  /**
   * @param requestQuery Fallback for AIRequest.query; providers use data.userQuery when set (twin path always sets userQuery).
   */
  private async callAIProvider(
    provider: string,
    requestQuery: string,
    options: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    try {
      // Create AI request object
      const aiRequest = {
        id: `ai_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: options.userId || 'system',
        query: requestQuery,
        context: options,
        timestamp: new Date(),
        priority: 'medium' as const
      };

      const resolved = options.resolvedEffectivePreferences as ResolvedEffectivePreferences | undefined;
      const prefFields = resolved
        ? buildProviderUserContextFromPreferences(resolved)
        : {
            personality:
              options.personalityForProvider && typeof options.personalityForProvider === 'object'
                ? (options.personalityForProvider as Record<string, unknown>)
                : {},
            autonomySettings:
              options.autonomyBoundariesForProvider &&
              typeof options.autonomyBoundariesForProvider === 'object'
                ? (options.autonomyBoundariesForProvider as Record<string, unknown>)
                : {},
          };

      const userContext = {
        userId: options.userId || 'system',
        personalityProfile: {},
        preferences: {},
        recentActivity: [],
        dashboardContext: {},
        personality: prefFields.personality,
        autonomySettings: prefFields.autonomySettings,
      };

      // Call the appropriate provider (pass options as data so providers can use visionImageParts and traceContext)
      // Phase 1: resolve via factory (overrideable in tests without network)
      const aiRequestTyped = aiRequest as any; // AI request structures are runtime-determined
      const userContextTyped = userContext as any; // User context structures are runtime-determined
      const providerData = buildProviderData({ options: options || {} });

      if (providerData.assembledContext && typeof providerData.assembledContext === 'object') {
        const ac = providerData.assembledContext as Record<string, unknown>;
        await logger.debug('[AI_CONTEXT_PROVIDER]', {
          scope: ac.scope,
          intent: ac.intent,
          structuredResponseMode: providerData.structuredResponseMode,
          responseDensity: providerData.responseDensity,
          evidenceCount: Array.isArray(ac.evidence) ? ac.evidence.length : 0,
          contextBlockCount: Array.isArray(ac.contextBlocks) ? ac.contextBlocks.length : 0,
        });
      }
      const resolvedProvider = await resolveAIProvider(provider);
      const dataForProvider =
        provider === 'local'
          ? providerData.traceContext
            ? { traceContext: providerData.traceContext }
            : {}
          : providerData;
      const response = await resolvedProvider.process(
        aiRequestTyped,
        userContextTyped,
        dataForProvider
      );

      return {
        response: response.response,
        confidence: response.confidence,
        reasoning: response.reasoning || "Generated using AI provider analysis",
        structured: response.structured,
        metadata: response.metadata,
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.error(`Error calling AI provider ${provider}`, {
        operation: 'digital_life_twin_call_provider_error',
        error: { message: err.message, stack: err.stack },
        provider,
      });
      const errMessage = error instanceof Error ? error.message : 'Unknown error';
      // Fallback to mock response if AI provider fails; include metadata.error so Core can set usedVisionParts = false
      return {
        response: "I understand your request and I'm working to provide the best response. (AI provider temporarily unavailable)",
        confidence: 0.6,
        reasoning: "Fallback response due to AI provider connection issue",
        metadata: { provider, error: errMessage } as Record<string, unknown>,
      };
    }
  }

  private async getAutonomySettings(userId: string): Promise<Record<string, unknown>> {
    const settings = await this.prisma.aIAutonomySettings.findUnique({
      where: { userId }
    });
    
    return settings || {
      scheduling: 50,
      communication: 30,
      fileManagement: 60,
      taskCreation: 50,
      dataAnalysis: 80,
      crossModuleActions: 40
    };
  }

  // Extraction utility methods
  private extractEventTitle(query: string): string {
    // Simple extraction - could be much more sophisticated
    const words = query.split(' ');
    const scheduleIndex = words.findIndex(w => w.includes('schedule') || w.includes('meeting'));
    return scheduleIndex >= 0 ? words.slice(scheduleIndex + 1, scheduleIndex + 4).join(' ') : 'New Event';
  }

  private extractDuration(query: string): number | null {
    const match = query.match(/(\d+)\s*(hour|minute|hr|min)/i);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      return unit.startsWith('hour') || unit === 'hr' ? value * 60 : value;
    }
    return null;
  }

  private extractPeopleFromQuery(query: string): string[] {
    // Simple name extraction - could use NER for better results
    const commonNames = ['sarah', 'john', 'mike', 'jane', 'alex', 'chris', 'sam'];
    const words = query.toLowerCase().split(' ');
    return words.filter(word => commonNames.includes(word));
  }

  private extractMessageContent(query: string): string {
    // Extract message content from query
    const messageIndicators = ['message', 'tell', 'send', 'notify'];
    const words = query.split(' ');
    
    for (const indicator of messageIndicators) {
      const index = words.findIndex(w => w.toLowerCase().includes(indicator));
      if (index >= 0) {
        return words.slice(index + 1).join(' ');
      }
    }
    
    return query;
  }

  private extractOrganizationCriteria(query: string): string {
    if (query.includes('date')) return 'by_date';
    if (query.includes('type') || query.includes('extension')) return 'by_type';
    if (query.includes('project')) return 'by_project';
    return 'by_type';
  }

  private extractTaskTitle(query: string): string {
    const taskIndicators = ['task', 'todo', 'remind'];
    const words = query.split(' ');
    
    for (const indicator of taskIndicators) {
      const index = words.findIndex(w => w.toLowerCase().includes(indicator));
      if (index >= 0) {
        return words.slice(index + 1, index + 5).join(' ');
      }
    }
    
    return 'New Task';
  }

  private extractPriority(query: string): string {
    if (query.includes('urgent') || query.includes('high')) return 'HIGH';
    if (query.includes('low')) return 'LOW';
    return 'MEDIUM';
  }

  private extractDueDate(query: string): Date | null {
    if (query.includes('today')) return new Date();
    if (query.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    return null;
  }

  private extractAnalysisScope(query: string): string {
    if (query.includes('productivity')) return 'productivity';
    if (query.includes('relationship')) return 'relationships';
    if (query.includes('file') || query.includes('organization')) return 'organization';
    if (query.includes('communication')) return 'communication';
    return 'general';
  }

  /**
   * Create fallback user context when full context cannot be loaded
   */
  private createFallbackUserContext(userId: string): UserContext {
    return {
      userId,
      timestamp: new Date(),
      activeModules: ['household', 'chat', 'drive', 'business'],
      crossModuleInsights: [],
      currentFocus: {
        module: 'general',
        activity: 'general_usage',
        priority: 'medium',
        timeSpent: 0
      },
      patterns: [],
      relationships: [],
      preferences: {
        communication: {
          preferredChannels: ['email', 'chat'],
          responseTimeExpectations: { email: 240, chat: 30 },
          formalityLevel: 70,
          timezone: 'UTC'
        },
        work: {
          productiveHours: [9, 10, 11, 14, 15, 16],
          focusBlockPreference: 120,
          interruptionTolerance: 50,
          collaborationStyle: 'collaborative',
          prioritizationMethod: 'importance'
        },
        personal: {
          socialEngagement: 70,
          privacyLevel: 80,
          sharingComfort: 60,
          planningHorizon: 7
        }
      },
      lifeState: {
        workLifeBalance: { 
          score: 70, 
          trend: 'stable', 
          concerns: [], 
          opportunities: [] 
        },
        productivity: { 
          score: 75, 
          peakHours: [9, 10, 14, 15], 
          efficiency: 75,
          bottlenecks: [] 
        },
        relationships: { 
          score: 80, 
          socialConnections: 25, 
          communicationHealth: 80,
          networkGrowth: 5 
        },
        goals: {
          activeGoals: 5,
          progressRate: 70,
          completionRate: 80,
          alignment: 75
        }
      }
    };
  }
}

export default DigitalLifeTwinCore;