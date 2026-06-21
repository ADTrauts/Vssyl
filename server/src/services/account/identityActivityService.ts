import { emitModuleActivityEvent } from '../moduleActivityService';

const MODULE_ID = 'account';

export async function recordProfileUpdated(actorUserId: string): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId,
    moduleId: MODULE_ID,
    action: 'profile.updated',
    targetType: 'user',
    targetId: actorUserId,
    visibilityScope: 'personal',
  });
}

export async function recordProfilePhotoUpdated(
  actorUserId: string,
  photoId: string,
  action: 'uploaded' | 'assigned' | 'updated' | 'removed'
): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId,
    moduleId: MODULE_ID,
    action: `profile_photo.${action}`,
    targetType: 'user_profile_photo',
    targetId: photoId,
    visibilityScope: 'personal',
  });
}

export async function recordPrivacyUpdated(actorUserId: string): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId,
    moduleId: MODULE_ID,
    action: 'privacy.updated',
    targetType: 'user_privacy_settings',
    targetId: actorUserId,
    visibilityScope: 'personal',
  });
}

export async function recordConnectionEvent(
  actorUserId: string,
  relationshipId: string,
  action: 'requested' | 'accepted' | 'declined' | 'blocked' | 'removed'
): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId,
    moduleId: MODULE_ID,
    action: `connection.${action}`,
    targetType: 'relationship',
    targetId: relationshipId,
    visibilityScope: 'personal',
  });
}
