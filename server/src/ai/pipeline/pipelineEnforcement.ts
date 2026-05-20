/**
 * Phase 4 — grounding enforcement (block / disclose / regenerate prepass).
 */

import type {
  AIPipelineTrace,
  PipelineEnforcementSettings,
} from '../types/pipelineDiagnostics';
import { GROUNDING_ISSUE } from './buildPipelineTrace';

export const ENFORCEMENT_BLOCKED_ISSUE = 'Response blocked: grounding required but retrieval was not performed.';
export const ENFORCEMENT_DISCLOSURE_SUFFIX =
  '\n\n---\n*Note: This answer may not be fully grounded in your location, memory, or live data. For local or factual questions, try sharing your city or enabling relevant modules.*';

const DEFAULT_BLOCKED_MESSAGE =
  "I don't have enough grounded context (location, memory, or live data) to answer that reliably. Share your city or area, or ask me to search your Place and Drive context, and I'll try again.";

export function resolvePipelineEnforcementSettings(
  fromDb?: PipelineEnforcementSettings | null
): PipelineEnforcementSettings {
  if (process.env.AI_PIPELINE_ENFORCEMENT_ENABLED === 'false') {
    return { enforcementEnabled: false, enforcementMode: 'off' };
  }
  if (process.env.AI_PIPELINE_ENFORCEMENT_ENABLED === 'true') {
    const mode = process.env.AI_PIPELINE_ENFORCEMENT_MODE;
    const enforcementMode =
      mode === 'disclose' || mode === 'block' || mode === 'regenerate' ? mode : 'block';
    return { enforcementEnabled: true, enforcementMode };
  }
  if (fromDb) return fromDb;
  return { enforcementEnabled: false, enforcementMode: 'off' };
}

export function shouldRunGroundingRetrievalPrepass(
  settings: PipelineEnforcementSettings
): boolean {
  return settings.enforcementEnabled && settings.enforcementMode === 'regenerate';
}

export function traceHasGroundingViolation(trace: AIPipelineTrace): boolean {
  return (
    trace.groundingRequired &&
    !trace.retrievalPerformed &&
    trace.issues.includes(GROUNDING_ISSUE)
  );
}

export function shouldBlockUngroundedResponse(
  settings: PipelineEnforcementSettings,
  trace: AIPipelineTrace
): boolean {
  if (!settings.enforcementEnabled) return false;
  if (settings.enforcementMode !== 'block' && settings.enforcementMode !== 'regenerate') {
    return false;
  }
  return traceHasGroundingViolation(trace);
}

export function shouldDiscloseUngroundedResponse(
  settings: PipelineEnforcementSettings,
  trace: AIPipelineTrace
): boolean {
  if (!settings.enforcementEnabled || settings.enforcementMode !== 'disclose') return false;
  return traceHasGroundingViolation(trace);
}

export interface ApplyPipelineEnforcementResult {
  response: string;
  tracePatch: Pick<
    AIPipelineTrace,
    'enforcementApplied' | 'enforcementAction' | 'issues' | 'genericResponseRisk' | 'finalResponsePreview'
  >;
}

export function applyPipelineEnforcement(
  response: string,
  trace: AIPipelineTrace,
  settings: PipelineEnforcementSettings
): ApplyPipelineEnforcementResult {
  if (shouldBlockUngroundedResponse(settings, trace)) {
    const blocked = DEFAULT_BLOCKED_MESSAGE;
    return {
      response: blocked,
      tracePatch: {
        enforcementApplied: true,
        enforcementAction: 'blocked',
        genericResponseRisk: true,
        issues: [...trace.issues.filter((i) => i !== GROUNDING_ISSUE), ENFORCEMENT_BLOCKED_ISSUE],
        finalResponsePreview: blocked.slice(0, 280),
      },
    };
  }

  if (shouldDiscloseUngroundedResponse(settings, trace)) {
    const disclosed = response.trimEnd() + ENFORCEMENT_DISCLOSURE_SUFFIX;
    return {
      response: disclosed,
      tracePatch: {
        enforcementApplied: true,
        enforcementAction: 'disclosed',
        genericResponseRisk: true,
        issues: trace.issues,
        finalResponsePreview: disclosed.slice(0, 280),
      },
    };
  }

  return {
    response,
    tracePatch: {
      enforcementApplied: false,
      enforcementAction: 'none',
      genericResponseRisk: trace.genericResponseRisk,
      issues: trace.issues,
      finalResponsePreview: trace.finalResponsePreview,
    },
  };
}
