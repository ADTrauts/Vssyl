import { prisma } from '../../lib/prisma';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import { assertIdentitySelfPolicy } from '../../auth/identityPolicyDual';
import { recordProfilePhotoUpdated } from './identityActivityService';

export class ProfilePhotoServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'ProfilePhotoServiceError';
  }
}

export async function assertPhotoWrite(userId: string): Promise<void> {
  await assertIdentitySelfPolicy({
    userId,
    action: POLICY_ACTIONS.USER_PHOTO_WRITE,
  });
}

export async function findOwnedPhoto(userId: string, photoId: string) {
  return prisma.userProfilePhoto.findFirst({
    where: { id: photoId, userId, trashedAt: null },
  });
}

export async function findOwnedPhotoWithOriginal(userId: string, photoId: string) {
  return prisma.userProfilePhoto.findFirst({
    where: { id: photoId, userId, trashedAt: null },
    select: { id: true, originalUrl: true, avatarUrl: true },
  });
}

export async function createProfilePhotoRecord(params: {
  userId: string;
  originalUrl: string;
  avatarUrl: string;
  crop?: object;
  rotation?: number;
}) {
  await assertPhotoWrite(params.userId);
  const created = await prisma.userProfilePhoto.create({
    data: {
      userId: params.userId,
      originalUrl: params.originalUrl,
      avatarUrl: params.avatarUrl,
      crop: params.crop,
      rotation: params.rotation,
    },
  });
  await recordProfilePhotoUpdated(params.userId, created.id, 'uploaded');
  return created;
}

export async function assignPhotoToSlot(params: {
  userId: string;
  photoId: string;
  target: 'personal' | 'business';
  avatarUrl: string;
}) {
  await assertPhotoWrite(params.userId);
  const currentUser = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { personalPhotoId: true, businessPhotoId: true },
  });
  if (!currentUser) {
    throw new ProfilePhotoServiceError('User not found', 404);
  }
  if (params.target === 'personal' && currentUser.businessPhotoId === params.photoId) {
    throw new ProfilePhotoServiceError('This photo is already assigned as business photo', 400);
  }
  if (params.target === 'business' && currentUser.personalPhotoId === params.photoId) {
    throw new ProfilePhotoServiceError('This photo is already assigned as personal photo', 400);
  }
  const updateData =
    params.target === 'personal'
      ? { personalPhotoId: params.photoId, personalPhoto: params.avatarUrl }
      : { businessPhotoId: params.photoId, businessPhoto: params.avatarUrl };

  const user = await prisma.user.update({
    where: { id: params.userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      personalPhoto: true,
      businessPhoto: true,
      personalPhotoId: true,
      businessPhotoId: true,
      image: true,
    },
  });
  await recordProfilePhotoUpdated(params.userId, params.photoId, 'assigned');
  return user;
}

export async function updatePhotoAvatarRecord(params: {
  userId: string;
  photoId: string;
  avatarUrl: string;
  crop: object;
  rotation?: number;
}) {
  await assertPhotoWrite(params.userId);
  const updatedPhoto = await prisma.userProfilePhoto.update({
    where: { id: params.photoId },
    data: {
      avatarUrl: params.avatarUrl,
      crop: params.crop,
      rotation: params.rotation,
    },
  });
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { personalPhotoId: true, businessPhotoId: true },
  });
  if (user?.personalPhotoId === params.photoId) {
    await prisma.user.update({
      where: { id: params.userId },
      data: { personalPhoto: params.avatarUrl },
    });
  }
  if (user?.businessPhotoId === params.photoId) {
    await prisma.user.update({
      where: { id: params.userId },
      data: { businessPhoto: params.avatarUrl },
    });
  }
  await recordProfilePhotoUpdated(params.userId, params.photoId, 'updated');
  return updatedPhoto;
}

export async function clearPhotoSlot(params: {
  userId: string;
  photoType: 'personal' | 'business';
}) {
  await assertPhotoWrite(params.userId);
  const updateData =
    params.photoType === 'personal'
      ? { personalPhoto: null, personalPhotoId: null }
      : { businessPhoto: null, businessPhotoId: null };

  const updatedUser = await prisma.user.update({
    where: { id: params.userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      personalPhoto: true,
      businessPhoto: true,
      image: true,
    },
  });
  await recordProfilePhotoUpdated(params.userId, params.userId, 'removed');
  return updatedUser;
}

function convertToProxyUrl(url: string | null, photoId: string | null, type: 'avatar' | 'original'): string | null {
  if (!url || !photoId) return url;
  return `/api/profile-photos/serve/${photoId}?type=${type}`;
}

export async function getProfilePhotosBundle(userId: string) {
  await assertIdentitySelfPolicy({
    userId,
    action: POLICY_ACTIONS.USER_PROFILE_READ,
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      personalPhoto: true,
      businessPhoto: true,
      personalPhotoId: true,
      businessPhotoId: true,
      image: true,
    },
  });
  if (!user) {
    throw new ProfilePhotoServiceError('User not found', 404);
  }

  const library = await prisma.userProfilePhoto.findMany({
    where: { userId, trashedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      originalUrl: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      rotation: true,
      crop: true,
    },
  });

  const libraryWithBackendUrls = library.map((photo) => ({
    ...photo,
    avatarUrl: convertToProxyUrl(photo.avatarUrl, photo.id, 'avatar'),
    originalUrl: convertToProxyUrl(photo.originalUrl, photo.id, 'original'),
  }));

  const resolvePhotoIdFromUrl = (url: string | null): string | null => {
    if (!url) return null;
    const match = library.find((item) => item.avatarUrl === url || item.originalUrl === url);
    return match?.id ?? null;
  };

  const personalPhotoId = user.personalPhotoId ?? resolvePhotoIdFromUrl(user.personalPhoto);
  const businessPhotoId = user.businessPhotoId ?? resolvePhotoIdFromUrl(user.businessPhoto);
  const personalPhotoUrl = personalPhotoId
    ? convertToProxyUrl(user.personalPhoto, personalPhotoId, 'avatar')
    : user.personalPhoto;
  const businessPhotoUrl = businessPhotoId
    ? convertToProxyUrl(user.businessPhoto, businessPhotoId, 'avatar')
    : user.businessPhoto;

  return {
    photos: {
      personal: personalPhotoUrl,
      business: businessPhotoUrl,
      default: user.image,
    },
    user: {
      ...user,
      personalPhoto: personalPhotoUrl,
      businessPhoto: businessPhotoUrl,
    },
    library: libraryWithBackendUrls,
  };
}

export async function getPhotoForServe(userId: string, photoId: string) {
  await assertIdentitySelfPolicy({
    userId,
    action: POLICY_ACTIONS.USER_PROFILE_READ,
  });
  return prisma.userProfilePhoto.findFirst({
    where: { id: photoId, userId, trashedAt: null },
  });
}

export async function syncUserAfterPhotoUpload(
  userId: string,
  photoId: string,
  avatarUrl: string,
  photoType?: string
) {
  if (photoType === 'personal') {
    await prisma.user.update({
      where: { id: userId },
      data: { personalPhotoId: photoId, personalPhoto: avatarUrl },
    });
  } else if (photoType === 'business') {
    await prisma.user.update({
      where: { id: userId },
      data: { businessPhotoId: photoId, businessPhoto: avatarUrl },
    });
  }
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      personalPhoto: true,
      businessPhoto: true,
      personalPhotoId: true,
      businessPhotoId: true,
      image: true,
    },
  });
}
