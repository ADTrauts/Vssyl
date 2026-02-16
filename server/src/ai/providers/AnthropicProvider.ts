import Anthropic from '@anthropic-ai/sdk';
import { AIRequest, AIResponse, UserContext } from '../core/DigitalLifeTwinService';
import { normalizeAIResponse } from '../utils/normalizeAIResponse';

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
    });
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
      const visionParts = data.visionImageParts as Array<{ mimeType: string; dataBase64: string; fileName: string }> | undefined;
      const allowedMediaTypes = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);
      const supportedParts = Array.isArray(visionParts) ? visionParts.filter((p) => allowedMediaTypes.has(p.mimeType)) : [];
      const hasVision = supportedParts.length > 0;
      type AnthropicImageBlock = { type: 'image'; source: { type: 'base64'; media_type: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'; data: string } };
      const userContent: Array<{ type: 'text'; text: string } | AnthropicImageBlock> = hasVision
        ? [
            { type: 'text', text: userPrompt },
            ...supportedParts.map((p): AnthropicImageBlock => ({
              type: 'image',
              source: {
                type: 'base64',
                media_type: p.mimeType as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
                data: p.dataBase64,
              },
            })),
          ]
        : [{ type: 'text', text: userPrompt }];

      // Make Anthropic API call (vision-enabled when userContent includes image blocks)
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      });

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
      console.error('Anthropic processing error:', error);
      
      return {
        id: this.generateResponseId(),
        requestId: request.id,
        response: 'I apologize, but I encountered an error during analysis. Please try again.',
        confidence: 0,
        reasoning: 'Analysis error occurred',
        actions: [],
        metadata: {
          provider: 'anthropic',
          model: this.config.model,
          tokens: 0,
          cost: 0,
          processingTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
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
    return `ANALYTICAL REQUEST: ${request.query}

AVAILABLE DATA FOR ANALYSIS:
${JSON.stringify(data, null, 2)}

REQUEST CONTEXT:
- Priority: ${request.priority}
- Timestamp: ${request.timestamp.toISOString()}
- Module Context: ${data.currentModule || 'Cross-module'}

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