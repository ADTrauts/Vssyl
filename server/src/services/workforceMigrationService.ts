import {
  WorkforceAudienceType,
  WorkforceCommunicationStatus,
  WorkforceCommunicationType,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { resolveAudienceForPublish } from './workforceAudienceService';
import {
  mapFrontPagePriorityToWorkforce,
  assertWorkforceCommsAuthor,
} from './workforceServiceShared';

type FrontPageAnnouncement = {
  id?: string;
  title?: string;
  content?: string;
  priority?: string;
  createdAt?: string;
  expiresAt?: string | null;
};

function parseAnnouncements(raw: unknown): FrontPageAnnouncement[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((item) => typeof item === 'object' && item !== null) as FrontPageAnnouncement[];
}

function isAnnouncementActive(announcement: FrontPageAnnouncement): boolean {
  if (!announcement.expiresAt) return true;
  const expires = new Date(announcement.expiresAt);
  return !Number.isNaN(expires.getTime()) && expires > new Date();
}

export async function importFrontPageAnnouncements(params: {
  businessId: string;
  actorUserId: string;
  dryRun?: boolean;
}) {
  await assertWorkforceCommsAuthor(params.actorUserId, params.businessId);

  const config = await prisma.businessFrontPageConfig.findFirst({
    where: { businessId: params.businessId },
    select: { companyAnnouncements: true },
  });

  const announcements = parseAnnouncements(config?.companyAnnouncements);
  const candidates = announcements.filter(isAnnouncementActive);

  const existingLegacyIds = new Set(
    (
      await prisma.workforceCommunication.findMany({
        where: {
          businessId: params.businessId,
          legacyFrontPageId: { not: null },
        },
        select: { legacyFrontPageId: true },
      })
    )
      .map((row) => row.legacyFrontPageId)
      .filter((id): id is string => typeof id === 'string')
  );

  const toImport = candidates.filter((item) => {
    const legacyId = typeof item.id === 'string' ? item.id : undefined;
    return legacyId ? !existingLegacyIds.has(legacyId) : true;
  });

  if (params.dryRun) {
    return {
      dryRun: true,
      candidateCount: candidates.length,
      importCount: toImport.length,
      skippedExisting: candidates.length - toImport.length,
      imported: [] as string[],
    };
  }

  const imported: string[] = [];

  for (const announcement of toImport) {
    const legacyId = typeof announcement.id === 'string' ? announcement.id : undefined;
    const title = (announcement.title ?? 'Announcement').trim();
    const body = (announcement.content ?? '').trim() || title;

    const communication = await prisma.workforceCommunication.create({
      data: {
        businessId: params.businessId,
        createdById: params.actorUserId,
        publishedById: params.actorUserId,
        publishedAt: announcement.createdAt ? new Date(announcement.createdAt) : new Date(),
        title,
        body,
        communicationType: WorkforceCommunicationType.ANNOUNCEMENT,
        priority: mapFrontPagePriorityToWorkforce(announcement.priority),
        status: WorkforceCommunicationStatus.PUBLISHED,
        requiresAck: false,
        requiresRead: true,
        showOnFrontPage: true,
        showInHubFeed: true,
        expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt) : null,
        legacyFrontPageId: legacyId ?? null,
      },
    });

    await prisma.workforceAudience.create({
      data: {
        communicationId: communication.id,
        audienceType: WorkforceAudienceType.BUSINESS,
        spec: {},
        estimatedCount: null,
      },
    });

    await resolveAudienceForPublish({
      businessId: params.businessId,
      communicationId: communication.id,
      audienceType: WorkforceAudienceType.BUSINESS,
      spec: {},
    });

    imported.push(communication.id);
  }

  logger.info('Front page announcements imported to workforce communications', {
    operation: 'import_front_page_announcements',
    businessId: params.businessId,
    actorUserId: params.actorUserId,
    importCount: imported.length,
  });

  return {
    dryRun: false,
    candidateCount: candidates.length,
    importCount: imported.length,
    skippedExisting: candidates.length - toImport.length,
    imported,
  };
}

export async function previewFrontPageMigration(params: {
  businessId: string;
  actorUserId: string;
}) {
  return importFrontPageAnnouncements({
    ...params,
    dryRun: true,
  });
}
