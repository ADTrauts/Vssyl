import { authenticatedApiCall } from '../lib/apiUtils';

export type LearningSignalType =
  | 'suggestion_accepted'
  | 'suggestion_dismissed'
  | 'suggestion_ignored'
  | 'feedback_positive'
  | 'feedback_negative'
  | 'response_regenerate'
  | 'edit_and_resend'
  | 'module_usage'
  | 'repeated_correction';

export interface RecordLearningSignalInput {
  signalType: LearningSignalType;
  dashboardId?: string;
  businessId?: string;
  sourceModule?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
}

export async function recordLearningSignal(
  input: RecordLearningSignalInput,
  token?: string
): Promise<{ id: string }> {
  const res = await authenticatedApiCall<{ success: boolean; data?: { id: string } }>(
    '/api/ai/learning/signals',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    token
  );
  if (!res.success || !res.data?.id) {
    throw new Error('Failed to record learning signal');
  }
  return res.data;
}

export async function recordResponseRegenerate(
  options: {
    conversationId?: string;
    messageId?: string;
    dashboardId?: string;
    businessId?: string;
    sourceModule?: string;
  },
  token?: string
): Promise<void> {
  await recordLearningSignal(
    {
      signalType: 'response_regenerate',
      dashboardId: options.dashboardId,
      businessId: options.businessId,
      sourceModule: options.sourceModule,
      metadata: {
        conversationId: options.conversationId,
        messageId: options.messageId,
      },
    },
    token
  );
}

export async function recordEditAndResend(
  options: {
    conversationId?: string;
    priorMessageId?: string;
    dashboardId?: string;
    businessId?: string;
    sourceModule?: string;
  },
  token?: string
): Promise<void> {
  await recordLearningSignal(
    {
      signalType: 'edit_and_resend',
      dashboardId: options.dashboardId,
      businessId: options.businessId,
      sourceModule: options.sourceModule,
      metadata: {
        conversationId: options.conversationId,
        priorMessageId: options.priorMessageId,
      },
    },
    token
  );
}
