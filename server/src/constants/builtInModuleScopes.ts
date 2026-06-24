import type { ModuleScopeClassification } from 'shared/types/module-scope';
import { type BuiltInModuleId, BUILT_IN_MODULE_IDS } from './builtInModuleIds';

/** Authoritative scope for first-party built-in modules. */
export const BUILT_IN_MODULE_SCOPES: Record<BuiltInModuleId, ModuleScopeClassification> = {
  drive: 'both',
  chat: 'both',
  calendar: 'both',
  todo: 'both',
  notes: 'both',
  notebook: 'both',
  vlink: 'both',
  place: 'both',
  dashboard: 'both',
  hr: 'business',
  scheduling: 'business',
  workforce_comms: 'business',
};

export function getBuiltInModuleScope(moduleId: string): ModuleScopeClassification | undefined {
  if (!(BUILT_IN_MODULE_IDS as readonly string[]).includes(moduleId)) {
    return undefined;
  }
  return BUILT_IN_MODULE_SCOPES[moduleId as BuiltInModuleId];
}
