import { randomInt } from 'crypto';
import { prisma } from '../lib/prisma';

const MAX_ATTEMPTS = 5;

export function formatVLinkPublicCode(digits: string): string {
  return `VL-${digits}`;
}

export function normalizePublicCodeInput(input: string): string {
  const trimmed = input.trim().toUpperCase();
  if (trimmed.startsWith('VL-')) {
    return trimmed;
  }
  return formatVLinkPublicCode(trimmed.replace(/\D/g, '').slice(0, 12));
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function generateUniquePublicCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const digits = Array.from({ length: 12 }, () => randomInt(0, 10)).join('');
    const publicCode = formatVLinkPublicCode(digits);
    const existing = await prisma.vLink.findUnique({
      where: { publicCode },
      select: { id: true },
    });
    if (!existing) {
      return publicCode;
    }
  }
  throw new Error('Failed to generate unique V_Link public code');
}
