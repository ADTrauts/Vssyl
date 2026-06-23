export type { DomainEvent, DomainEventEmitInput } from './types';
export { emitDomainEvent, domainEventToJsonValue } from './emitDomainEvent';
export {
  DOMAIN_EVENT_TYPES,
  DOMAIN_EVENT_CONTRACTS,
  getDomainEventContract,
  isRegisteredDomainEventType,
  sanitizeDomainEventMetadata,
  buildTypedDomainEventInput,
} from './domainEventRegistry';
export type { DomainEventContract, DomainEventType } from './domainEventRegistry';
export {
  emitUserPreferenceUpdatedEvent,
  emitModuleInstalledEvent,
  emitModuleUninstalledEvent,
  emitBusinessMemberAddedEvent,
} from './domainEventEmitters';
export { subscribeDomainEvents, publishDomainEvent, DOMAIN_EVENT_CHANNEL } from './domainEventBus';
export {
  registerDomainEventSubscribers,
  resetDomainEventSubscriberRegistrationForTests,
} from './registerDomainEventSubscribers';
export {
  DOMAIN_EVENT_SUBSCRIBER_MATRIX,
  DOMAIN_EVENT_EMITTER_OWNERSHIP,
  DOMAIN_EVENT_MODULE_PARTICIPATION,
  DOMAIN_EVENT_PRODUCTION_SUBSCRIBER_IDS,
  resolveActiveDomainEventSubscribers,
  validateDomainEventOperationMatrix,
  isOptionalDomainEventSubscriberEnabled,
  validateCertifiedModuleParticipation,
  CERTIFIED_MODULE_PARTICIPATION_IDS,
} from './domainEventOperationMatrix';
export type {
  DomainEventSubscriberDefinition,
  DomainEventSubscriberClass,
  DomainEventEmitterOwnership,
  DomainEventModuleParticipation,
  DomainEventOperationMatrixValidation,
  ModuleParticipationValidation,
} from './domainEventOperationMatrix';
