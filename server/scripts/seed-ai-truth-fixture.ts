/**
 * Deterministic LOCAL development fixture for AI authoritative-truth testing.
 *
 * Creates: Vssyl AI Truth Business + employee/manager/Sarah + Dietary org chart
 * + shared Drive file + tomorrow calendar event.
 *
 * Does NOT modify AI routing or providers.
 * Run: pnpm --filter vssyl-server seed:ai-truth
 * Verify: pnpm --filter vssyl-server verify:ai-truth
 */

import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
import * as bcrypt from 'bcrypt';
import { PrismaClient, BusinessRole } from '@prisma/client';
import orgChartService from '../src/services/orgChartService';
import employeeManagementService from '../src/services/employeeManagementService';
import { resolveManagerContext } from '../src/services/hrServiceShared';
import { canReadFile } from '../src/services/drivePermissionHelpers';
import { getUpcomingEventsForAI } from '../src/services/calendarVisibilityService';

const FIXTURE = {
  businessId: 'a1t00000-0000-4000-a000-000000000001',
  businessName: 'Vssyl AI Truth Business',
  employeeEmail: 'ai.truth.employee@vssyl.local',
  managerEmail: 'ai.truth.manager@vssyl.local',
  sarahEmail: 'ai.truth.sarah@vssyl.local',
  employeeName: 'AI Truth Employee',
  managerName: 'AI Truth Manager',
  sarahName: 'AI Truth Sarah',
  departmentName: 'Dietary',
  managerPositionTitle: 'Dietary Manager',
  employeePositionTitle: 'Dietary Supervisor',
  fileId: 'a1t00000-0000-4000-a000-0000000000f1',
  fileName: 'Q3 Staffing Notes.pdf',
  eventId: 'a1t00000-0000-4000-a000-0000000000e1',
  eventTitle: 'Weekly Dietary Meeting',
  employeeDashboardId: 'a1t00000-0000-4000-a000-0000000000d1',
  sarahDashboardId: 'a1t00000-0000-4000-a000-0000000000d2',
  passwordPlain: 'password123',
  modules: ['hr', 'drive', 'calendar', 'dashboard'] as const,
} as const;

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function assertLocalDatabaseTarget(): string {
  loadEnvFile(resolve(__dirname, '../../.env'));
  loadEnvFile(resolve(__dirname, '../.env'));

  const databaseUrl = process.env.DATABASE_URL || '';
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for AI truth fixture seeding');
  }

  let host = '';
  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    throw new Error('DATABASE_URL is not a valid URL');
  }

  const isLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host.endsWith('.local');

  if (!isLocal) {
    throw new Error(
      `AI truth fixture refused: DATABASE_URL host "${host}" is not local. ` +
        'This seed targets development PostgreSQL only.'
    );
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('AI truth fixture refused: NODE_ENV=production');
  }

  return `${host}${new URL(databaseUrl).pathname}`;
}

const prisma = new PrismaClient();

async function upsertUser(email: string, name: string, passwordHash: string) {
  return prisma.user.upsert({
    where: { email },
    update: { name },
    create: {
      email,
      name,
      password: passwordHash,
      role: 'USER',
      emailVerified: new Date(),
    },
  });
}

async function upsertMembership(
  businessId: string,
  userId: string,
  role: BusinessRole,
  title: string,
  department: string
) {
  return prisma.businessMember.upsert({
    where: { businessId_userId: { businessId, userId } },
    update: { role, title, department, isActive: true },
    create: {
      businessId,
      userId,
      role,
      title,
      department,
      isActive: true,
      canInvite: role === 'ADMIN',
      canManage: role === 'ADMIN',
      canBilling: role === 'ADMIN',
    },
  });
}

async function ensureBusinessModuleInstalls(businessId: string, installedBy: string) {
  const created: string[] = [];
  for (const moduleId of FIXTURE.modules) {
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) {
      throw new Error(`Required module "${moduleId}" is not registered in modules table`);
    }
    const existing = await prisma.businessModuleInstallation.findUnique({
      where: { moduleId_businessId: { moduleId, businessId } },
    });
    if (existing) {
      if (!existing.enabled) {
        await prisma.businessModuleInstallation.update({
          where: { id: existing.id },
          data: { enabled: true },
        });
      }
      continue;
    }
    await prisma.businessModuleInstallation.create({
      data: {
        businessId,
        moduleId,
        installedBy,
        enabled: true,
        configured: { permissions: ['view', 'create', 'edit', 'delete'] },
      },
    });
    created.push(moduleId);
  }
  return created;
}

async function ensureUserModuleInstalls(userId: string) {
  const created: string[] = [];
  for (const moduleId of FIXTURE.modules) {
    const existing = await prisma.moduleInstallation.findUnique({
      where: { moduleId_userId: { moduleId, userId } },
    });
    if (existing) {
      if (!existing.enabled) {
        await prisma.moduleInstallation.update({
          where: { id: existing.id },
          data: { enabled: true },
        });
      }
      continue;
    }
    await prisma.moduleInstallation.create({
      data: { userId, moduleId, enabled: true },
    });
    created.push(`${moduleId}@${userId}`);
  }
  return created;
}

async function ensureTier(businessId: string, name: string, level: number) {
  const existing = await prisma.organizationalTier.findFirst({
    where: { businessId, name },
  });
  if (existing) return existing;
  return orgChartService.createOrganizationalTier({
    businessId,
    name,
    level,
    description: `${name} tier for AI truth fixture`,
  });
}

async function ensureDepartment(businessId: string, name: string) {
  const existing = await prisma.department.findFirst({
    where: { businessId, name },
  });
  if (existing) return existing;
  return orgChartService.createDepartment({
    businessId,
    name,
    description: 'Dietary department for AI truth fixture',
  });
}

async function ensurePosition(params: {
  businessId: string;
  title: string;
  tierId: string;
  departmentId: string;
  reportsToId?: string | null;
}) {
  const existing = await prisma.position.findUnique({
    where: {
      businessId_title: {
        businessId: params.businessId,
        title: params.title,
      },
    },
  });
  if (existing) {
    return prisma.position.update({
      where: { id: existing.id },
      data: {
        tierId: params.tierId,
        departmentId: params.departmentId,
        reportsToId: params.reportsToId ?? null,
      },
    });
  }
  return orgChartService.createPosition({
    businessId: params.businessId,
    title: params.title,
    tierId: params.tierId,
    departmentId: params.departmentId,
    reportsToId: params.reportsToId ?? undefined,
    maxOccupants: 1,
  });
}

async function ensureAssignment(params: {
  userId: string;
  positionId: string;
  businessId: string;
  assignedById: string;
}) {
  const existing = await prisma.employeePosition.findFirst({
    where: {
      userId: params.userId,
      positionId: params.positionId,
      businessId: params.businessId,
      active: true,
    },
  });
  if (existing) return existing;

  const otherActive = await prisma.employeePosition.findMany({
    where: { userId: params.userId, businessId: params.businessId, active: true },
  });
  for (const row of otherActive) {
    await employeeManagementService.deactivateEmployeePositionById(
      row.id,
      params.businessId,
      new Date()
    );
  }

  return employeeManagementService.assignEmployeeToPosition({
    userId: params.userId,
    positionId: params.positionId,
    businessId: params.businessId,
    assignedById: params.assignedById,
    startDate: new Date('2024-01-01T00:00:00.000Z'),
  });
}

async function ensureDashboard(params: {
  id: string;
  userId: string;
  businessId: string;
  name: string;
}) {
  return prisma.dashboard.upsert({
    where: { id: params.id },
    update: { userId: params.userId, businessId: params.businessId, name: params.name },
    create: {
      id: params.id,
      userId: params.userId,
      businessId: params.businessId,
      name: params.name,
      layout: { widgets: [] },
      preferences: {},
    },
  });
}

async function ensureSharedFile(params: {
  ownerUserId: string;
  recipientUserId: string;
  dashboardId: string;
}) {
  const file = await prisma.file.upsert({
    where: { id: FIXTURE.fileId },
    update: {
      userId: params.ownerUserId,
      name: FIXTURE.fileName,
      dashboardId: params.dashboardId,
      trashedAt: null,
    },
    create: {
      id: FIXTURE.fileId,
      userId: params.ownerUserId,
      name: FIXTURE.fileName,
      type: 'application/pdf',
      size: 1024,
      url: `local://ai-truth-fixture/${FIXTURE.fileId}`,
      path: `ai-truth-fixture/${FIXTURE.fileName}`,
      dashboardId: params.dashboardId,
      order: 0,
      starred: false,
    },
  });

  await prisma.filePermission.upsert({
    where: {
      fileId_userId: { fileId: file.id, userId: params.recipientUserId },
    },
    update: { canRead: true, canWrite: false },
    create: {
      fileId: file.id,
      userId: params.recipientUserId,
      canRead: true,
      canWrite: false,
    },
  });

  return file;
}

function tomorrowAtLocalHour(hour: number, minute: number): { start: Date; end: Date } {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(hour, minute, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);
  return { start, end };
}

async function ensureCalendarAndEvent(params: {
  businessId: string;
  employeeUserId: string;
  businessName: string;
}) {
  let calendar = await prisma.calendar.findFirst({
    where: {
      contextType: 'BUSINESS',
      contextId: params.businessId,
      isPrimary: true,
    },
  });

  if (!calendar) {
    calendar = await prisma.calendar.create({
      data: {
        name: `${params.businessName} Calendar`,
        contextType: 'BUSINESS',
        contextId: params.businessId,
        isPrimary: true,
        isSystem: false,
        isDeletable: true,
        defaultReminderMinutes: 10,
        members: {
          create: {
            userId: params.employeeUserId,
            role: 'OWNER',
          },
        },
      },
    });
  } else {
    await prisma.calendarMember.upsert({
      where: {
        calendarId_userId: {
          calendarId: calendar.id,
          userId: params.employeeUserId,
        },
      },
      update: { role: 'OWNER' },
      create: {
        calendarId: calendar.id,
        userId: params.employeeUserId,
        role: 'OWNER',
      },
    });
  }

  const { start, end } = tomorrowAtLocalHour(10, 0);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  await prisma.event.upsert({
    where: { id: FIXTURE.eventId },
    update: {
      calendarId: calendar.id,
      title: FIXTURE.eventTitle,
      startAt: start,
      endAt: end,
      timezone,
      trashedAt: null,
      createdById: params.employeeUserId,
    },
    create: {
      id: FIXTURE.eventId,
      calendarId: calendar.id,
      title: FIXTURE.eventTitle,
      description: 'AI truth fixture event',
      startAt: start,
      endAt: end,
      allDay: false,
      timezone,
      createdById: params.employeeUserId,
      attendees: {
        create: {
          userId: params.employeeUserId,
          response: 'ACCEPTED',
        },
      },
    },
  });

  const existingAttendee = await prisma.eventAttendee.findFirst({
    where: { eventId: FIXTURE.eventId, userId: params.employeeUserId },
  });
  if (!existingAttendee) {
    await prisma.eventAttendee.create({
      data: {
        eventId: FIXTURE.eventId,
        userId: params.employeeUserId,
        response: 'ACCEPTED',
      },
    });
  }

  return calendar;
}

/** Domain-level manager resolution matching hrAttendanceService.resolveManagerUserId. */
export async function resolveFixtureManagerUserId(
  employeePositionId: string,
  businessId: string
): Promise<string | null> {
  const employeePosition = await prisma.employeePosition.findFirst({
    where: { id: employeePositionId, businessId },
    include: {
      position: {
        include: {
          reportsTo: {
            include: {
              employeePositions: {
                where: { businessId, active: true },
                take: 1,
                select: { userId: true },
              },
            },
          },
        },
      },
    },
  });

  return employeePosition?.position?.reportsTo?.employeePositions?.[0]?.userId ?? null;
}

export type VerificationRow = {
  fact: string;
  expected: string;
  actual: string;
  pass: boolean;
};

export async function verifyAiTruthFixture(): Promise<{
  ok: boolean;
  rows: VerificationRow[];
  meta: Record<string, string>;
}> {
  const business = await prisma.business.findUnique({
    where: { id: FIXTURE.businessId },
  });
  if (!business) {
    throw new Error('AI truth business not found — run seed:ai-truth first');
  }

  const employee = await prisma.user.findUnique({ where: { email: FIXTURE.employeeEmail } });
  const manager = await prisma.user.findUnique({ where: { email: FIXTURE.managerEmail } });
  const sarah = await prisma.user.findUnique({ where: { email: FIXTURE.sarahEmail } });
  if (!employee || !manager || !sarah) {
    throw new Error('AI truth users missing — run seed:ai-truth first');
  }

  const employeeEp = await prisma.employeePosition.findFirst({
    where: {
      userId: employee.id,
      businessId: FIXTURE.businessId,
      active: true,
    },
    include: {
      position: { include: { department: true, reportsTo: true } },
    },
  });

  const managerUserId = employeeEp
    ? await resolveFixtureManagerUserId(employeeEp.id, FIXTURE.businessId)
    : null;
  const managerUser = managerUserId
    ? await prisma.user.findUnique({ where: { id: managerUserId } })
    : null;

  const managerCtx = await resolveManagerContext(FIXTURE.businessId, manager.id);
  const directReportEps = managerCtx.directReportEmployeePositionIds;
  const directReportUsers =
    directReportEps.length > 0
      ? await prisma.employeePosition.findMany({
          where: { id: { in: directReportEps }, active: true },
          include: { user: { select: { email: true } } },
        })
      : [];
  const directReportEmails = directReportUsers.map((r) => r.user.email).sort();

  const file = await prisma.file.findUnique({
    where: { id: FIXTURE.fileId },
    include: { user: { select: { email: true, name: true } } },
  });
  const employeeCanRead = file ? await canReadFile(employee.id, file.id) : false;

  const upcoming = await getUpcomingEventsForAI(employee.id);
  const hasMeeting = upcoming.upcomingEvents.some((e) => e.title === FIXTURE.eventTitle);

  const rows: VerificationRow[] = [
    {
      fact: 'employee email',
      expected: FIXTURE.employeeEmail,
      actual: employee.email,
      pass: employee.email === FIXTURE.employeeEmail,
    },
    {
      fact: 'employee title',
      expected: FIXTURE.employeePositionTitle,
      actual: employeeEp?.position.title ?? '(none)',
      pass: employeeEp?.position.title === FIXTURE.employeePositionTitle,
    },
    {
      fact: 'employee department',
      expected: FIXTURE.departmentName,
      actual: employeeEp?.position.department?.name ?? '(none)',
      pass: employeeEp?.position.department?.name === FIXTURE.departmentName,
    },
    {
      fact: 'employee manager',
      expected: FIXTURE.managerEmail,
      actual: managerUser?.email ?? '(none)',
      pass: managerUser?.email === FIXTURE.managerEmail,
    },
    {
      fact: 'manager direct report',
      expected: FIXTURE.employeeEmail,
      actual: directReportEmails.join(',') || '(none)',
      pass: directReportEmails.includes(FIXTURE.employeeEmail),
    },
    {
      fact: 'shared file name',
      expected: FIXTURE.fileName,
      actual: file?.name ?? '(none)',
      pass: file?.name === FIXTURE.fileName,
    },
    {
      fact: 'file owner',
      expected: FIXTURE.sarahEmail,
      actual: file?.user.email ?? '(none)',
      pass: file?.user.email === FIXTURE.sarahEmail,
    },
    {
      fact: 'employee can read shared file',
      expected: 'true',
      actual: String(employeeCanRead),
      pass: employeeCanRead === true && file?.userId !== employee.id,
    },
    {
      fact: 'tomorrow/upcoming meeting',
      expected: FIXTURE.eventTitle,
      actual: hasMeeting
        ? FIXTURE.eventTitle
        : upcoming.upcomingEvents.map((e) => e.title).join(', ') || '(none)',
      pass: hasMeeting,
    },
  ];

  return {
    ok: rows.every((r) => r.pass),
    rows,
    meta: {
      businessId: FIXTURE.businessId,
      businessName: business.name,
      employeeId: employee.id,
      managerId: manager.id,
      sarahId: sarah.id,
    },
  };
}

export async function seedAiTruthFixture(): Promise<void> {
  const dbTarget = assertLocalDatabaseTarget();
  console.log(`🌱 AI truth fixture — database target: ${dbTarget}`);

  const passwordHash = await bcrypt.hash(FIXTURE.passwordPlain, 10);

  const manager = await upsertUser(FIXTURE.managerEmail, FIXTURE.managerName, passwordHash);
  const employee = await upsertUser(FIXTURE.employeeEmail, FIXTURE.employeeName, passwordHash);
  const sarah = await upsertUser(FIXTURE.sarahEmail, FIXTURE.sarahName, passwordHash);

  const business = await prisma.business.upsert({
    where: { id: FIXTURE.businessId },
    update: { name: FIXTURE.businessName },
    create: {
      id: FIXTURE.businessId,
      name: FIXTURE.businessName,
      ein: '00-AI-TRUTH',
      description: 'Isolated deterministic fixture for AI authoritative-truth testing',
      industry: 'Technology',
      size: '1-10',
      email: 'ai-truth@vssyl.local',
      tier: 'free',
      address: {
        street: '1 Fixture Lane',
        city: 'Dev City',
        state: 'DC',
        zip: '00000',
        country: 'US',
      },
    },
  });

  await upsertMembership(
    business.id,
    manager.id,
    'ADMIN',
    FIXTURE.managerPositionTitle,
    FIXTURE.departmentName
  );
  await upsertMembership(
    business.id,
    employee.id,
    'EMPLOYEE',
    FIXTURE.employeePositionTitle,
    FIXTURE.departmentName
  );
  await upsertMembership(business.id, sarah.id, 'EMPLOYEE', 'Colleague', FIXTURE.departmentName);

  const bizModulesCreated = await ensureBusinessModuleInstalls(business.id, manager.id);
  const userModulesCreated = [
    ...(await ensureUserModuleInstalls(employee.id)),
    ...(await ensureUserModuleInstalls(manager.id)),
    ...(await ensureUserModuleInstalls(sarah.id)),
  ];

  const managerTier = await ensureTier(business.id, 'Manager', 4);
  const employeeTier = await ensureTier(business.id, 'Employee', 5);
  const dietary = await ensureDepartment(business.id, FIXTURE.departmentName);

  const managerPosition = await ensurePosition({
    businessId: business.id,
    title: FIXTURE.managerPositionTitle,
    tierId: managerTier.id,
    departmentId: dietary.id,
    reportsToId: null,
  });

  const employeePosition = await ensurePosition({
    businessId: business.id,
    title: FIXTURE.employeePositionTitle,
    tierId: employeeTier.id,
    departmentId: dietary.id,
    reportsToId: managerPosition.id,
  });

  await ensureAssignment({
    userId: manager.id,
    positionId: managerPosition.id,
    businessId: business.id,
    assignedById: manager.id,
  });
  await ensureAssignment({
    userId: employee.id,
    positionId: employeePosition.id,
    businessId: business.id,
    assignedById: manager.id,
  });

  await ensureDashboard({
    id: FIXTURE.employeeDashboardId,
    userId: employee.id,
    businessId: business.id,
    name: 'AI Truth Employee Dashboard',
  });
  await ensureDashboard({
    id: FIXTURE.sarahDashboardId,
    userId: sarah.id,
    businessId: business.id,
    name: 'AI Truth Sarah Dashboard',
  });

  await ensureSharedFile({
    ownerUserId: sarah.id,
    recipientUserId: employee.id,
    dashboardId: FIXTURE.sarahDashboardId,
  });

  await ensureCalendarAndEvent({
    businessId: business.id,
    employeeUserId: employee.id,
    businessName: business.name,
  });

  console.log('✅ Fixture upsert complete');
  console.log(`   Business: ${business.name} (${business.id})`);
  console.log(`   Users: ${FIXTURE.employeeEmail}, ${FIXTURE.managerEmail}, ${FIXTURE.sarahEmail}`);
  console.log(
    `   Business modules newly created: ${bizModulesCreated.length ? bizModulesCreated.join(', ') : '(none — already present)'}`
  );
  console.log(
    `   User module installs newly created: ${userModulesCreated.length ? userModulesCreated.length : 0}`
  );

  const verification = await verifyAiTruthFixture();
  for (const row of verification.rows) {
    console.log(`   ${row.pass ? 'PASS' : 'FAIL'} ${row.fact}: expected=${row.expected} actual=${row.actual}`);
  }
  if (!verification.ok) {
    throw new Error('AI truth fixture domain verification failed');
  }
  console.log('✅ Domain verification PASS');
}

async function main() {
  try {
    await seedAiTruthFixture();
  } catch (error) {
    console.error('❌ AI truth fixture seed failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main();
}
