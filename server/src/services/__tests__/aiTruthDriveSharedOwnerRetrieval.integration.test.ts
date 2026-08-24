/**
 * D2 fixture retrieval — shared/owner/access (metadata only).
 * Skips cleanly when the AI truth fixture is not seeded.
 */
import { describe, expect, it } from 'vitest';
import { prisma } from '../../lib/prisma';
import { buildRecentFilesAIContext } from '../driveAIContextService';
import { listSharedFilesForAIContext } from '../driveVisibilityService';

const hasDb = Boolean(process.env.DATABASE_URL);
const FIXTURE_EMPLOYEE_EMAIL = 'ai.truth.employee@vssyl.local';
const FIXTURE_SARAH_EMAIL = 'ai.truth.sarah@vssyl.local';
const FIXTURE_FILE_NAME = 'Q3 Staffing Notes.pdf';
const FIXTURE_SARAH_NAME = 'AI Truth Sarah';
const FIXTURE_FILE_ID = 'a1t00000-0000-4000-a000-0000000000f1';

async function fixtureUsers() {
  const employee = await prisma.user.findUnique({ where: { email: FIXTURE_EMPLOYEE_EMAIL } });
  const sarah = await prisma.user.findUnique({ where: { email: FIXTURE_SARAH_EMAIL } });
  const file = await prisma.file.findUnique({ where: { id: FIXTURE_FILE_ID } });
  return { employee, sarah, file };
}

describe.runIf(hasDb)('D2 — AI truth Drive shared/owner retrieval', () => {
  it('shared-with-me returns Q3 owned by Sarah for employee', async () => {
    const { employee, file } = await fixtureUsers();
    if (!employee || !file) {
      console.warn('AI truth fixture not seeded — skipping D2 Drive retrieval');
      return;
    }

    const ctx = await buildRecentFilesAIContext(employee.id, null, {
      query: 'What files are shared with me?',
    });

    const hit =
      ctx.context.focus.files.find((f) => f.name === FIXTURE_FILE_NAME) ||
      ctx.context.sharedWithMe.find((f) => f.name === FIXTURE_FILE_NAME);

    expect(hit).toBeTruthy();
    expect(hit!.ownerName).toBe(FIXTURE_SARAH_NAME);
    expect(hit!.ownedByCurrentUser).toBe(false);
    expect(hit!.sharedWithCurrentUser).toBe(true);
    expect(hit!.accessLevel).toBe('read');
    expect(ctx.context.summary.shareGrantorRecorded).toBe(false);
    expect(JSON.stringify(ctx)).not.toMatch(/"sharedBy"/i);
  });

  it('owner filter Sarah on authorized set returns Q3', async () => {
    const { employee } = await fixtureUsers();
    if (!employee) return;

    const ctx = await buildRecentFilesAIContext(employee.id, null, {
      query: 'What files does Sarah own that I can access?',
    });

    expect(ctx.context.focus.mode).toBe('owner_accessible');
    expect(ctx.context.focus.files.map((f) => f.name)).toContain(FIXTURE_FILE_NAME);
    expect(ctx.context.focus.files[0]?.ownerName).toBe(FIXTURE_SARAH_NAME);
  });

  it('who owns Q3 returns AI Truth Sarah within authorized set', async () => {
    const { employee } = await fixtureUsers();
    if (!employee) return;

    const ctx = await buildRecentFilesAIContext(employee.id, null, {
      query: 'Who owns Q3 Staffing Notes.pdf?',
    });

    expect(ctx.context.focus.mode).toBe('ownership');
    expect(ctx.context.focus.files[0]?.ownerName).toBe(FIXTURE_SARAH_NAME);
    expect(ctx.context.focus.files[0]?.ownedByCurrentUser).toBe(false);
  });

  it('grantor question keeps owner separate and grantor unavailable', async () => {
    const { employee } = await fixtureUsers();
    if (!employee) return;

    const ctx = await buildRecentFilesAIContext(employee.id, null, {
      query: 'Who shared Q3 Staffing Notes.pdf with me?',
    });

    expect(ctx.context.focus.mode).toBe('grantor_unavailable');
    expect(ctx.context.focus.shareGrantorRecorded).toBe(false);
    expect(ctx.context.focus.files[0]?.ownerName).toBe(FIXTURE_SARAH_NAME);
    expect(ctx.context.focus.shareGrantorNote).toMatch(/not recorded/i);
  });

  it('unauthorized user cannot discover Q3 via owner query', async () => {
    const { employee, file } = await fixtureUsers();
    if (!employee || !file) return;

    // Synthetic outsider — no FilePermission on Q3.
    const outsider = await prisma.user.findFirst({
      where: {
        email: { notIn: [FIXTURE_EMPLOYEE_EMAIL, FIXTURE_SARAH_EMAIL] },
        NOT: { id: employee.id },
      },
      select: { id: true, email: true },
    });
    if (!outsider) {
      console.warn('No outsider user available — skipping auth isolation');
      return;
    }

    const shared = await listSharedFilesForAIContext({ userId: outsider.id, limit: 50 });
    expect(shared.some((f) => f.id === FIXTURE_FILE_ID || f.name === FIXTURE_FILE_NAME)).toBe(
      false
    );

    const ctx = await buildRecentFilesAIContext(outsider.id, null, {
      query: 'What files does Sarah own that I can access?',
    });
    expect(ctx.context.focus.files.some((f) => f.name === FIXTURE_FILE_NAME)).toBe(false);
    expect(ctx.context.sharedWithMe.some((f) => f.name === FIXTURE_FILE_NAME)).toBe(false);
    expect(ctx.context.recentFiles.some((f) => f.name === FIXTURE_FILE_NAME)).toBe(false);
  });

  it('trashed files are excluded from shared AI list (where clause)', async () => {
    // Domain contract: listSharedFilesForAIContext always sets trashedAt: null.
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const src = readFileSync(resolve(__dirname, '../driveVisibilityService.ts'), 'utf8');
    expect(src).toMatch(/export async function listSharedFilesForAIContext[\s\S]*?trashedAt:\s*null/);
  });
});
