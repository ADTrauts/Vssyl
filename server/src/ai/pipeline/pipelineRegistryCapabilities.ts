/**
 * Default capability flags for pipeline registry entities.
 */

import type { PipelineRegistryCapabilities, PipelineToolRuntimeKind } from '../types/pipelineDiagnostics';
import { isSystemIntentId } from './pipelineRegistryIds';

export function defaultIntentCapabilities(intentId: string): PipelineRegistryCapabilities {
  const system = isSystemIntentId(intentId);
  return {
    executable: true,
    inferable: system,
    retrievalEnabled: true,
    enforceable: true,
  };
}

export function defaultContextSourceCapabilities(
  wiredInTwin: boolean,
  lifecycleStatus?: string | null
): PipelineRegistryCapabilities {
  const live = lifecycleStatus === 'live' || (wiredInTwin && lifecycleStatus !== 'disabled');
  return {
    executable: live,
    inferable: false,
    retrievalEnabled: live,
    enforceable: live,
  };
}

export function defaultToolCapabilities(runtimeKind: PipelineToolRuntimeKind): PipelineRegistryCapabilities {
  switch (runtimeKind) {
    case 'openai_tool':
      return {
        executable: true,
        inferable: false,
        retrievalEnabled: false,
        enforceable: false,
      };
    case 'prepass':
      return {
        executable: true,
        inferable: false,
        retrievalEnabled: true,
        enforceable: true,
      };
    default:
      return {
        executable: false,
        inferable: false,
        retrievalEnabled: false,
        enforceable: false,
      };
  }
}

export function parseCapabilitiesJson(value: unknown): PipelineRegistryCapabilities | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const o = value as Record<string, unknown>;
  if (
    typeof o.executable !== 'boolean' ||
    typeof o.inferable !== 'boolean' ||
    typeof o.retrievalEnabled !== 'boolean' ||
    typeof o.enforceable !== 'boolean'
  ) {
    return undefined;
  }
  return {
    executable: o.executable,
    inferable: o.inferable,
    retrievalEnabled: o.retrievalEnabled,
    enforceable: o.enforceable,
  };
}

export function capabilitiesToJson(
  caps: PipelineRegistryCapabilities
): Record<string, boolean> {
  return { ...caps };
}
