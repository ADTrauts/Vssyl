import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import {
  clearPartnerSearchDelegateRegistry,
  syncPartnerSearchDelegateForModule,
} from './searchDelegateRegistry.js';
import { registerSandboxPilotSearchDelegateOnStartup } from './registerSandboxPilotSearchDelegate.js';

function certificationAllowsSearch(certificationStatus: string | null | undefined): boolean {
  return certificationStatus !== 'FAILED';
}

/**
 * Reload all partner search delegates from approved modules with current published versions.
 */
export async function syncAllPartnerSearchDelegatesFromDatabase(): Promise<{
  registered: number;
  skipped: number;
}> {
  clearPartnerSearchDelegateRegistry();

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
          artifact: {
            select: { scanStatus: true },
          },
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
    const certOk = certificationAllowsSearch(published.certificationStatus);

    syncPartnerSearchDelegateForModule({
      moduleId: mod.id,
      moduleName: mod.name,
      moduleStatus: mod.status,
      manifest: mod.manifest as Record<string, unknown>,
      publishedVersion: {
        id: published.id,
        version: published.version,
        manifestSnapshot: published.manifestSnapshot as Record<string, unknown>,
        scanPassed,
        certificationAllowsSearch: certOk,
      },
    });

    const manifest = published.manifestSnapshot as Record<string, unknown>;
    const hasSearchDelegate =
      manifest &&
      typeof manifest === 'object' &&
      Boolean((manifest as Record<string, unknown>).searchDelegate) &&
      scanPassed &&
      certOk;

    if (hasSearchDelegate) {
      registered += 1;
    } else {
      skipped += 1;
    }
  }

  registerSandboxPilotSearchDelegateOnStartup();

  void logger.info('Partner search delegate sync complete', {
    operation: 'partner_search_delegate_sync_all',
    registered,
    skipped,
  });

  return { registered, skipped };
}
