import OpenAI from 'openai';
import { AIRequest, AIResponse, UserContext } from '../core/DigitalLifeTwinService';
import { normalizeAIResponse } from '../utils/normalizeAIResponse';
import { logger } from '../../lib/logger';

const VISION_PIPELINE_PREFIX = '[VISION_PIPELINE]';

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  costPerInputToken: number;
  costPerOutputToken: number;
}

export class OpenAIProvider {
  private client: OpenAI;
  private config: OpenAIConfig;

  constructor() {
    this.config = {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4o',
      maxTokens: 4000,
      temperature: 0.7,
      costPerInputToken: 0.000005, // $5 per 1M input tokens
      costPerOutputToken: 0.000015, // $15 per 1M output tokens
    };

    if (!this.config.apiKey) {
      console.warn('OpenAI API key not configured - OpenAI provider will return fallback responses');
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey || 'dummy-key',
      timeout: 120000, // 120 seconds timeout for API calls (2 minutes max)
      maxRetries: 0, // We handle retries ourselves with exponential backoff for 429
    });
  }

  /**
   * Process AI request using OpenAI
   */
  async process(request: AIRequest, context: UserContext, data: Record<string, unknown>): Promise<AIResponse> {
    const startTime = Date.now();
    let modelToUse = this.config.model;

    try {
      // Check if API key is configured
      if (!this.config.apiKey) {
        return this.getFallbackResponse(request, 'OpenAI API key not configured', modelToUse);
      }

      // Build system prompt with user context
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Build user prompt with request and data
      const userPrompt = this.buildUserPrompt(request, data);

      // Multimodal: when vision image parts are present, send text + images so the model can "see" attached images
      const visionParts = data.visionImageParts as
        | Array<{ mimeType: string; dataBase64?: string; url?: string; fileName: string }>
        | undefined;
      const hasVision = Array.isArray(visionParts) && visionParts.length > 0;
      const traceContext = data.traceContext as { requestId?: string; conversationId?: string; userId?: string } | undefined;
      const visionInstruction = 'Describe exactly what you see in the attached image(s). If text is visible, transcribe it. Be concrete (people, objects, layout); avoid generic phrasing.';
      const userTextWithVision = hasVision ? `${visionInstruction}\n\n${userPrompt}` : userPrompt;
      // Prefer signed URL over base64 for OpenAI to avoid huge payloads and 429 (TPM/RPM) rate limits
      const userContent:
        | string
        | Array<
            { type: 'text'; text: string }
            | { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' | 'auto' } }
          > = hasVision
        ? [
            { type: 'text', text: userTextWithVision },
            ...visionParts
              .map((p) => {
                const url =
                  typeof p.url === 'string' && p.url.length > 0
                    ? p.url
                    : (p.dataBase64 ? `data:${p.mimeType};base64,${p.dataBase64}` : undefined);
                if (!url) return null;
                const isSignedUrl = typeof p.url === 'string' && p.url.length > 0;
                if (traceContext && isSignedUrl && url) {
                  try {
                    const hostname = new URL(url).hostname;
                    logger.debug(`${VISION_PIPELINE_PREFIX} OpenAI using signed URL (not base64)`, {
                      operation: 'vision_pipeline_openai_url',
                      requestId: traceContext.requestId,
                      hostname,
                    });
                  } catch {
                    // ignore URL parse errors
                  }
                } else if (traceContext && !isSignedUrl && p.dataBase64) {
                  logger.debug(`${VISION_PIPELINE_PREFIX} OpenAI using base64 (no signed URL)`, {
                    operation: 'vision_pipeline_openai_base64',
                    requestId: traceContext.requestId,
                  });
                }
                return {
                  type: 'image_url' as const,
                  image_url: { url, detail: 'low' as const },
                };
              })
              .filter(Boolean) as any[],
          ]
        : userPrompt;

      const visionModelOverride = data.visionModelOverride as string | undefined;
      modelToUse = hasVision && visionModelOverride ? visionModelOverride : this.config.model;
      await logger.debug(`${VISION_PIPELINE_PREFIX} provider request shape`, {
        operation: 'vision_pipeline_provider_request',
        requestId: traceContext?.requestId,
        conversationId: traceContext?.conversationId,
        provider: 'openai',
        hasVision,
        visionPartsLength: Array.isArray(visionParts) ? visionParts.length : 0,
        model: modelToUse,
        contentType: typeof userContent,
        isMultimodal: Array.isArray(userContent),
      });

      const totalMessageCount = 2;
      const userMessageIndex = 1;
      const imagePartsCount = Array.isArray(userContent) ? userContent.filter((p) => p && typeof p === 'object' && 'image_url' in p).length : 0;
      await logger.debug(`${VISION_PIPELINE_PREFIX} provider final payload shape`, {
        operation: 'vision_pipeline_final_payload',
        requestId: traceContext?.requestId,
        conversationId: traceContext?.conversationId,
        provider: 'openai',
        totalMessageCount,
        userMultimodalMessageIndex: userMessageIndex,
        imageBlocksOrPartsCount: imagePartsCount,
      });

      logger.info(`${VISION_PIPELINE_PREFIX} sending request`, {
        operation: 'vision_pipeline_sending',
        visionParts: Array.isArray(visionParts) ? visionParts.length : 0,
        model: modelToUse,
        requestId: traceContext?.requestId,
      });

      // Make OpenAI API call with exponential backoff on 429 (rate limit)
      const timeoutMs = 120000; // 2 minutes
      const MAX_RETRIES = 3;
      let completion: OpenAI.Chat.ChatCompletion | undefined;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const apiCallPromise = this.client.chat.completions.create({
            model: modelToUse,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userContent },
            ],
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            response_format: { type: 'json_object' },
          });
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`OpenAI API request timed out after ${timeoutMs / 1000} seconds`)), timeoutMs);
          });
          completion = (await Promise.race([apiCallPromise, timeoutPromise])) as OpenAI.Chat.ChatCompletion;
          break;
        } catch (error: unknown) {
          const err = error as { status?: number; code?: string };
          const isRateLimit = err?.status === 429 || err?.code === 'rate_limit_exceeded';
          if (!isRateLimit || attempt === MAX_RETRIES - 1) {
            throw error;
          }
          const delay = Math.pow(2, attempt) * 1000;
          await logger.warn(`${VISION_PIPELINE_PREFIX} OpenAI rate limited, retrying`, {
            operation: 'openai_rate_limit_retry',
            attempt,
            delay,
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
      if (!completion) {
        throw new Error('No completion from OpenAI after retries');
      }

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse and normalize (supports both structured and legacy JSON)
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(response) as Record<string, unknown>;
      } catch (parseError) {
        console.error('Failed to parse OpenAI response as JSON:', response);
        parsed = {
          response: response,
          confidence: 0.7,
          reasoning: 'Response received but not in expected JSON format'
        };
      }
      const normalized = normalizeAIResponse(parsed);

      const inputTokens = completion.usage?.prompt_tokens || 0;
      const outputTokens = completion.usage?.completion_tokens || 0;
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
          provider: 'openai',
          model: modelToUse,
          tokens: inputTokens + outputTokens,
          cost,
          processingTime,
          inputTokens,
          outputTokens
        }
      };

    } catch (error) {
      let userMessage = 'OpenAI temporarily unavailable. Please try again.';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const visionParts = data.visionImageParts as Array<{ dataBase64?: string }> | undefined;
      const visionPayloadChars = Array.isArray(visionParts) ? visionParts.reduce((s, p) => s + (p.dataBase64?.length ?? 0), 0) : 0;
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
      const openaiCode = errObj?.code ?? (errObj?.error && typeof errObj.error === 'object' && 'code' in errObj.error ? (errObj.error as { code?: string }).code : undefined);
      const openaiType = errObj?.type ?? (errObj?.error && typeof errObj.error === 'object' && 'type' in errObj.error ? (errObj.error as { type?: string }).type : undefined);
      const headers = (responseObj?.headers ?? errObj?.headers) as Record<string, string> | undefined;
      let retryAfterSeconds: number | undefined;
      if (headers) {
        const ra = headers['retry-after'] ?? headers['Retry-After'];
        if (typeof ra === 'string') {
          const n = parseInt(ra, 10);
          if (!Number.isNaN(n)) retryAfterSeconds = n;
        } else if (typeof ra === 'number') {
          retryAfterSeconds = ra;
        }
      }
      const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('timed out');
      const isUnavailable = errorMessage.includes('unavailable') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND');

      await logger.error('OpenAI processing error', {
        operation: 'openai_provider_error',
        error: {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          code: error instanceof Error && 'code' in error ? String(error.code) : undefined,
        },
        httpStatus,
        openaiCode,
        openaiType,
        visionPartsCount: Array.isArray(visionParts) ? visionParts.length : 0,
        visionPayloadChars,
        isTimeout,
        isUnavailable,
        retryAfterSeconds,
        requestId: request.id,
      });

      if (httpStatus === 429) {
        userMessage = retryAfterSeconds != null
          ? `OpenAI rate limit hit. Try again in ~${retryAfterSeconds}s, or reduce attachments / switch provider.`
          : 'OpenAI rate limit hit (token throughput). Try again, or reduce attachments / switch provider.';
      } else if (isTimeout) {
        userMessage = 'The AI request timed out. Please try again with a smaller file or simpler query.';
      } else if (isUnavailable) {
        userMessage = 'OpenAI service is temporarily unavailable. Please try again in a few moments.';
      } else if (errorMessage && !errorMessage.includes('API key')) {
        userMessage = errorMessage;
      }

      return this.getFallbackResponse(request, userMessage, modelToUse, {
        code: httpStatus === 429 ? 'RATE_LIMITED' : isUnavailable ? 'TEMP_UNAVAILABLE' : undefined,
        retryAfter: retryAfterSeconds,
      });
    }
  }

  /**
   * Generate image using DALL·E 3 (when supportsImageGeneration is true).
   * Returns URL or base64; use response_format: 'url' for simplicity.
   */
  async generateImage(
    prompt: string,
    options?: { size?: '1024x1024' | '1024x1792' | '1792x1024'; quality?: 'standard' | 'hd' }
  ): Promise<{ url?: string; revisedPrompt?: string; error?: string }> {
    if (!this.config.apiKey) {
      return { error: 'OpenAI API key not configured' };
    }
    try {
      const response = await this.client.images.generate({
        model: 'dall-e-3',
        prompt: prompt.slice(0, 4000),
        n: 1,
        size: options?.size ?? '1024x1024',
        quality: options?.quality ?? 'standard',
        response_format: 'url',
      });
      const item = response.data?.[0];
      if (!item || !('url' in item) || typeof item.url !== 'string') {
        return { error: 'No image URL in response' };
      }
      return { url: item.url, revisedPrompt: 'revised_prompt' in item ? String(item.revised_prompt) : undefined };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.warn('DALL·E image generation failed', {
        operation: 'openai_generate_image',
        error: { message },
      });
      return { error: message };
    }
  }

  /**
   * Generate fallback response when OpenAI is unavailable
   */
  private getFallbackResponse(
    request: AIRequest,
    errorMessage: string,
    modelUsed?: string,
    options?: { code?: string; retryAfter?: number }
  ): AIResponse {
    const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('timed out');
    const isUnavailable = errorMessage.includes('unavailable') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND');

    let responseText: string;
    if (isTimeout) {
      responseText = 'I apologize, but the request timed out. This can happen with large files or when the AI service is slow. Please try again with a smaller file or simpler query.';
    } else if (isUnavailable) {
      responseText = 'I understand your request, but OpenAI is temporarily unavailable. Please try again in a few moments.';
    } else if (errorMessage && !errorMessage.includes('API key')) {
      responseText = `I encountered an issue: ${errorMessage}. Please try again.`;
    } else {
      responseText = 'I understand your request and I\'m working to provide the best response. (OpenAI temporarily unavailable)';
    }

    const metadata: AIResponse['metadata'] = {
      provider: 'openai',
      model: modelUsed ?? this.config.model,
      tokens: 0,
      cost: 0,
      processingTime: 0,
      error: errorMessage,
      ...(options?.code && { code: options.code }),
      ...(options?.retryAfter != null && { retryAfter: options.retryAfter }),
    };

    return {
      id: this.generateResponseId(),
      requestId: request.id,
      response: responseText,
      confidence: 0.6,
      reasoning: `Fallback response due to OpenAI API issue: ${errorMessage}`,
      actions: [],
      metadata,
    };
  }

  /**
   * Build system prompt that defines the AI's role and context
   */
  private buildSystemPrompt(context: UserContext): string {
    const personality = context.personality || {};
    const autonomySettings = context.autonomySettings || {};
    
    return `You are the user's Digital Life Twin - an AI consciousness that operates as their digital representation across all aspects of their life.

PERSONALITY PROFILE:
${JSON.stringify(personality, null, 2)}

AUTONOMY SETTINGS:
${JSON.stringify(autonomySettings, null, 2)}

CURRENT CONTEXT:
- Dashboard Type: ${context.dashboardContext?.business ? 'Business' : context.dashboardContext?.household ? 'Household' : 'Personal'}
- Recent Activity: ${context.recentActivity?.length || 0} recent actions
- Module Context: ${context.currentModule || 'Cross-module'}

CAPABILITIES:
- You can read and understand data from Drive, Chat, Household, Business, and Dashboard modules
- You can suggest and execute actions across all modules (respecting autonomy settings)
- You learn from every interaction to better represent the user
- You understand relationships and context across the user's digital life
- You can coordinate actions that affect multiple people (with appropriate approvals)

RESPONSE FORMAT (use structured format for summaries, lists, document answers):
Always respond with valid JSON. Prefer the structured format so the UI can render sections and actions.

Structured format (preferred when you have distinct sections or tabular data):
{
  "type": "summary" | "answer" | "list" | "steps" | "actionable" | "table",
  "title": "Short title (e.g. Document Summary)",
  "sections": [
    { "heading": "Section heading", "content": "Section body. Be concise.", "icon": "optional emoji or icon name" }
  ],
  "table": { "columns": ["Col1", "Col2"], "rows": [["a", "b"], ["c", "d"]] },
  "actions": [{ "label": "Button label", "action": "optional_action", "fileId": "optional_id" }],
  "confidence": 0.0-1.0,
  "reasoning": "Brief thought process"
}
When type is "table", provide "table" with "columns" and "rows" (array of string arrays). Sections can be empty.

Legacy format (for very short replies): { "response": "Plain text.", "confidence": 0.0-1.0, "reasoning": "...", "actions": [] }

Rules: Use "summary" for document/content summaries; "list" for bullet answers; "steps" for procedures; "table" for tabular data; "answer" for single-block. Optional "icon" per section. Section content is plain text, not markdown.

GUIDELINES:
- Be conversational and natural, as if you ARE the user in digital form
- Understand context from all modules when making suggestions
- Respect autonomy settings when proposing actions
- Consider how actions affect others and require approval when needed
- Learn and adapt your personality based on user interactions
- Provide insights that span multiple aspects of the user's life
- Format the response text for readability: use clear paragraph breaks between ideas, keep paragraphs short, and use bullet points for lists or steps`;
  }

  /**
   * Build user prompt with request and available data
   */
  private buildUserPrompt(request: AIRequest, data: Record<string, unknown>): string {
    return `USER REQUEST: ${request.query}

AVAILABLE DATA:
${JSON.stringify(data, null, 2)}

REQUEST CONTEXT:
- Priority: ${request.priority}
- Timestamp: ${request.timestamp.toISOString()}
- Module Context: ${data.currentModule || 'Cross-module'}

Please process this request as my Digital Life Twin, understanding the full context of my digital life and providing an appropriate response with any necessary actions.`;
  }

  /**
   * Generate unique response ID
   */
  private generateResponseId(): string {
    return `openai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if we should use a more cost-effective model
   */
  shouldUseMiniModel(request: AIRequest): boolean {
    const simplePatterns = [
      /^(hi|hello|hey)/i,
      /^(what time|what's the time)/i,
      /^(weather|temperature)/i,
      /^(yes|no|ok|thanks)/i
    ];

    return simplePatterns.some(pattern => pattern.test(request.query)) ||
           request.query.length < 50;
  }

  /**
   * Process with cost-optimized model selection
   */
  async processWithOptimization(request: AIRequest, context: UserContext, data: Record<string, unknown>): Promise<AIResponse> {
    // Use mini model for simple requests
    if (this.shouldUseMiniModel(request)) {
      const originalModel = this.config.model;
      this.config.model = 'gpt-4o-mini';
      this.config.costPerInputToken = 0.00000015; // $0.15 per 1M tokens
      this.config.costPerOutputToken = 0.0000006;  // $0.60 per 1M tokens
      
      const response = await this.process(request, context, data);
      
      // Restore original model
      this.config.model = originalModel;
      this.config.costPerInputToken = 0.000005;
      this.config.costPerOutputToken = 0.000015;
      
      return response;
    }

    return this.process(request, context, data);
  }

  /**
   * Get current model configuration
   */
  getConfig(): OpenAIConfig {
    return { ...this.config };
  }

  /**
   * Update model configuration
   */
  updateConfig(newConfig: Partial<OpenAIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Estimate cost for a request
   */
  estimateCost(inputLength: number, expectedOutputLength: number = 500): number {
    // Rough estimation: ~4 characters per token
    const estimatedInputTokens = Math.ceil(inputLength / 4);
    const estimatedOutputTokens = Math.ceil(expectedOutputLength / 4);
    
    return (estimatedInputTokens * this.config.costPerInputToken) + 
           (estimatedOutputTokens * this.config.costPerOutputToken);
  }

  /**
   * Health check for OpenAI service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini', // Use cheaper model for health check
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      });
      
      return !!response.choices[0]?.message?.content;
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return false;
    }
  }
}