/**
 * Seed one [QA] AI conversation for Part 2F manual QA.
 * Run: node docs/ux/audits/qa-evidence/5G-QA/ai/seed-qa-conversation.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EMAIL = 'qa-calendar-5g-exec-2026@test.com';

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) {
    console.error(`User not found: ${EMAIL}`);
    process.exit(1);
  }

  const dashboard = await prisma.dashboard.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  });

  const existing = await prisma.aIConversation.findFirst({
    where: {
      userId: user.id,
      title: { contains: '[QA]' },
      trashedAt: null,
    },
  });

  if (existing) {
    console.log(`Existing QA conversation: ${existing.id}`);
    return;
  }

  const conv = await prisma.aIConversation.create({
    data: {
      userId: user.id,
      title: '[QA] AI Experience test conversation',
      dashboardId: dashboard?.id ?? null,
      messageCount: 2,
      lastMessageAt: new Date(),
      messages: {
        create: [
          {
            role: 'user',
            content: '[QA] Hello from Part 2F seed',
          },
          {
            role: 'assistant',
            content: '[QA] Seed assistant reply for menu and delete QA paths.',
            confidence: 0.9,
          },
        ],
      },
    },
  });

  console.log(`Created QA conversation: ${conv.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
