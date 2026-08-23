/**
 * Provider-facing structured response format instructions.
 * P3: conversation | grounded_answer | enterprise — format independent of grounding budget.
 */

import type { AIResponseMode } from '../types/structuredResponse';
import type { AIResponseContract } from '../utils/responseContract';

export function isConversationStructuredMode(mode?: string): boolean {
  return (mode || '').trim().toLowerCase() === 'conversation';
}

export function buildStructuredResponseFormatInstructions(
  structuredResponseMode?: AIResponseMode,
  options?: {
    includeRecommendationGuidance?: boolean;
    responseContract?: AIResponseContract;
  }
): string {
  if (options?.responseContract === 'grounded_answer') {
    return GROUNDED_ANSWER_FORMAT_BLOCK;
  }

  if (
    options?.responseContract === 'conversation' ||
    isConversationStructuredMode(structuredResponseMode)
  ) {
    const base = CONVERSATION_FORMAT_BLOCK;
    if (options?.includeRecommendationGuidance) {
      return `${base}\n\n${CONVERSATION_RECOMMENDATION_FORMAT_SUPPLEMENT}`;
    }
    return base;
  }

  return ENTERPRISE_V2_FORMAT_BLOCK;
}

const CONVERSATION_FORMAT_BLOCK = `RESPONSE FORMAT — conversation mode (structured JSON only):
Respond with a single valid JSON object and nothing else: no markdown fences, no prose outside JSON.

Use this lightweight shape:

{
  "mode": "conversation",
  "summary": "Natural conversational prose that directly answers the user.",
  "confidence": {
    "level": "low | medium | high"
  },
  "metadata": {
    "responseVersion": "v2"
  }
}

Required: "mode" (must be "conversation"), "summary", "metadata" with "responseVersion": "v2".
Optional: "confidence" with "level" only (omit long explanations).

DO NOT include in conversation mode:
- keyInsights
- evidence
- assumptions
- risks
- recommendedActions
- sections (unless absolutely necessary — prefer a single flowing "summary")

Conversation rules:
- Answer naturally and directly in "summary".
- Use the amount of explanation, structure, and examples appropriate to the question.
- Continue the existing thread when conversation history is present — build on prior turns.
- Do not assume the user is choosing between options unless they asked for a recommendation or decision.
- No report headings or section titles unless the user asked for structured output.
- Be warm, clear, and specific without corporate filler or "as an AI" phrasing.
- Do not expose internal scaffolding (evidence labels, confidence explanations, "key insights").
- NEVER open with "Considering your work-life balance", "productivity scores", "your dashboard indicates", "life twin data", or "behavioral patterns show".
- Use any private context silently — translate it into natural advice, not internal metrics.
- Do not include recommendedActions, keyInsights, evidence, assumptions, risks, or sections.`;

const CONVERSATION_RECOMMENDATION_FORMAT_SUPPLEMENT = `RECOMMENDATION CONVERSATION (when the user is choosing or deciding):
- Compare, rank, and explain tradeoffs when recommending options.
- Lead with your best fit and WHY when a recommendation is requested.
- Include practical realism when relevant (cost, timing, friction, vibe).
- Ask at most 1–2 follow-up questions that narrow the decision.
- Avoid brochure/SEO phrasing: "consider destinations like", "popular options include", "you may want to".`;

/** Thin factual answer with optional provenance — not an enterprise report. */
const GROUNDED_ANSWER_FORMAT_BLOCK = `RESPONSE FORMAT — grounded factual answer (structured JSON only):
Respond with a single valid JSON object and nothing else: no markdown fences, no prose outside JSON.

Use this thin shape:

{
  "mode": "answer",
  "summary": "A direct natural-language answer to the user's factual question.",
  "evidence": [
    {
      "label": "Source label from private context when available",
      "sourceType": "module | file | chat | calendar | drive | business | personal | system | unknown",
      "sourceId": "optional-id",
      "detail": "optional supporting detail"
    }
  ],
  "confidence": {
    "level": "low | medium | high"
  },
  "metadata": {
    "responseVersion": "v2"
  }
}

Required: "mode" (must be "answer"), "summary", "metadata" with "responseVersion": "v2".
Optional: "evidence" only when private context actually supports the fact; "confidence" with "level" only.

DO NOT include:
- keyInsights
- assumptions
- risks
- recommendedActions
- sections
- report-style headings

Grounded factual rules:
- Answer naturally and directly in "summary" (one clear answer; at most one short clarifying sentence).
- Use ONLY facts present in private/authoritative context for user-, business-, calendar-, file-, or workspace-specific claims.
- If the requested fact is missing, incomplete, or not attributable from available Vssyl data, say so plainly in "summary". Do not invent numbers, people, meetings, file shares, budgets, or other tenant-specific details from world knowledge.
- If context partially answers (e.g. event titles without attendees), state what you can see and what you cannot determine.
- Include "evidence" when you relied on a concrete context item; omit evidence when you cannot ground the claim.
- Never invent provenance.
- Do not expose internal scaffolding, dashboard scores, or "key insights" phrasing to the user.`;

const ENTERPRISE_V2_FORMAT_BLOCK = `RESPONSE FORMAT — structured output only:
Respond with a single valid JSON object and nothing else: no markdown, no code fences, no prose before or after the JSON.

Use this v2 shape (omit optional keys when not needed; use null or empty arrays only when truly appropriate):

{
  "mode": "answer | summary | analysis | recommendation | action_plan | comparison | status_update | error",
  "summary": "A clear 1-3 sentence answer or summary.",
  "keyInsights": ["Most important insight 1", "Most important insight 2"],
  "sections": [
    {
      "title": "Section title",
      "content": "Clear explanation",
      "bullets": ["Optional bullet"]
    }
  ],
  "evidence": [
    {
      "label": "What this is based on",
      "sourceType": "module | file | chat | calendar | drive | business | personal | system | unknown",
      "sourceId": "optional-id",
      "detail": "optional supporting detail"
    }
  ],
  "assumptions": ["Only include when making an inference not directly proven."],
  "risks": ["Missing data, uncertainty, operational risk, or possible issue."],
  "recommendedActions": [
    {
      "title": "Action title",
      "description": "Practical next step",
      "priority": "low | medium | high",
      "actionType": "manual | suggested | automated",
      "targetModule": "optional-module-name"
    }
  ],
  "confidence": {
    "level": "low | medium | high",
    "explanation": "Why this confidence level was chosen."
  },
  "style": {
    "tone": "clear | professional | concise | operator | supportive",
    "format": "standard | executive_summary | step_by_step | diagnostic"
  },
  "metadata": {
    "responseVersion": "v2"
  }
}

Required fields: always include "mode", "summary", "confidence" (object with "level" and "explanation"), and "metadata" with "responseVersion": "v2".

Minimum structure requirements:

* Always include 'keyInsights' when mode is 'analysis', 'recommendation', 'action_plan', or 'comparison'
* Always include 'evidence' when any context data (files, modules, chat, etc.) is present
* Always include at least one of: 'assumptions' or 'risks' when confidence is not 'high'
* Always include 'recommendedActions' when mode is 'recommendation' or 'action_plan'

Field guidance:
- Include "keyInsights" when the answer involves analysis, recommendations, summaries, or business/module/file/chat/calendar context.
- Include "evidence" when the answer draws on provided context: files, modules, chat, Drive, calendar, business, or personal data (label what you relied on).
- Include "assumptions" whenever you infer something not directly stated in the context.
- Include "risks" when data is missing, confidence is low, or there are operational or compliance concerns.
- Include "recommendedActions" only when useful and supportable from context; do not invent actions with no basis.
- Never state an inference as a fact; flag uncertainty in "assumptions" or "risks".
- If context is insufficient, say so clearly in "summary", "risks", and/or "assumptions".
- Be clear, grounded, and action-oriented. Avoid generic filler (e.g. "I hope this helps").
- Section "content" and "summary" should be plain language; avoid markdown in JSON string values when possible.

Legacy fallback (only if you cannot produce the v2 object): { "response": "plain text", "confidence": 0.85, "reasoning": "..." } — prefer v2 in all normal cases.`;
