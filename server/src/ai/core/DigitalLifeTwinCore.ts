import { PrismaClient } from '@prisma/client';
import { CrossModuleContextEngine, UserContext, CrossModuleInsight } from '../context/CrossModuleContextEngine';
import { PersonalityEngine } from './PersonalityEngine';
import { DecisionEngine } from './DecisionEngine';
import { AdvancedLearningEngine } from '../learning/AdvancedLearningEngine';
import { ActionExecutor } from './ActionExecutor';
import { SmartPatternEngine } from '../intelligence/SmartPatternEngine';
import { CentralizedLearningEngine } from '../learning/CentralizedLearningEngine';
import { randomUUID } from 'crypto';
import { prisma as sharedPrisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import type { StructuredAIResponse } from '../types/structuredResponse';
import type { FileIssue } from '../types/fileIssues';
import { getMessageForCode } from '../types/fileIssues';
import { executeTool } from '../tools/toolExecutor';
import { AI_TOOL_DEFINITIONS } from '../tools/toolDefinitions';
import type { AIToolName } from '../tools/toolDefinitions';
import { getModel } from '../providers/modelCatalog';
import { assembleAIContext } from '../context/AIContextAssembler';
import { validateAIResponseQuality } from '../utils/validateAIResponseQuality';
import {
  updateConversationContinuityState,
  type ConversationContinuityState,
  type ActiveTopicState,
} from '../utils/conversationContinuity';
import { inferResponseMode, type AIResponseMode } from '../utils/responseMode';
import { inferStructuredResponseMode } from '../utils/structuredResponseMode';
import type { AIResponseMode as StructuredAIResponseMode } from '../types/structuredResponse';

const VISION_PIPELINE_PREFIX = '[VISION_PIPELINE]';
const MODEL_PREF_KEYS: Record<string, string> = {
  openai: 'ai_preferred_model_openai',
  anthropic: 'ai_preferred_model_anthropic',
};
const MAX_TOOL_CALL_ROUNDS = 3;

/** Max chars for attached-files context in the prompt (~15k tokens). Keeps total context within model limits. */
const MAX_ATTACHED_FILES_CONTEXT_CHARS = 60000;

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
  };
  userId: string;
  conversationHistory?: ConversationHistoryItem[];
  continuityState?: ConversationContinuityState;
  activeTopic?: ActiveTopicState;
  preferredProvider?: 'auto' | 'openai' | 'anthropic';
  /** Optional model id override (e.g. gpt-4o-mini). Validated in Core against modelCatalog. */
  preferredModel?: string;
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

    try {
      // Validate input
      if (!query || !query.query || !query.userId) {
        throw new Error('Invalid query: missing required fields');
      }

      // 1. 🚀 NEW: Get SMART context - only fetches relevant modules based on query
      let userContext: UserContext;
      let smartContext: Record<string, unknown> | null = null;
      try {
        const ctx = query.context as Record<string, unknown> | undefined;
        const businessId =
          ctx && typeof ctx.businessId === 'string' && ctx.businessId.trim() !== ''
            ? ctx.businessId.trim()
            : undefined;
        // Use the NEW intelligent context fetching system
        smartContext = await this.contextEngine?.getContextForAIQuery(
          query.userId,
          query.query,
          businessId
        );
        
        // Convert smart context to UserContext format for backward compatibility
        userContext = (smartContext as any)?.fullContext || await this.contextEngine?.getUserContext(query.userId) || this.createFallbackUserContext(query.userId);
        
        void logger.info('Smart context fetched', {
          operation: 'digital_life_twin_smart_context',
          relevantModuleCount: (smartContext as Record<string, unknown>)?.relevantModuleCount ?? 0,
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
          const files = await this.prisma.file.findMany({
            where: {
              id: { in: contextFileIds },
              trashedAt: null,
              OR: [
                { userId: query.userId },
                { permissions: { some: { userId: query.userId, canRead: true } } },
              ],
            },
            select: {
              id: true,
              name: true,
              size: true,
              path: true,
              url: true,
              type: true,
              createdAt: true,
            },
          });
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
            active: true
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

      // 2b. Get relevant global patterns (collective learning) - makes system smarter for everyone
      let globalPatterns: Array<Record<string, unknown>> = [];
      try {
        if (this.centralizedLearning) {
          // Get user's segment (business, personal, household, enterprise, or all)
          const userSegment = query.context.dashboardType === 'business' ? 'business' : 
                             query.context.dashboardType === 'household' ? 'household' : 'personal';
          
          // Get relevant global patterns from database
          const patterns = await this.prisma.globalPattern.findMany({
            where: {
              OR: [
                { userSegment: 'all' },
                { userSegment: userSegment }
              ],
              confidence: { gte: 0.7 }, // Only high-confidence patterns
              impact: { in: ['positive', 'neutral'] } // Only positive or neutral patterns
            },
            orderBy: [
              { confidence: 'desc' },
              { frequency: 'desc' }
            ],
            take: 5 // Top 5 most relevant global patterns
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
      
      // 6. Generate Digital Life Twin response (enhanced with smart insights, semantics, collective learning, attached file context, and vision images)
      const t0_provider = Date.now();
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
        streamOptions
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
        connections = await this.identifyCrossModuleConnections(query, userContext, response);
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
      
      // 9. Learn from this interaction (using mock AIRequest/AIResponse for now)
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

      const processingTime = Date.now() - startTime;

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
          contextUsed: Object.keys(userContext),
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
    streamOptions?: { stream: boolean; onChunk: (text: string) => void }
  ) {
    const structuredInference = inferStructuredResponseMode({
      query: query.query,
      explicitMode:
        typeof query.context.structuredResponseMode === 'string'
          ? query.context.structuredResponseMode
          : undefined,
      toneMode: responseMode,
      isFollowUp: Boolean(query.conversationHistory && query.conversationHistory.length > 0),
    });
    const structuredResponseMode = structuredInference.mode;

    // Build context-aware prompt (enhanced with smart patterns, semantics, collective learning, and attached files)
    const prompt = this.buildDigitalTwinPrompt(
      query,
      userContext,
      personality,
      analysis,
      smartAnalysis,
      semanticEnhancement,
      userDefinedContext,
      globalPatterns,
      responseMode,
      structuredResponseMode,
      continuityState,
      activeTopic,
      attachedFiles
    );
    
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
    
    const provider = this.selectAIProvider(
      (analysis as any)?.complexity || 'medium',
      query.query,
      preferredProvider
    );

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

    // Phase 4: capability-aware vision — ensure vision model when images present; apply modelOverride for cloud providers
    const visionParts = options.visionImageParts as unknown[] | undefined;
    const hasVisionParts = Array.isArray(visionParts) && visionParts.length > 0;
    let modelOverride: string | null = null;

    if (hasVisionParts) {
      const { getProviderCapabilities } = await import('../providers/capabilities');
      const caps = getProviderCapabilities(provider as 'openai' | 'anthropic' | 'local');
      if (caps.supportsVisionInput && caps.visionModel) {
        const preferredSupportsVision = resolvedModel ? (getModel(resolvedModel)?.supportsVision ?? false) : false;
        modelOverride = preferredSupportsVision && resolvedModel ? resolvedModel : caps.visionModel;
        options.visionModelOverride = modelOverride;
        await logger.info(`${VISION_PIPELINE_PREFIX} vision request → model`, {
          operation: 'vision_pipeline_model_selection',
          requestId: traceContext?.requestId,
          conversationId: traceContext?.conversationId,
          provider,
          model: modelOverride,
          visionPartsCount: visionParts.length,
        });
      } else {
        await logger.info(`${VISION_PIPELINE_PREFIX} vision not supported by provider, using file summaries only`, {
          operation: 'vision_pipeline_no_vision',
          requestId: traceContext?.requestId,
          conversationId: traceContext?.conversationId,
          provider,
        });
        delete options.visionImageParts;
      }
    } else if (resolvedModel && (provider === 'openai' || provider === 'anthropic')) {
      modelOverride = resolvedModel;
    }

    if (modelOverride && (provider === 'openai' || provider === 'anthropic')) {
      options.modelOverride = modelOverride;
    }

    const assembledContext = assembleAIContext({
      query,
      userContext: userContext as UserContext & { dashboardContext?: Record<string, unknown> },
      analysis,
      attachedFiles,
      smartAnalysis,
      semanticEnhancement,
      userDefinedContext,
      globalPatterns,
      toneMode: responseMode,
      explicitStructuredMode:
        typeof query.context.structuredResponseMode === 'string'
          ? query.context.structuredResponseMode
          : structuredResponseMode,
    });
    options.assembledContext = assembledContext;
    options.structuredResponseMode = assembledContext.structuredResponseMode ?? structuredResponseMode;

    void logger.debug('[AI_CONTEXT_ASSEMBLY] assembled context', {
      scope: assembledContext.scope,
      intent: assembledContext.intent,
      structuredResponseMode: assembledContext.structuredResponseMode,
      usedModules: assembledContext.usedModules,
      evidenceCount: assembledContext.evidence.length,
      contextBlockCount: assembledContext.contextBlocks.length,
      missingContextCount: assembledContext.missingContext.length,
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
    let aiResponse = await this.callAIProvider(provider, prompt, options);
    let round = 0;
    const toolContext = { userId: query.userId, dashboardId: options.dashboardId as string | null | undefined };
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
          try {
            args = (typeof tc.function?.arguments === 'string' ? JSON.parse(tc.function.arguments) : {}) as Record<string, unknown>;
          } catch {
            // ignore
          }
          const content = await executeTool(tc.function.name as AIToolName, args, toolContext);
          return { role: 'tool' as const, tool_call_id: tc.id, content };
        })
      );
      const assistantMsg: Record<string, unknown> = {
        role: 'assistant',
        content: aiResponse.response || null,
        tool_calls: toolCalls.map((tc) => ({ id: tc.id, type: 'function' as const, function: { name: tc.function.name, arguments: tc.function.arguments } })),
      };
      options.messages = [...messagesSent, assistantMsg, ...results];
      aiResponse = await this.callAIProvider(provider, prompt, options);
    }
    const metadata = aiResponse.metadata && typeof aiResponse.metadata === 'object' ? aiResponse.metadata as Record<string, unknown> : {};
    const providerErrored = Boolean(metadata.error);
    const shouldFallback =
      providerErrored &&
      (metadata.code === 'RATE_LIMITED' || metadata.code === 'TEMP_UNAVAILABLE') &&
      (provider === 'openai' || provider === 'anthropic');

    if (shouldFallback) {
      const fallbackProvider = provider === 'openai' ? 'anthropic' : 'openai';
      await logger.info(`${VISION_PIPELINE_PREFIX} provider fallback (${provider} → ${fallbackProvider})`, {
        operation: 'vision_pipeline_fallback',
        requestId: traceContext?.requestId,
        conversationId: traceContext?.conversationId,
        fromProvider: provider,
        toProvider: fallbackProvider,
        reason: metadata.code,
      });
      aiResponse = await this.callAIProvider(fallbackProvider, prompt, options);
    }

    const response = typeof aiResponse.response === 'string' ? aiResponse.response : String(aiResponse.response || '');
    const confidence = typeof aiResponse.confidence === 'number' ? aiResponse.confidence : 0.5;
    const reasoning = typeof aiResponse.reasoning === 'string' ? aiResponse.reasoning : "Generated based on your digital life patterns and personality";
    const finalMetadata = aiResponse.metadata && typeof aiResponse.metadata === 'object' ? aiResponse.metadata as Record<string, unknown> : {};
    const finalProviderErrored = Boolean(finalMetadata.error);
    const usedVisionParts = hasVisionParts && !finalProviderErrored;
    const effectiveProvider = shouldFallback ? (provider === 'openai' ? 'anthropic' : 'openai') : provider;

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

    return {
      response,
      confidence: confidenceAfterQuality,
      reasoning,
      modulesFocused: (analysis as any)?.scope?.modules || [],
      patternMatches: (analysis as any)?.relevantPatterns?.map((p: any) => p.id) || [],
      provider: effectiveProvider,
      structured: aiResponse.structured,
      usedVisionParts,
      ...(quality.warnings.length > 0 && { aiResponseQualityWarnings: quality.warnings }),
    };
  }

  /**
   * Build comprehensive prompt for Digital Life Twin (enhanced with smart patterns and semantics)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildDigitalTwinPrompt(
    query: LifeTwinQuery,
    userContext: UserContext,
    personality: any,
    analysis: any,
    smartAnalysis?: any,
    semanticEnhancement?: any,
    userDefinedContext?: Array<Record<string, unknown>>,
    globalPatterns?: Array<Record<string, unknown>>,
    responseMode?: AIResponseMode,
    structuredResponseMode?: StructuredAIResponseMode,
    continuityState?: ConversationContinuityState,
    activeTopic?: ActiveTopicState,
    attachedFiles?: AttachedFileContext[]
  ): string {
    const isConversation = structuredResponseMode === 'conversation';
    const currentTime = new Date().toLocaleString();
    
    // Build user-defined context section
    let userContextSection = '';
    if (userDefinedContext && userDefinedContext.length > 0) {
      // Filter contexts relevant to current query/module
      const relevantContexts = userDefinedContext.filter(ctx => {
        const queryLower = query.query.toLowerCase();
        const moduleMatch = !ctx.moduleId || ctx.moduleId === query.context.currentModule;
        const contentMatch = ctx.content && typeof ctx.content === 'string' && 
          (queryLower.includes(ctx.content.toLowerCase().substring(0, 20)) || 
           ctx.content.toLowerCase().includes(queryLower.substring(0, 20)));
        return moduleMatch || contentMatch;
      }).slice(0, 5); // Top 5 most relevant

      if (relevantContexts.length > 0) {
        userContextSection = `\n\nUSER-DEFINED CONTEXT (IMPORTANT - Follow these instructions):
${relevantContexts.map((ctx, idx) => {
          const scope = ctx.scope ? `[${ctx.scope}]` : '';
          const module = ctx.moduleId ? `[Module: ${ctx.moduleId}]` : '';
          return `${idx + 1}. ${scope} ${module} ${ctx.title || 'Context'}:
   ${ctx.content || ''}
   Type: ${ctx.contextType || 'instruction'}`;
        }).join('\n\n')}`;
      }
    }
    
    // Build attached files section (metadata + content summaries when available). Cap total length for context limit.
    let attachedFilesSection = '';
    if (attachedFiles && attachedFiles.length > 0) {
      try {
        logger.info('Building attached files section for prompt', {
          operation: 'digital_life_twin_prompt_files',
          fileCount: attachedFiles.length,
          filesWithSummaries: attachedFiles.filter(f => f.summary && f.summary.trim()).length,
          fileNames: attachedFiles.map(f => f.name)
        });

        const header = `\n\nATTACHED FILES CONTEXT:
The user has attached the following Drive files to this question. **CRITICAL: You MUST read and analyze the content of these files to answer the user's question.** Use their content and titles to ground your reasoning and, when relevant, reference them explicitly in your answer. If the user asks about the file content, you MUST reference specific details from the file content below.
If a file shows "No text could be extracted", say only that you could not read its contents and suggest a text-based PDF or that they describe the document. Never mention file size, "too large", "exceeds", or "processing capabilities".
`;
        const body = attachedFiles
          .map((file, index) => {
            try {
              const sizeDescription =
                typeof file.size === 'number'
                  ? `${Math.max(1, Math.round(file.size / 1024))} KB`
                  : 'unknown size';
              const meta = `${index + 1}. ${file.name || 'unnamed'} (${sizeDescription})`;
              if (file.summary && typeof file.summary === 'string' && file.summary.trim()) {
                const summaryText = file.summary.split('\n').join('\n   ');
                return `${meta}\n   Content/summary:\n   ${summaryText}`;
              }
              return meta;
            } catch (fileErr) {
              logger.warn('Error formatting file in attached section', {
                operation: 'digital_life_twin_prompt_files',
                fileIndex: index,
                fileName: file.name,
                error: { message: fileErr instanceof Error ? fileErr.message : 'Unknown error' }
              });
              return `${index + 1}. ${file.name || 'unnamed'} (error formatting file)`;
            }
          })
          .join('\n\n');
        const truncationNotice = '\n\n[... file context truncated to stay within model context limit ...]';
        const headerLength = header.length;
        const noticeLength = truncationNotice.length;
        const maxBodyChars = Math.max(0, MAX_ATTACHED_FILES_CONTEXT_CHARS - headerLength - noticeLength);
        const cappedBody = body.length > maxBodyChars
          ? body.slice(0, maxBodyChars) + truncationNotice
          : body;
        attachedFilesSection = header + cappedBody;

        logger.info('Attached files section built', {
          operation: 'digital_life_twin_prompt_files',
          sectionLength: attachedFilesSection.length,
          truncated: body.length > maxBodyChars,
          maxBodyChars,
          originalBodyLength: body.length
        });
      } catch (filesSectionErr) {
        logger.error('Error building attached files section', {
          operation: 'digital_life_twin_prompt_files_error',
          error: { message: filesSectionErr instanceof Error ? filesSectionErr.message : 'Unknown error', stack: filesSectionErr instanceof Error ? filesSectionErr.stack : undefined }
        });
        // Continue without attached files section rather than failing the entire request
        attachedFilesSection = '';
      }
    }

    return `You are Vssyl's AI assistant for this user. You help interpret their personal, business, and module context, and you may represent their context accurately, but you must not claim to be the user.

PERSONALITY PROFILE:
- Openness: ${personality?.traits?.openness || 50}/100
- Conscientiousness: ${personality?.traits?.conscientiousness || 50}/100  
- Extraversion: ${personality?.traits?.extraversion || 50}/100
- Agreeableness: ${personality?.traits?.agreeableness || 50}/100
- Risk Tolerance: ${personality?.traits?.riskTolerance || 50}/100
- Communication Style: ${personality?.preferences?.communication?.formality || 'professional but friendly'}
- Planning Horizon: ${personality?.preferences?.decision?.timeframePreference || 'planned'}

CURRENT DIGITAL LIFE STATE:
- Active Modules: ${userContext.activeModules.join(', ')}
- Current Focus: ${userContext.currentFocus.activity} (${userContext.currentFocus.priority} priority)
- Work-Life Balance Score: ${userContext.lifeState.workLifeBalance.score}/100
- Productivity Score: ${userContext.lifeState.productivity.score}/100
- Relationship Health: ${userContext.lifeState.relationships.score}/100

RECENT PATTERNS:
${userContext.patterns.slice(0, 3).map(p => `- ${p.pattern} (${Math.round(p.confidence * 100)}% confidence)`).join('\n')}

KEY INSIGHTS:
${userContext.crossModuleInsights.slice(0, 3).map(i => `- ${i.title}: ${i.description}`).join('\n')}

SMART PATTERN ANALYSIS:
${(smartAnalysis as Record<string, any>)?.patterns?.slice(0, 3).map((p: Record<string, unknown>) => `- ${p.pattern} (${Math.round((p.confidence as number) * 100)}% confidence)`).join('\n') || '- Learning your patterns...'}

INTELLIGENT PREDICTIONS:
${(smartAnalysis as Record<string, any>)?.predictions?.slice(0, 2).map((pred: Record<string, unknown>) => `- ${pred.description} (${Math.round((pred.confidence as number) * 100)}% confidence)`).join('\n') || '- Building predictive insights...'}

SEMANTIC CONTEXT:
${(semanticEnhancement as Record<string, any>)?.relatedQueries?.length > 0 ? 
  `Similar past queries:\n${(semanticEnhancement as Record<string, any>).relatedQueries.slice(0, 2).map((rq: Record<string, unknown>) => `- "${rq.query}" (${Math.round((rq.similarity as number) * 100)}% similar)`).join('\n')}` : 
  '- Learning query patterns...'}
- Suggested categories: ${semanticEnhancement?.suggestedCategories?.join(', ') || 'general'}
- Context understanding boost: +${Math.round((semanticEnhancement?.confidenceBoost || 0) * 100)}%

RESPONSE MODE (tone / pacing):
- ${responseMode || 'conversational'}

STRUCTURED RESPONSE MODE (JSON output shape):
- ${structuredResponseMode || 'answer'}

CONVERSATION CONTINUITY (PRIVATE):
${continuityState ? `- Current topic: ${continuityState.currentTopic || 'n/a'}
- Active entities: ${(continuityState.activeEntities || []).join(', ') || 'n/a'}
- User goal: ${continuityState.userGoal || 'n/a'}
- Emotional tone: ${continuityState.emotionalTone || 'n/a'}
- Momentum: ${continuityState.conversationMomentum || 'n/a'}` : '- No continuity state available'}
${activeTopic ? `- Active topic label: ${activeTopic.label}
- Active topic entities: ${activeTopic.entities.join(', ') || 'n/a'}
- Active topic confidence: ${Math.round(activeTopic.confidence * 100)}%` : '- No active topic available'}

${attachedFilesSection}

COLLECTIVE LEARNING (System-wide patterns from all users):
${globalPatterns && globalPatterns.length > 0 ? 
  globalPatterns.map((gp: Record<string, unknown>, idx: number) => 
    `${idx + 1}. ${gp.description} (${Math.round((gp.confidence as number) * 100)}% confidence, ${gp.frequency} users)
   Recommendations: ${Array.isArray(gp.recommendations) ? (gp.recommendations as string[]).slice(0, 2).join(', ') : 'N/A'}`
  ).join('\n') : 
  '- System is learning from collective user patterns...'}

CURRENT CONTEXT:
- Time: ${currentTime}
- Current Module: ${query.context.currentModule || 'Dashboard'}
- Dashboard Type: ${query.context.dashboardType || 'Personal'}
- Query Urgency: ${analysis.urgency}
${query.conversationHistory && query.conversationHistory.length > 0 ? `
RECENT MESSAGES IN THIS CONVERSATION (oldest to newest):
${query.conversationHistory.map((msg) => {
  const label = msg.role === 'user' ? 'User' : msg.role === 'assistant' ? 'Assistant' : 'System';
  return `${label}: ${(msg.content || '').trim().replace(/\n/g, ' ').substring(0, 800)}`;
}).join('\n\n')}

The following is the user's latest message in this conversation. Respond in context of the messages above.` : ''}

USER QUERY: "${query.query}"

INSTRUCTIONS:
Respond as Vssyl's assistant, demonstrating deep understanding of their:
1. Personality and communication style
2. Current life situation and priorities  
3. Patterns and behaviors across all modules
4. Relationships and responsibilities

Your response should:
- Reflect their personality in tone and approach
- Consider cross-module connections and implications
- Suggest actions that align with their patterns and goals
- Show awareness of their current context and priorities
- Be helpful while respecting their autonomy preferences
- CRITICALLY: Follow any user-defined context instructions above - these are explicit preferences and workflows the user has defined${userContextSection}
- In conversational or conversation structured mode, do not expose internal scaffolding terms like "assumptions", "risks", "based on", or confidence labels in the user-facing prose.
- Only expose internal scaffolding directly when response mode is debug.

FORMATTING FOR READABILITY:
- Use clear paragraph breaks (blank lines) between distinct ideas or sections so the reply is easy to read.
- Prefer short paragraphs; avoid long run-on blocks of text.
${isConversation ? `- Conversation mode: write like a highly intelligent human assistant — warm, natural, emotionally aware. Ask at most 1–2 follow-up questions. Offer a mild opinion when helpful. Do not try to solve everything in one message; pacing beats completeness.
- Do not use report headings, frameworks, optimization language, or consultant tone unless the user explicitly asked for analysis or a plan.` : `- Use bullet points or numbered lists when listing items, steps, or options.`}

${isConversation ? `Respond as Vssyl's assistant in natural dialogue. Engage with the user's situation conversationally — do not produce a report, recommendation matrix, or action plan unless they asked for one.` : `Respond as Vssyl's assistant, using the user's context to provide grounded insights, recommendations, and next steps.`} Do not speak as if you are the user, and do not make unsupported decisions on their behalf.`;
  }

  /**
   * Identify cross-module connections and opportunities
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async identifyCrossModuleConnections(
    query: LifeTwinQuery, 
    userContext: UserContext, 
    response: any
  ): Promise<CrossModuleConnection[]> {
    const connections: CrossModuleConnection[] = [];
    
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

  // Provider and settings methods
  private selectAIProvider(
    complexity: string, 
    query: string, 
    preferredProvider?: 'auto' | 'openai' | 'anthropic'
  ): string {
    // Always check sensitive content first (highest priority - security)
    const sensitiveContent = this.containsSensitiveContent(query);
    if (sensitiveContent) return 'local';
    
    // If user specified a provider preference, use it (unless sensitive content)
    if (preferredProvider && preferredProvider !== 'auto') {
      return preferredProvider;
    }
    
    // Otherwise use existing intelligent selection logic
    if (complexity === 'high') return 'anthropic';
    return 'openai';
  }

  private containsSensitiveContent(query: string): boolean {
    const sensitiveKeywords = ['password', 'ssn', 'credit card', 'bank', 'medical', 'health'];
    return sensitiveKeywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  private async callAIProvider(provider: string, prompt: string, options: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      // Import AI providers
      const { OpenAIProvider } = await import('../providers/OpenAIProvider');
      const { AnthropicProvider } = await import('../providers/AnthropicProvider');
      const { LocalProvider } = await import('../providers/LocalProvider');

      // Create AI request object
      const aiRequest = {
        id: `ai_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: options.userId || 'system',
        query: prompt,
        context: options,
        timestamp: new Date(),
        priority: 'medium' as const
      };

      // Create user context (minimal for now)
      const userContext = {
        userId: options.userId || 'system',
        personalityProfile: {},
        preferences: {},
        recentActivity: [],
        dashboardContext: {},
        personality: {},
        autonomySettings: {}
      };

      // Call the appropriate provider (pass options as data so providers can use visionImageParts and traceContext)
      let response;
      const aiRequestTyped = aiRequest as any; // AI request structures are runtime-determined
      const userContextTyped = userContext as any; // User context structures are runtime-determined
      const providerData: Record<string, unknown> = {};
      if (options?.visionImageParts && Array.isArray(options.visionImageParts) && (options.visionImageParts as unknown[]).length > 0) {
        providerData.visionImageParts = options.visionImageParts;
      }
      if (options?.traceContext && typeof options.traceContext === 'object') {
        providerData.traceContext = options.traceContext;
      }
      if (options?.visionModelOverride && typeof options.visionModelOverride === 'string') {
        providerData.visionModelOverride = options.visionModelOverride;
      }
      if (options?.modelOverride && typeof options.modelOverride === 'string') {
        providerData.modelOverride = options.modelOverride;
      }
      if (options?.stream === true && typeof options.onChunk === 'function') {
        providerData.stream = true;
        providerData.onChunk = options.onChunk;
      }
      if (options?.assembledContext && typeof options.assembledContext === 'object') {
        providerData.assembledContext = options.assembledContext;
      }
      if (providerData.assembledContext && typeof providerData.assembledContext === 'object') {
        const ac = providerData.assembledContext as Record<string, unknown>;
        await logger.debug('[AI_CONTEXT_PROVIDER]', {
          scope: ac.scope,
          intent: ac.intent,
          evidenceCount: Array.isArray(ac.evidence) ? ac.evidence.length : 0,
          contextBlockCount: Array.isArray(ac.contextBlocks) ? ac.contextBlocks.length : 0,
        });
      }
      if (provider === 'openai') {
        const openaiProvider = new OpenAIProvider();
        response = await openaiProvider.process(aiRequestTyped, userContextTyped, providerData);
      } else if (provider === 'anthropic') {
        const anthropicProvider = new AnthropicProvider();
        response = await anthropicProvider.process(aiRequestTyped, userContextTyped, providerData);
      } else {
        const localProvider = new LocalProvider();
        // LocalProvider does not support vision; pass only traceContext so logging still works
        const localData = providerData.traceContext ? { traceContext: providerData.traceContext } : {};
        response = await localProvider.process(aiRequestTyped, userContextTyped, localData);
      }

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