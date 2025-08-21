import { prisma } from '../lib/prisma';

export async function getUserPreference(userId: string, key: string): Promise<string | null> {
  const pref = await prisma.userPreference.findUnique({
    where: { userId_key: { userId, key } }
  });
  return pref ? pref.value : null;
}

export async function setUserPreference(userId: string, key: string, value: string): Promise<void> {
  await prisma.userPreference.upsert({
    where: { userId_key: { userId, key } },
    update: { value },
    create: { userId, key, value },
  });
} 