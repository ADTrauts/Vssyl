import { prisma } from '../lib/prisma.js';
import { syncPartnerSearchDelegateForModule } from './searchDelegateRegistry.js';

function certificationAllowsSearch(certificationStatus: string | null | undefined): boolean {
  return certificationStatus !== 'FAILED';
}

export async function syncPartnerSearchDelegateForModuleId(moduleId: string): Promise<void> {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
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

  if (!mod) {
    return;
  }

  const published = mod.versions[0];
  if (!published) {
    syncPartnerSearchDelegateForModule({
      moduleId: mod.id,
      moduleName: mod.name,
      moduleStatus: mod.status,
      manifest: mod.manifest as Record<string, unknown>,
      publishedVersion: null,
    });
    return;
  }

  const scanPassed = published.artifact?.scanStatus === 'PASSED' || !published.artifact;

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
      certificationAllowsSearch: certificationAllowsSearch(published.certificationStatus),
    },
  });
}
