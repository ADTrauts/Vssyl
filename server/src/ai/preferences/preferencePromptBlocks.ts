import type { ResolvedEffectivePreferences } from './preferenceTypes';
import { isConversationStructuredMode } from '../prompts/structuredResponseFormat';

const PREFERENCE_USAGE_RULES = `PREFERENCE USAGE (internal — never cite settings to the user):
- Apply tone, verbosity, structure, and recommendation style naturally; do not say "your settings say" or mention questionnaires.
- Hard autonomy boundaries are limits on actions and approvals, not conversational filler.
- Inferred hints and session adjustments are optional; explicit user instructions in the thread always win.`;

/**
 * System-prompt section for provider personality + autonomy boundaries.
 */
export function buildPreferenceSystemPromptSection(input: {
  effective: ResolvedEffectivePreferences;
  structuredResponseMode?: string;
}): string {
  const { effective, structuredResponseMode } = input;
  const conversation = isConversationStructuredMode(structuredResponseMode);
  const instructions =
    effective.providerPayload.softPromptInstructions ||
    'Adapt tone and length to the user and context.';

  const boundaries = effective.providerPayload.autonomyBoundaries;
  const actionRules = Array.isArray(boundaries.actionRules)
    ? (boundaries.actionRules as string[])
    : [];

  const lines: string[] = [PREFERENCE_USAGE_RULES, ''];

  if (conversation) {
    lines.push('COMMUNICATION PREFERENCES (adapt style only — do not impersonate the user):');
    lines.push(instructions);
    lines.push('');
    lines.push('RECOMMENDATION STYLE:');
    const richness = effective.soft.recommendationRichness;
    if (richness === 'concise') {
      lines.push('- Prefer concise, decisive guidance; avoid long option catalogs.');
    } else if (richness === 'rich') {
      lines.push('- Use experiential comparison and tradeoffs when recommending; still stay focused.');
    } else {
      lines.push('- Balance depth and clarity; compare options when helpful.');
    }
    lines.push('');
    lines.push('ACTION BOUNDARIES (for proposed actions only — not for chat tone):');
    if (actionRules.length > 0) {
      lines.push(actionRules.map((r) => `- ${r}`).join('\n'));
    } else {
      lines.push('- Follow platform approval rules for high-impact actions.');
    }
  } else {
    lines.push('USER COMMUNICATION PREFERENCES:');
    lines.push(instructions);
    lines.push('');
    lines.push('ACTION BOUNDARIES:');
    if (actionRules.length > 0) {
      lines.push(actionRules.map((r) => `- ${r}`).join('\n'));
    } else {
      lines.push('- Follow platform approval rules for high-impact actions.');
    }
  }

  return lines.join('\n');
}

/**
 * Optional conversation richness adjustment based on soft recommendation preference.
 */
export function buildConversationRichnessOverride(
  structuredResponseMode?: string,
  richness?: string
): string | null {
  if (!isConversationStructuredMode(structuredResponseMode)) return null;
  if (richness === 'concise') {
    return 'Keep recommendations tight: lead with one strong option, at most one alternative, then a narrowing question.';
  }
  return null;
}
