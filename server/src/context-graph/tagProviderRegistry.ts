import { todoTagProvider } from './tagProviders/todoTagProvider.js';
import { notesTagProvider } from './tagProviders/notesTagProvider.js';
import { placeTagProvider } from './tagProviders/placeTagProvider.js';
import type { ContextGraphTagProvider } from './tagProviderTypes.js';

const TAG_PROVIDERS: ContextGraphTagProvider[] = [
  todoTagProvider,
  notesTagProvider,
  placeTagProvider,
];

export function listTagProviders(): ContextGraphTagProvider[] {
  return [...TAG_PROVIDERS];
}

export function getTagProviderForEntity(
  moduleId: string,
  entityType: string
): ContextGraphTagProvider | null {
  return (
    TAG_PROVIDERS.find(
      (p) => p.moduleId === moduleId && p.supportedEntityTypes.includes(entityType)
    ) ?? null
  );
}

export function getTagProviderByModule(moduleId: string): ContextGraphTagProvider | null {
  return TAG_PROVIDERS.find((p) => p.moduleId === moduleId) ?? null;
}
