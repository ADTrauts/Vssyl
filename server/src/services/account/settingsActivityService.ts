import { emitModuleActivityEvent } from '../moduleActivityService';
import { emitDomainEvent } from '../../events/emitDomainEvent';
import { buildTypedDomainEventInput, DOMAIN_EVENT_TYPES } from '../../events/domainEventRegistry';

const MODULE_ID = 'settings';

export async function recordSettingsUpdated(
  actorUserId: string,
  keys: string[]
): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId,
    moduleId: MODULE_ID,
    action: 'settings.updated',
    targetType: 'user_settings',
    targetId: actorUserId,
    visibilityScope: 'personal',
    metadata: { keys },
  });

  emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.SETTINGS_UPDATED, {
      actorUserId,
      entityId: actorUserId,
      metadata: { keys },
    })
  );
}

export async function recordThemeChanged(
  actorUserId: string,
  theme: string
): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId,
    moduleId: MODULE_ID,
    action: 'theme.changed',
    targetType: 'appearance.theme',
    targetId: actorUserId,
    visibilityScope: 'personal',
    metadata: { theme },
  });

  emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.SETTINGS_THEME_CHANGED, {
      actorUserId,
      entityId: actorUserId,
      metadata: { theme },
    })
  );
}

export async function recordPreferenceChanged(
  actorUserId: string,
  key: string
): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId,
    moduleId: MODULE_ID,
    action: 'preference.changed',
    targetType: 'user_preference',
    targetId: key,
    visibilityScope: 'personal',
    metadata: { key },
  });

  emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.SETTINGS_PREFERENCE_CHANGED, {
      actorUserId,
      entityId: key,
      metadata: { key },
    })
  );
}
