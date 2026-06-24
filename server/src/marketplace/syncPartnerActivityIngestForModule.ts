import { prisma } from '../lib/prisma.js';
import { syncPartnerActivityIngestForModule } from './activityIngestRegistry.js';

function certificationAllowsActivity(certificationStatus: string | null | undefined): boolean {
  return certificationStatus !== 'FAILED';
}

export async function syncPartnerActivityIngestForModuleId(moduleId: string): Promise<void> {
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
    syncPartnerActivityIngestForModule({
      moduleId: mod.id,
      moduleName: mod.name,
      moduleStatus: mod.status,
      manifest: mod.manifest as Record<string, unknown>,
      publishedVersion: null,
    });
    return;
  }

  const scanPassed = published.artifact?.scanStatus === 'PASSED' || !published.artifact;

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
      certificationAllowsActivity: certificationAllowsActivity(published.certificationStatus),
    },
  });
}
