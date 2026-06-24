import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import {
  clearPartnerActivityIngestRegistry,
  syncPartnerActivityIngestForModule,
} from './activityIngestRegistry.js';
import { registerSandboxPilotActivityIngestOnStartup } from './registerSandboxPilotActivityIngest.js';

function certificationAllowsActivity(certificationStatus: string | null | undefined): boolean {
  return certificationStatus !== 'FAILED';
}

export async function syncAllPartnerActivityIngestFromDatabase(): Promise<{
  registered: number;
  skipped: number;
}> {
  clearPartnerActivityIngestRegistry();

  let registered = 0;
  let skipped = 0;

  const modules = await prisma.module.findMany({
    where: { status: 'APPROVED' },
    select: {
      id: true,
      name: true,
      status: true,
      manifest: true,
      versions: {
        where: { isCurrent: true, status: 'PUBLISHED' },
        take: 1,
        select: {
          id: true,
          version: true,
          manifestSnapshot: true,
          certificationStatus: true,
          artifact: { select: { scanStatus: true } },
        },
      },
    },
  });

  for (const mod of modules) {
    const published = mod.versions[0];
    if (!published) {
      skipped += 1;
      continue;
    }

    const scanPassed = published.artifact?.scanStatus === 'PASSED' || !published.artifact;
    const certOk = certificationAllowsActivity(published.certificationStatus);

    syncPartnerActivityIngestForModule({
      moduleId: mod.id,
      moduleName: mod.name,
      moduleStatus: mod.status,
      manifest: mod.manifest as Record<string, unknown>,
      publishedVersion: {
        id: published.id,
        version: published.version,
        manifestSnapshot: published.manifestSnapshot as Record<string, unknown>,
        scanPassed,
        certificationAllowsActivity: certOk,
      },
    });

    const manifest = published.manifestSnapshot as Record<string, unknown>;
    const hasActivity =
      manifest &&
      typeof manifest === 'object' &&
      Boolean((manifest as Record<string, unknown>).activityIngest) &&
      scanPassed &&
      certOk;

    if (hasActivity) {
      registered += 1;
    } else {
      skipped += 1;
    }
  }

  registerSandboxPilotActivityIngestOnStartup();

  void logger.info('Partner activity ingest sync complete', {
    operation: 'partner_activity_ingest_sync_all',
    registered,
    skipped,
  });

  return { registered, skipped };
}
