/**
 * Provider user-message builders (conversation vs enterprise).
 */

import type { AIAssembledContext } from '../context/AIContextAssembler';
import { isConversationStructuredMode } from './structuredResponseFormat';

export function isConversationProviderData(data?: Record<string, unknown>): boolean {
  if (!data) return false;
  if (isConversationStructuredMode(data.structuredResponseMode as string | undefined)) return true;
  return (data.promptProfile as string | undefined) === 'conversation';
}

function slimAssembledContextForConversation(assembled: AIAssembledContext): Record<string, unknown> {
  return {
    scope: assembled.scope,
    intent: assembled.intent,
    structuredResponseMode: assembled.structuredResponseMode,
    contextBlocks: (assembled.contextBlocks || []).slice(0, 6).map((b) => ({
      title: b.title,
      sourceType: b.sourceType,
      content: b.content,
      relevanceScore: b.relevanceScore,
    })),
  };
}

export function buildProviderUserPrompt(input: {
  requestQuery: string;
  data: Record<string, unknown>;
}): string {
  const { requestQuery, data } = input;
  const conversation = isConversationProviderData(data);
  const userQuery =
    typeof data.userQuery === 'string' && data.userQuery.trim() ? data.userQuery.trim() : requestQuery;

  const assembled = data.assembledContext;
  let assembledSection = '';
  if (assembled && typeof assembled === 'object') {
    const ac = assembled as AIAssembledContext;
    const payload = conversation ? slimAssembledContextForConversation(ac) : assembled;
    assembledSection = `PRIVATE CONTEXT (use silently — do not cite scores, dashboards, or internal labels to the user):\n${JSON.stringify(payload, null, 2)}\n\n`;
  }

  if (conversation) {
    return `${assembledSection}USER MESSAGE:\n${userQuery}

Respond in natural dialogue. Use private context only when it genuinely improves the answer — never mention productivity scores, work-life balance, dashboards, key insights, or life-twin analytics unless the user asked about them.`;
  }

  return `USER REQUEST: ${userQuery}

${assembledSection}AVAILABLE DATA:
${JSON.stringify(data, null, 2)}

REQUEST CONTEXT:
- Priority: ${(data.priority as string) || 'medium'}
- Module Context: ${(data.currentModule as string) || 'Cross-module'}

Please respond as Vssyl's AI assistant using the full context above. Follow the v2 JSON response format from your instructions.`;
}
