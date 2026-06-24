import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import {
  clearPartnerWorkspaceParticipationRegistry,
  syncPartnerWorkspaceParticipationForModule,
} from './workspaceParticipationRegistry.js';
import { registerSandboxPilotWorkspaceParticipationOnStartup } from './registerSandboxPilotWorkspaceParticipation.js';

function certificationAllowsWorkspace(certificationStatus: string | null | undefined): boolean {
  return certificationStatus !== 'FAILED';
}

export async function syncAllPartnerWorkspaceParticipationsFromDatabase(): Promise<{
  registered: number;
  skipped: number;
}> {
  clearPartnerWorkspaceParticipationRegistry();

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
    const certOk = certificationAllowsWorkspace(published.certificationStatus);

    syncPartnerWorkspaceParticipationForModule({
      moduleId: mod.id,
      moduleName: mod.name,
      moduleStatus: mod.status,
      manifest: mod.manifest as Record<string, unknown>,
      publishedVersion: {
        id: published.id,
        version: published.version,
        manifestSnapshot: published.manifestSnapshot as Record<string, unknown>,
        scanPassed,
        certificationAllowsWorkspace: certOk,
      },
    });

    const manifest = published.manifestSnapshot as Record<string, unknown>;
    const hasWorkspace =
      manifest &&
      typeof manifest === 'object' &&
      Boolean((manifest as Record<string, unknown>).workspaceParticipation) &&
      scanPassed &&
      certOk;

    if (hasWorkspace) {
      registered += 1;
    } else {
      skipped += 1;
    }
  }

  registerSandboxPilotWorkspaceParticipationOnStartup();

  void logger.info('Partner workspace participation sync complete', {
    operation: 'partner_workspace_participation_sync_all',
    registered,
    skipped,
  });

  return { registered, skipped };
}
