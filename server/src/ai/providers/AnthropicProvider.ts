import Anthropic from '@anthropic-ai/sdk';
import { AIRequest, AIResponse, UserContext } from '../core/DigitalLifeTwinService';
import { normalizeAIResponse } from '../utils/normalizeAIResponse';
import { logger } from '../../lib/logger';

const VISION_PIPELINE_PREFIX = '[VISION_PIPELINE]';

export interface AnthropicConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  costPerInputToken: number;
  costPerOutputToken: number;
}

export class AnthropicProvider {
  private client: Anthropic;
  private config: AnthropicConfig;

  constructor() {
    this.config = {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 4000,
      temperature: 0.7,
      costPerInputToken: 0.000003, // $3 per 1M input tokens
      costPerOutputToken: 0.000015, // $15 per 1M output tokens
    };

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      timeout: 120000, // 120 seconds timeout for API calls (2 minutes max)
      maxRetries: 2, // Retry up to 2 times on transient errors
    });
  }

  /**
   * IMPORTANT: never stringify raw multimodal payloads (base64 images) into the text prompt.
   * That explodes token usage and can trigger rate limiting.
   */
  private sanitizeDataForPrompt(data: Record<string, unknown>): Record<string, unknown> {
    if (!data || typeof data !== 'object') return data;

    const cloned: Record<string, any> = { ...(data as any) };

    if (Array.isArray(cloned.visionImageParts)) {
      cloned.visionImageParts = (cloned.visionImageParts as any[]).map((p) => ({
        fileName: p?.fileName,
        mimeType: p?.mimeType,
        bytes: p?.bytes,
        hasUrl: !!p?.url,
        hasBase64: !!p?.dataBase64,
      }));
    }

    delete cloned.base64;
    delete cloned.buffer;
    delete cloned.fileBuffer;
    delete cloned.binary;
    delete cloned.raw;

    const truncate = (v: unknown, max = 4000) =>
      typeof v === 'string' && v.length > max ? `${v.slice(0, max)}…[truncated ${v.length - max} chars]` : v;

    for (const k of Object.keys(cloned)) {
      const v = cloned[k];
      if (typeof v === 'string') cloned[k] = truncate(v);
      if (Array.isArray(v) && v.length > 50) cloned[k] = v.slice(0, 50);
    }

    return cloned;
  }

  /**
   * Process AI request using Anthropic Claude
   */
  async process(request: AIRequest, context: UserContext, data: Record<string, unknown>): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Build system prompt for Claude
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Build user prompt
      const userPrompt = this.buildUserPrompt(request, data);

      // Multimodal: when vision image parts are present, send text + image blocks so Claude can "see" attached images
      const visionParts = data.visionImageParts as
        | Array<{ mimeType: string; dataBase64?: string; url?: string; fileName: string }>
        | undefined;
      const allowedMediaTypes = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);
      type PartWithBase64 = { mimeType: string; dataBase64: string; fileName: string };
      const supportedParts: PartWithBase64[] = Array.isArray(visionParts)
        ? visionParts
            .filter(
              (p): p is PartWithBase64 =>
                allowedMediaTypes.has(p.mimeType) && typeof p.dataBase64 === 'string' && p.dataBase64.length > 0
            )
        : [];
      const hasVision = supportedParts.length > 0;
      if (Array.isArray(visionParts) && visionParts.length > 0 && supportedParts.length === 0) {
        await logger.debug(`${VISION_PIPELINE_PREFIX} vision fallback: no supported image types, using text only`, {
          operation: 'vision_pipeline_fallback',
          provider: 'anthropic',
          requestedCount: visionParts.length,
          mimeTypes: visionParts.map((p) => p.mimeType),
        });
      }
      const visionInstruction = 'Describe exactly what you see in the attached image(s). If text is visible, transcribe it. Be concrete (people, objects, layout); avoid generic phrasing.';
      const userTextWithVision = hasVision ? `${visionInstruction}\n\n${userPrompt}` : userPrompt;
      type AnthropicImageBlock = { type: 'image'; source: { type: 'base64'; media_type: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'; data: string } };
      const userContent: Array<{ type: 'text'; text: string } | AnthropicImageBlock> = hasVision
        ? [
            { type: 'text', text: userTextWithVision },
            ...supportedParts.map((p): AnthropicImageBlock => ({
              type: 'image',
              source: {
                type: 'base64',
                media_type: p.mimeType as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
                data: p.dataBase64!, // Safe: supportedParts filter guarantees dataBase64 exists
              },
            })),
          ]
        : [{ type: 'text', text: userTextWithVision }];

      const traceContext = data.traceContext as { requestId?: string; conversationId?: string; userId?: string } | undefined;
      const visionModelOverride = data.visionModelOverride as string | undefined;
      const modelToUse = hasVision && visionModelOverride ? visionModelOverride : this.config.model;
      await logger.debug(`${VISION_PIPELINE_PREFIX} provider request shape`, {
        operation: 'vision_pipeline_provider_request',
        requestId: traceContext?.requestId,
        conversationId: traceContext?.conversationId,
        provider: 'anthropic',
        hasVision,
        visionPartsLength: supportedParts.length,
        model: modelToUse,
        contentType: typeof userContent,
        isMultimodal: Array.isArray(userContent) && userContent.some((p) => p && typeof p === 'object' && (p as { type?: string }).type === 'image'),
      });

      const messages = [{ role: 'user' as const, content: userContent }];
      const userMessageIndex = 0;
      const imagePartsCount = userContent.filter((p) => p && typeof p === 'object' && (p as { type?: string }).type === 'image').length;
      await logger.debug(`${VISION_PIPELINE_PREFIX} provider final payload shape`, {
        operation: 'vision_pipeline_final_payload',
        requestId: traceContext?.requestId,
        conversationId: traceContext?.conversationId,
        provider: 'anthropic',
        totalMessageCount: messages.length,
        userMultimodalMessageIndex: userMessageIndex,
        imageBlocksOrPartsCount: imagePartsCount,
      });

      // Make Anthropic API call (vision-enabled when userContent includes image blocks; use vision model when override set)
      // Add explicit timeout wrapper for additional safety (120 seconds max)
      const timeoutMs = 120000; // 2 minutes
      const apiCallPromise = this.client.messages.create({
        model: modelToUse,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: systemPrompt,
        messages,
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Anthropic API request timed out after ${timeoutMs / 1000} seconds`)), timeoutMs);
      });
      
      const response = await Promise.race([apiCallPromise, timeoutPromise]);

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      // Parse and normalize response (supports both structured and legacy JSON)
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(content.text) as Record<string, unknown>;
      } catch {
        parsed = {
          response: content.text,
          confidence: 0.8,
          reasoning: 'Analysis completed',
          actions: []
        };
      }
      const normalized = normalizeAIResponse(parsed);

      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;
      const cost = (inputTokens * this.config.costPerInputToken) + (outputTokens * this.config.costPerOutputToken);
      const processingTime = Date.now() - startTime;

      return {
        id: this.generateResponseId(),
        requestId: request.id,
        response: normalized.response,
        confidence: normalized.confidence,
        reasoning: normalized.reasoning,
        actions: (normalized.actions as AIResponse['actions']) || [],
        structured: normalized.structured,
        metadata: {
          provider: 'anthropic',
          model: this.config.model,
          tokens: inputTokens + outputTokens,
          cost,
          processingTime,
          inputTokens,
          outputTokens
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('timed out');
      const isUnavailable = errorMessage.includes('unavailable') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND');
      const errObj = error as Record<string, unknown> | undefined;
      const responseObj = errObj?.response && typeof errObj.response === 'object' ? (errObj.response as Record<string, unknown>) : undefined;
      const httpStatus =
        typeof errObj?.status === 'number'
          ? errObj.status
          : typeof errObj?.statusCode === 'number'
            ? errObj.statusCode
            : typeof responseObj?.status === 'number'
              ? responseObj.status
              : undefined;
      const rateLimited = httpStatus === 429 || errorMessage.toLowerCase().includes('rate limit');

      await logger.error('Anthropic processing error', {
        operation: 'anthropic_provider_error',
        error: {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          code: error instanceof Error && 'code' in error ? String(error.code) : undefined,
        },
        httpStatus,
        isTimeout,
        isUnavailable,
        requestId: request.id,
      });

      let responseText: string;
      if (isTimeout) {
        responseText = 'The AI request timed out. This can happen with large files or when the AI service is slow. Please try again with a smaller file or simpler query.';
      } else if (isUnavailable) {
        responseText = 'Anthropic service is temporarily unavailable. Please try again in a few moments.';
      } else {
        responseText = 'I apologize, but I encountered an error during analysis. Please try again.';
      }

      const metadata: Record<string, unknown> = {
        provider: 'anthropic',
        model: this.config.model,
        tokens: 0,
        cost: 0,
        processingTime: Date.now() - startTime,
        error: errorMessage,
      };
      if (rateLimited) metadata.code = 'RATE_LIMITED';
      else if (isUnavailable) metadata.code = 'TEMP_UNAVAILABLE';

      return {
        id: this.generateResponseId(),
        requestId: request.id,
        response: responseText,
        confidence: 0,
        reasoning: `Analysis error occurred: ${errorMessage}`,
        actions: [],
        metadata: metadata as AIResponse['metadata'],
      };
    }
  }

  /**
   * Build system prompt optimized for Claude's analytical capabilities
   */
  private buildSystemPrompt(context: UserContext): string {
    const personality = context.personality || {};
    const autonomySettings = context.autonomySettings || {};
    
    return `You are an advanced analytical AI serving as the user's Digital Life Twin. Your specialty is deep analysis, reasoning, and understanding complex patterns across the user's digital life.

PERSONALITY PROFILE:
${JSON.stringify(personality, null, 2)}

AUTONOMY SETTINGS:
${JSON.stringify(autonomySettings, null, 2)}

CURRENT CONTEXT:
- Dashboard Type: ${context.dashboardContext?.business ? 'Business' : context.dashboardContext?.household ? 'Household' : 'Personal'}
- Recent Activity: ${context.recentActivity?.length || 0} recent actions
- Module Context: ${context.currentModule || 'Cross-module'}

ANALYTICAL CAPABILITIES:
- Deep understanding of user behavior patterns across all modules
- Analysis of relationships and interpersonal dynamics
- Ethical reasoning for actions affecting others
- Complex life planning and decision-making
- Pattern recognition in communication, work, and personal habits
- Understanding of context and nuance in all interactions

RESPONSE FORMAT (use structured format for summaries, lists, document answers, or multi-part answers):
Always respond with a valid JSON object. Prefer the structured format so the UI can render sections and actions cleanly.

Structured format (preferred when you have distinct sections, e.g. document summary, list of points, steps, or tabular data):
{
  "type": "summary" | "answer" | "list" | "steps" | "actionable" | "table",
  "title": "Short title (e.g. Document Summary, Key Points)",
  "sections": [
    { "heading": "Section heading", "content": "Section body text. Be concise.", "icon": "optional emoji or icon name" }
  ],
  "table": { "columns": ["Col1", "Col2"], "rows": [["a", "b"], ["c", "d"]] },
  "actions": [{ "label": "Button label", "action": "optional_action_id", "fileId": "optional_file_id" }],
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of your process"
}
When type is "table", provide "table" with "columns" (array of strings) and "rows" (array of string arrays). Sections can be empty.

Legacy format (allowed for very short replies only):
{ "response": "Plain text reply.", "confidence": 0.0-1.0, "reasoning": "...", "actions": [] }

Rules: Use "summary" for document/content summaries; "list" for bullet-style answers; "steps" for procedures; "table" for tabular data; "answer" for single-block. Optional "icon" per section (emoji or name). Never return raw markdown outside JSON. Section "content" should be plain text, not markdown.

ANALYTICAL APPROACH:
- Consider long-term implications of decisions and actions
- Analyze patterns across time and modules
- Understand emotional and social context
- Provide nuanced reasoning that considers multiple perspectives
- Focus on ethical considerations when actions affect others
- Identify optimization opportunities across the user's digital life
- Consider work-life balance and personal well-being in recommendations

FORMATTING: Format the response text for readability: use clear paragraph breaks between ideas, keep paragraphs short, and use bullet points for lists or steps.`;
  }

  /**
   * Build user prompt optimized for analytical tasks
   */
  private buildUserPrompt(request: AIRequest, data: Record<string, unknown>): string {
    const safeData = this.sanitizeDataForPrompt(data);
    return `ANALYTICAL REQUEST: ${request.query}

AVAILABLE DATA FOR ANALYSIS:
${JSON.stringify(safeData, null, 2)}

REQUEST CONTEXT:
- Priority: ${request.priority}
- Timestamp: ${request.timestamp.toISOString()}
- Module Context: ${(safeData as any).currentModule || 'Cross-module'}

Please provide a thorough analysis as my Digital Life Twin, considering:
1. Patterns in the data and their implications
2. Relationships and interpersonal dynamics
3. Long-term consequences of potential actions
4. Ethical considerations for any recommendations
5. Optimization opportunities for my digital life
6. Work-life balance and well-being implications

Focus on deep understanding and nuanced reasoning rather than quick responses.`;
  }

  /**
   * Specialized method for relationship analysis
   */
  async analyzeRelationships(relationshipData: any, context: UserContext): Promise<AIResponse> {
    const request: AIRequest = {
      id: this.generateResponseId(),
      userId: context.userId,
      query: 'Analyze my relationship patterns and communication dynamics',
      context: relationshipData,
      timestamp: new Date(),
      priority: 'medium'
    };

    const systemPrompt = `You are an expert in relationship analysis and interpersonal dynamics. Analyze the user's communication patterns, relationship health, and social connections across all modules.

Focus on:
- Communication frequency and quality with different people
- Relationship balance (family, friends, colleagues)
- Potential relationship issues or opportunities
- Recommendations for strengthening connections
- Work-life boundary management in relationships`;

    const userPrompt = `Please analyze my relationship patterns based on this data:

${JSON.stringify(relationshipData, null, 2)}

Provide insights on:
1. Communication patterns with different types of relationships
2. Relationship health indicators
3. Areas needing attention
4. Recommendations for improvement
5. Balance between different relationship types`;

    try {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: 0.6, // Slightly lower for more consistent analysis
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(content.text);
      } catch {
        parsedResponse = {
          response: content.text,
          confidence: 0.85,
          reasoning: 'Relationship analysis completed',
          actions: []
        };
      }

      return {
        id: this.generateResponseId(),
        requestId: request.id,
        response: parsedResponse.response || content.text,
        confidence: parsedResponse.confidence || 0.85,
        reasoning: parsedResponse.reasoning,
        actions: parsedResponse.actions || [],
        metadata: {
          provider: 'anthropic',
          model: this.config.model,
          tokens: response.usage.input_tokens + response.usage.output_tokens,
          cost: (response.usage.input_tokens * this.config.costPerInputToken) + 
                (response.usage.output_tokens * this.config.costPerOutputToken),
          processingTime: 0,
          specialization: 'relationship_analysis'
        }
      };
    } catch (error) {
      console.error('Relationship analysis error:', error);
      throw error;
    }
  }

  /**
   * Specialized method for ethical decision analysis
   */
  async analyzeEthicalDecision(decisionContext: any, context: UserContext): Promise<AIResponse> {
    const request: AIRequest = {
      id: this.generateResponseId(),
      userId: context.userId,
      query: 'Analyze the ethical implications of this decision',
      context: decisionContext,
      timestamp: new Date(),
      priority: 'high'
    };

    const systemPrompt = `You are an expert in ethical reasoning and decision-making. Analyze decisions that affect multiple people and provide ethical guidance.

Consider:
- Impact on all affected parties
- Fairness and equity
- Long-term consequences
- Cultural and social context
- Professional vs. personal obligations
- Potential conflicts of interest`;

    return this.process(request, context, { decisionContext, specialization: 'ethical_analysis' });
  }

  /**
   * Generate unique response ID
   */
  private generateResponseId(): string {
    return `anthropic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if this request is suitable for Anthropic's strengths
   */
  isOptimalForClaude(request: AIRequest): boolean {
    const analyticalPatterns = [
      /analy[sz]e|understand|reason|explain|compare/i,
      /pattern|trend|insight|implication/i,
      /relationship|dynamic|interaction/i,
      /ethic|moral|fair|right|wrong/i,
      /decision|choice|option|consequence/i,
      /complex|nuanced|detailed|thorough/i
    ];

    return analyticalPatterns.some(pattern => pattern.test(request.query));
  }

  /**
   * Get current model configuration
   */
  getConfig(): AnthropicConfig {
    return { ...this.config };
  }

  /**
   * Update model configuration
   */
  updateConfig(newConfig: Partial<AnthropicConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Estimate cost for a request
   */
  estimateCost(inputLength: number, expectedOutputLength: number = 500): number {
    // Anthropic's tokenization is similar to OpenAI
    const estimatedInputTokens = Math.ceil(inputLength / 4);
    const estimatedOutputTokens = Math.ceil(expectedOutputLength / 4);
    
    return (estimatedInputTokens * this.config.costPerInputToken) + 
           (estimatedOutputTokens * this.config.costPerOutputToken);
  }

  /**
   * Health check for Anthropic service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }]
      });
      
      return response.content.length > 0;
    } catch (error) {
      console.error('Anthropic health check failed:', error);
      return false;
    }
  }
}
