export interface GlobalTrashHandlerInput {
  userId: string;
  type: string;
  id: string;
  metadata?: unknown;
}

export interface GlobalTrashModuleHandler {
  moduleId: string;
  moduleName: string;
  supportedTypes: string[];
  softTrash?(input: GlobalTrashHandlerInput): Promise<void>;
  restore(input: GlobalTrashHandlerInput): Promise<boolean>;
  permanentDelete(input: GlobalTrashHandlerInput): Promise<boolean>;
  emptyModuleTrash(input: { userId: string }): Promise<number>;
  listTrashed?(input: { userId: string }): Promise<unknown[]>;
}

const handlersByModuleId = new Map<string, GlobalTrashModuleHandler>();

export function registerGlobalTrashModuleHandler(handler: GlobalTrashModuleHandler): void {
  handlersByModuleId.set(handler.moduleId, handler);
}

export function getGlobalTrashModuleHandler(moduleId: string): GlobalTrashModuleHandler | undefined {
  return handlersByModuleId.get(moduleId);
}

export function getGlobalTrashHandlerForType(
  moduleId: string,
  type: string
): GlobalTrashModuleHandler | undefined {
  const handler = handlersByModuleId.get(moduleId);
  if (!handler) return undefined;
  if (!handler.supportedTypes.includes(type)) return undefined;
  return handler;
}

export function listGlobalTrashModuleHandlers(): GlobalTrashModuleHandler[] {
  return Array.from(handlersByModuleId.values());
}

/** Test helper — reset registry between tests. */
export function clearGlobalTrashModuleHandlersForTests(): void {
  handlersByModuleId.clear();
}
