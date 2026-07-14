/**
 * Phase 8 — Conservative skill selection (explicit key authoritative).
 */
import type { AISkillSelectionInput, AISkillSelectionResult } from 'vssyl-shared';
import { getSkillDefinition, listSkillDefinitions } from './skillRegistry';
import { isExecutableStatus } from './skillLifecycle';

export function selectSkill(input: AISkillSelectionInput): AISkillSelectionResult {
  const rejected: AISkillSelectionResult['rejected'] = [];
  const eligibleAlternatives: AISkillSelectionResult['eligibleAlternatives'] = [];

  if (input.explicitSkillKey) {
    const def = getSkillDefinition(input.explicitSkillKey, input.explicitVersion);
    if (!def) {
      return {
        selectionReason: 'explicit_not_found',
        confidence: 0,
        eligibleAlternatives: [],
        rejected: [{ key: input.explicitSkillKey, version: input.explicitVersion, reason: 'not_found' }],
        clarificationRequired: false,
        shadowMode: false,
      };
    }
    if (def.status === 'SUSPENDED' || def.status === 'RETIRED' || def.status === 'DRAFT') {
      return {
        selectionReason: 'explicit_not_executable',
        confidence: 0,
        eligibleAlternatives: [],
        rejected: [{ key: def.key, version: def.version, reason: `status_${def.status}` }],
        clarificationRequired: false,
        shadowMode: false,
      };
    }
    if (def.contextRequirements.businessMembershipRequired && !input.businessId) {
      return {
        selectionReason: 'business_membership_required',
        confidence: 0,
        eligibleAlternatives: [],
        rejected: [{ key: def.key, version: def.version, reason: 'business_required' }],
        clarificationRequired: false,
        shadowMode: false,
      };
    }
    if (!isExecutableStatus(def.status) && def.status !== 'DEPRECATED') {
      rejected.push({ key: def.key, version: def.version, reason: `status_${def.status}` });
    }
    return {
      selected: { key: def.key, version: def.version },
      selectionReason: 'explicit_invocation',
      confidence: 1,
      eligibleAlternatives: [],
      rejected,
      clarificationRequired: false,
      shadowMode: false,
    };
  }

  if (!input.intentType) {
    return {
      selectionReason: 'no_intent_or_explicit_key',
      confidence: 0,
      eligibleAlternatives: [],
      rejected: [],
      clarificationRequired: true,
      shadowMode: Boolean(input.preferShadowAutoSelect),
    };
  }

  const candidates = listSkillDefinitions({
    intentType: input.intentType,
    executableOnly: true,
  }).filter((d) => {
    if (d.contextRequirements.businessMembershipRequired && !input.businessId) {
      rejected.push({ key: d.key, version: d.version, reason: 'business_required' });
      return false;
    }
    if (input.moduleId && d.scope === 'MODULE_INTERNAL') {
      const allowed = d.contextRequirements.moduleIds;
      if (allowed && allowed.length > 0 && !allowed.includes(input.moduleId)) {
        rejected.push({ key: d.key, version: d.version, reason: 'module_mismatch' });
        return false;
      }
    }
    return true;
  });

  if (candidates.length === 0) {
    return {
      selectionReason: 'no_eligible_candidates',
      confidence: 0,
      eligibleAlternatives: [],
      rejected,
      clarificationRequired: true,
      shadowMode: Boolean(input.preferShadowAutoSelect),
    };
  }

  if (candidates.length > 1) {
    for (const c of candidates) {
      eligibleAlternatives.push({
        key: c.key,
        version: c.version,
        reason: 'intent_match',
      });
    }
    // Conservative: do not silently auto-execute when ambiguous
    if (input.preferShadowAutoSelect) {
      const first = candidates[0];
      return {
        selected: { key: first.key, version: first.version },
        selectionReason: 'shadow_auto_select_first_eligible',
        confidence: 0.45,
        eligibleAlternatives: eligibleAlternatives.slice(1),
        rejected,
        clarificationRequired: true,
        shadowMode: true,
      };
    }
    return {
      selectionReason: 'ambiguous_intent',
      confidence: 0.4,
      eligibleAlternatives,
      rejected,
      clarificationRequired: true,
      shadowMode: false,
    };
  }

  const only = candidates[0];
  return {
    selected: { key: only.key, version: only.version },
    selectionReason: 'unique_intent_match',
    confidence: 0.85,
    eligibleAlternatives: [],
    rejected,
    clarificationRequired: false,
    shadowMode: false,
  };
}
