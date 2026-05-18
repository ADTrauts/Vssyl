/**
 * Provider-facing structured response format instructions (conversation vs enterprise v2).
 */

import type { AIResponseMode } from '../types/structuredResponse';

export function isConversationStructuredMode(mode?: string): boolean {
  return (mode || '').trim().toLowerCase() === 'conversation';
}

export function buildStructuredResponseFormatInstructions(structuredResponseMode?: AIResponseMode): string {
  if (isConversationStructuredMode(structuredResponseMode)) {
    return CONVERSATION_FORMAT_BLOCK;
  }
  return ENTERPRISE_V2_FORMAT_BLOCK;
}

const CONVERSATION_FORMAT_BLOCK = `RESPONSE FORMAT — conversation mode (structured JSON only):
Respond with a single valid JSON object and nothing else: no markdown fences, no prose outside JSON.

Use this lightweight shape:

{
  "mode": "conversation",
  "summary": "Natural, emotionally aware reply in short paragraphs. Sound like a highly intelligent human assistant — not a consultant or report.",
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
- Continue the existing thread when conversation history is present — build on prior turns; do not restart from scratch.
- Use 2–4 substantive paragraphs in "summary" when continuing a thread; 1–2 paragraphs only for a brand-new topic with no history.
- No report headings or section titles.
- Ask at most 1–2 follow-up questions that narrow the decision (not generic "anything else?").
- Offer light opinions when helpful ("I'd probably lean toward…", "Honestly…", "If it were me…").
- Avoid framework language, optimization matrices, corporate tone, and "as an AI" filler.
- Avoid brochure/SEO phrasing: "consider destinations like", "popular options include", "you may want to", "for a more secluded getaway".
- Do not use bullet lists in "summary" unless the user explicitly asked for a list.
- Be warm, specific, and emotionally intelligent when the topic is personal or ambiguous.
- Do not expose internal scaffolding (evidence labels, confidence explanations, "key insights").
- NEVER open with "Considering your work-life balance", "productivity scores", "your dashboard indicates", "life twin data", or "behavioral patterns show".
- Use any private context silently — translate it into natural advice, not internal metrics.
- Do not include recommendedActions, keyInsights, evidence, assumptions, risks, or sections.`;

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
