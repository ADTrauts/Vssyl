/**
 * Integration smoke — requires local Postgres + applied migration `20260601130000_add_notebook_links`.
 * Run: DATABASE_URL=... pnpm exec vitest run src/services/__tests__/notebookLink.integration.test.ts
 */
import { describe, expect, it } from 'vitest';
import { prisma } from '../../lib/prisma';

const hasDb = Boolean(process.env.RUN_NOTEBOOK_LINK_DB_TESTS === '1');

describe.skipIf(!hasDb)('notebookLink DB integration', () => {
  it('notebook_links table exists in database', async () => {
    const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'notebook_links'
      ) AS "exists"
    `;
    expect(rows[0]?.exists).toBe(true);
  });

  it('can insert and archive a link row when fixtures exist', async () => {
    const note = await prisma.note.findFirst({
      where: { trashedAt: null },
      select: { id: true, dashboardId: true, businessId: true, createdById: true },
    });
    const task = await prisma.task.findFirst({
      where: { trashedAt: null },
      select: { id: true, dashboardId: true },
    });

    if (!note || !task || note.dashboardId !== task.dashboardId) {
      return;
    }

    const link = await prisma.notebookLink.create({
      data: {
        dashboardId: note.dashboardId,
        businessId: note.businessId,
        sourceType: 'PAGE',
        sourceId: note.id,
        targetType: 'TASK',
        targetId: task.id,
        relationshipType: 'REFERENCE',
        createdById: note.createdById,
      },
    });

    expect(link.id).toBeTruthy();

    await prisma.notebookLink.update({
      where: { id: link.id },
      data: { archivedAt: new Date() },
    });

    const archived = await prisma.notebookLink.findUnique({ where: { id: link.id } });
    expect(archived?.archivedAt).not.toBeNull();

    await prisma.notebookLink.delete({ where: { id: link.id } });
  });
});
