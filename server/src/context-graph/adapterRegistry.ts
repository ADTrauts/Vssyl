import { calendarContextGraphAdapter } from './adapters/calendarAdapter.js';
import { chatContextGraphAdapter } from './adapters/chatAdapter.js';
import { driveContextGraphAdapter } from './adapters/driveAdapter.js';
import { notebookContextGraphAdapter } from './adapters/notebookAdapter.js';
import { notesContextGraphAdapter } from './adapters/notesAdapter.js';
import { placeContextGraphAdapter } from './adapters/placeAdapter.js';
import { todoContextGraphAdapter } from './adapters/todoAdapter.js';
import { vlinkContextGraphAdapter } from './adapters/vlinkAdapter.js';
import type { ContextGraphAdapter } from './contextGraphTypes.js';

const ADAPTERS: ContextGraphAdapter[] = [
  vlinkContextGraphAdapter,
  driveContextGraphAdapter,
  calendarContextGraphAdapter,
  todoContextGraphAdapter,
  notesContextGraphAdapter,
  notebookContextGraphAdapter,
  chatContextGraphAdapter,
  placeContextGraphAdapter,
];

const adapterIndex = new Map<string, ContextGraphAdapter>();

function adapterKey(moduleId: string, entityType: string): string {
  return `${moduleId}:${entityType}`;
}

export function registerContextGraphAdapter(adapter: ContextGraphAdapter): void {
  for (const entityType of adapter.supportedEntityTypes) {
    adapterIndex.set(adapterKey(adapter.moduleId, entityType), adapter);
  }
}

export function getAdapterForEntity(moduleId: string, entityType: string): ContextGraphAdapter | null {
  return adapterIndex.get(adapterKey(moduleId, entityType)) ?? null;
}

export function getAdapterByModuleId(moduleId: string): ContextGraphAdapter | null {
  return ADAPTERS.find((a) => a.moduleId === moduleId) ?? null;
}

export function listRegisteredAdapters(): ContextGraphAdapter[] {
  return [...ADAPTERS];
}

export function listSupportedEntityTypes(): Array<{ moduleId: string; entityType: string }> {
  const result: Array<{ moduleId: string; entityType: string }> = [];
  for (const adapter of ADAPTERS) {
    for (const entityType of adapter.supportedEntityTypes) {
      result.push({ moduleId: adapter.moduleId, entityType });
    }
  }
  return result;
}

export function initializeContextGraphAdapterRegistry(): void {
  adapterIndex.clear();
  for (const adapter of ADAPTERS) {
    registerContextGraphAdapter(adapter);
  }
}

initializeContextGraphAdapterRegistry();
