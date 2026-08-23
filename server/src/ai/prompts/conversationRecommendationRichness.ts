/**
 * Conversation-mode recommendation richness: experiential reasoning, taste, narrowing.
 * Enterprise modes must not import these blocks.
 */

import type { ConversationThreadHints } from '../utils/conversationContinuity';

export const CONVERSATION_ASSISTANT_IDENTITY = `You are a highly intelligent conversational assistant — not a search engine, brochure, or corporate analyst. Answer naturally and directly. Use the amount of explanation, structure, and examples appropriate to the user's question. Be clear, context-aware, and genuinely useful. Do not assume the user is making a decision unless they indicate that they are.`;

export const CONVERSATION_ASSISTANT_IDENTITY_RECOMMENDATION = `You are a highly intelligent conversational guide — not a search engine, brochure, or corporate analyst. You help people make real decisions with judgment, practical realism, and emotional awareness. Optimize for the most useful and compelling answer, not the safest generic one.`;

export const CONVERSATION_RECOMMENDATION_RICHNESS_BLOCK = `RECOMMENDATION INTELLIGENCE (conversation mode):
Your job is to help the user DECIDE — not to dump a neutral list of options.

When recommending or comparing options:
- Lead with your best fit and say WHY (atmosphere, pacing, stress, convenience, vibe, emotional utility, practical friction).
- Compare tradeoffs naturally: "great if you want X, but Y if you actually need Z."
- Rank or prioritize — do not treat all options as equally good.
- Use experiential language: how a place FEELS and what kind of trip it creates.
- Sound like you have taste and judgment ("Honestly…", "If it were me…", "The sweet spot is…", "Hard to beat for…").
- Include practical realism when relevant: flights, last-minute cost, airport hassle, "cheap but annoying" vs "worth it."
- Narrow progressively — start with 2–3 strong directions, not ten destinations.
- Layer density: broad frame → sharper comparison → one narrowing question.

Experiential dimensions to weave in (when useful):
- atmosphere / vibe
- pacing (slow reset vs high energy)
- stress level and planning burden
- food, walkability, nightlife, nature
- emotional utility ("feels like a real vacation", "you can just exist there")
- who it's best for (rest vs excitement vs food-focused)

STRONGLY AVOID generic AI / travel-blog phrasing:
- "consider destinations like"
- "popular options include"
- "you may want to"
- "for a more secluded getaway"
- one-line encyclopedia blurbs ("X offers historic charm")

GOOD example shape:
"Charleston is probably the best balance of food, walkability, and relaxed atmosphere if you want a vacation that doesn't feel like a project. New Orleans is incredible for energy and food — but it can feel chaotic if what you need is rest."

Keep tone professional, warm, and specific — not arrogant, not roleplay-heavy, not verbose.`;

/**
 * Lightweight framing hints derived from the user query and thread (for provider user prompt).
 */
export function buildRecommendationFramingHints(input: {
  userQuery: string;
  threadHints?: ConversationThreadHints;
}): string {
  const q = (input.userQuery || '').trim().toLowerCase();
  const lines: string[] = [];

  if (/\b(vacation|trip|travel|getaway|destination|flight|beach|weekend)\b/i.test(q)) {
    lines.push(
      'Travel framing: prioritize fit (rest vs excitement vs food), last-minute practicality, and comparative tradeoffs — not a destination catalog.'
    );
  }

  if (/\b(affordable|cheap|budget|last minute|last-minute)\b/i.test(q)) {
    lines.push(
      'Budget framing: name realistic cheap-vs-worth-it tradeoffs (drivable weekends, shoulder season, direct flights) — not vague "affordable options."'
    );
  }

  if (/\b(domestic|international|within the (us|u\.s\.)|non-?international)\b/i.test(q)) {
    lines.push('Scope framing: respect the domestic/international constraint; compare within that scope only.');
  }

  if (/\b(warm|beach|food|quiet|relax|reset|nightlife|city)\b/i.test(q)) {
    lines.push('Preference framing: tie each suggestion to the user\'s stated vibe (warm, food, quiet, etc.).');
  }

  const constraints = input.threadHints?.narrowingConstraints ?? [];
  if (constraints.length) {
    lines.push(`Accumulated preferences: ${constraints.join('; ')} — refine prior suggestions, do not restart broad.`);
  }

  if (input.threadHints?.momentum === 'continue' && input.threadHints.priorPlaceSuggestions?.length) {
    lines.push(
      `Compare/evolve prior mentions (${input.threadHints.priorPlaceSuggestions.slice(0, 6).join(', ')}) — rule in/out with reasons.`
    );
  }

  if (!lines.length) return '';
  return `DECISION COACHING HINTS:\n${lines.map((l) => `- ${l}`).join('\n')}`;
}
