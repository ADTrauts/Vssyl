/**
 * Teach Vssyl — Phase 1A personal knowledge loop (existing APIs only).
 */

import { authenticatedApiCall } from '../lib/apiUtils';
import { createMemoryFact, type UserMemoryFact } from './aiMemoryFacts';
import {
  parseMemoryFactFromText,
  storageLabelForClassification,
  type TeachClassification,
} from '../lib/teachVssylParser';

export type { TeachClassification };

export interface TeachVssylSubmitInput {
  classification: TeachClassification;
  text: string;
  conversationId?: string;
}

export interface TeachVssylSubmitResult {
  classification: TeachClassification;
  storageLabel: 'Fact' | 'Preference' | 'Vocabulary';
  scope: 'personal';
  memoryFactId?: string;
  contextId?: string;
}

interface UserAIContextRow {
  id: string;
}

export async function submitTeachVssyl(
  token: string,
  input: TeachVssylSubmitInput
): Promise<TeachVssylSubmitResult> {
  const text = input.text.trim();
  if (!text) {
    throw new Error('Please enter what Vssyl should know.');
  }

  const base: TeachVssylSubmitResult = {
    classification: input.classification,
    storageLabel: storageLabelForClassification(input.classification),
    scope: 'personal',
  };

  if (input.classification === 'preference') {
    const title = text.length > 120 ? `${text.slice(0, 117)}…` : text;
    const res = await authenticatedApiCall<{ success: boolean; data: UserAIContextRow }>(
      '/api/ai/user-context',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'personal',
          contextType: 'preference',
          title,
          content: text,
          tags: ['teach_vssyl'],
          priority: 85,
          active: true,
        }),
      },
      token
    );
    if (!res.success || !res.data?.id) {
      throw new Error('Failed to save preference');
    }
    return { ...base, contextId: res.data.id };
  }

  const { subject, predicate } = parseMemoryFactFromText(text);
  const fact: UserMemoryFact = await createMemoryFact(token, {
    subject,
    predicate,
    scope: 'personal',
    category: input.classification === 'vocabulary' ? 'other' : undefined,
    sourceConversationId: input.conversationId,
  });

  return { ...base, memoryFactId: fact.id };
}
