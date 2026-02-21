import { authenticatedApiCall } from '../lib/apiUtils';

export interface ChatModelDefinition {
  id: string;
  provider: 'openai' | 'anthropic' | 'local';
  label: string;
  description: string;
  supportsVision: boolean;
  costTier?: 'standard' | 'premium';
  queryCost?: number;
}

export interface AIModelsResponse {
  success: boolean;
  data: {
    openai: ChatModelDefinition[];
    anthropic: ChatModelDefinition[];
    local: ChatModelDefinition[];
  };
}

export async function getAIModels(token: string): Promise<AIModelsResponse['data']> {
  const response = await authenticatedApiCall<AIModelsResponse>(
    '/api/ai/models',
    { method: 'GET' },
    token
  );
  if (!response.success || !response.data) {
    throw new Error('Failed to load AI models');
  }
  return response.data;
}
