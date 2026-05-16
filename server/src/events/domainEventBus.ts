import { EventEmitter } from 'events';
import type { DomainEvent } from './types';

export const DOMAIN_EVENT_CHANNEL = 'domain:event:internal' as const;

const emitter = new EventEmitter();
emitter.setMaxListeners(50);

export type DomainEventListener = (event: DomainEvent) => void | Promise<void>;

export function subscribeDomainEvents(listener: DomainEventListener): () => void {
  emitter.on(DOMAIN_EVENT_CHANNEL, listener as (...args: unknown[]) => void);
  return () => {
    emitter.off(DOMAIN_EVENT_CHANNEL, listener as (...args: unknown[]) => void);
  };
}

export function publishDomainEvent(event: DomainEvent): void {
  emitter.emit(DOMAIN_EVENT_CHANNEL, event);
}
