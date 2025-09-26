import OpenAI from 'openai';
import { AIRequest, AIResponse, UserContext } from '../core/DigitalLifeTwinService';

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
    });
  }

  /**
   * Process AI request using OpenAI
   */
  async process(request: AIRequest, context: UserContext, data: any): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Check if API key is configured
      if (!this.config.apiKey) {
        return this.getFallbackResponse(request, 'OpenAI API key not configured');
      }

      // Build system prompt with user context
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Build user prompt with request and data
      const userPrompt = this.buildUserPrompt(request, data);

      // Make OpenAI API call
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse structured response with error handling
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response as JSON:', response);
        // Try to extract useful information from the raw response
        parsedResponse = {
          response: response,
          confidence: 0.7,
          reasoning: 'Response received but not in expected JSON format'
        };
      }

      // Calculate costs
      const inputTokens = completion.usage?.prompt_tokens || 0;
      const outputTokens = completion.usage?.completion_tokens || 0;
      const cost = (inputTokens * this.config.costPerInputToken) + (outputTokens * this.config.costPerOutputToken);

      const processingTime = Date.now() - startTime;

      return {
        id: this.generateResponseId(),
        requestId: request.id,
        response: parsedResponse.response || parsedResponse.message || response,
        confidence: parsedResponse.confidence || 0.8,
        reasoning: parsedResponse.reasoning,
        actions: parsedResponse.actions || [],
        metadata: {
          provider: 'openai',
          model: this.config.model,
          tokens: inputTokens + outputTokens,
          cost,
          processingTime,
          inputTokens,
          outputTokens
        }
      };

    } catch (error) {
      console.error('OpenAI processing error:', error);
      return this.getFallbackResponse(request, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Generate fallback response when OpenAI is unavailable
   */
  private getFallbackResponse(request: AIRequest, errorMessage: string): AIResponse {
    return {
      id: this.generateResponseId(),
      requestId: request.id,
      response: 'I understand your request and I\'m working to provide the best response. (OpenAI temporarily unavailable)',
      confidence: 0.6,
      reasoning: 'Fallback response due to OpenAI API issue',
      actions: [],
      metadata: {
        provider: 'openai',
        model: this.config.model,
        tokens: 0,
        cost: 0,
        processingTime: 0,
        error: errorMessage
      }
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

RESPONSE FORMAT:
Always respond with a JSON object containing:
{
  "response": "Your conversational response to the user",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of your thought process",
  "actions": [
    {
      "type": "action_type",
      "module": "module_name", 
      "operation": "operation_name",
      "parameters": {},
      "requiresApproval": boolean,
      "affectedUsers": ["userId"],
      "reasoning": "Why this action is needed"
    }
  ]
}

GUIDELINES:
- Be conversational and natural, as if you ARE the user in digital form
- Understand context from all modules when making suggestions
- Respect autonomy settings when proposing actions
- Consider how actions affect others and require approval when needed
- Learn and adapt your personality based on user interactions
- Provide insights that span multiple aspects of the user's life`;
  }

  /**
   * Build user prompt with request and available data
   */
  private buildUserPrompt(request: AIRequest, data: any): string {
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
  async processWithOptimization(request: AIRequest, context: UserContext, data: any): Promise<AIResponse> {
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