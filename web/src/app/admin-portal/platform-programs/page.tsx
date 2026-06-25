'use client';

import React from 'react';
import Link from 'next/link';
import { Button, Spinner } from 'shared/components';
import { Activity, FileText, Gauge, RefreshCw } from 'lucide-react';
import { AdminPortalPageShell } from '../../../components/admin-portal/AdminPortalPageShell';
import { PlatformProgramCard } from '../../../components/admin-portal/PlatformProgramCard';
import { usePlatformProgramsHubHealth } from '../../../components/admin-portal/usePlatformProgramsHubHealth';
import { PLATFORM_PROGRAM_DEFINITIONS } from '../../../config/platformPrograms';

export default function PlatformProgramsPage() {
  const { healthByProgram, loading, error, refresh } = usePlatformProgramsHubHealth();

  return (
    <AdminPortalPageShell
      title="Platform Programs"
      description="Certified platform capabilities — operational home. Deep links reuse existing governance surfaces; no duplicate dashboards."
      actions={
        <Button variant="secondary" size="sm" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 inline ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      {error ? (
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-v-4">
          Some program health data could not be loaded: {error}. Cards still link to canonical surfaces.
        </p>
      ) : null}

      <section aria-labelledby="platform-programs-grid-heading">
        <h2 id="platform-programs-grid-heading" className="sr-only">
          Certified platform programs
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-v-6">
          {PLATFORM_PROGRAM_DEFINITIONS.map((program) => {
            const health = healthByProgram[program.id];
            return (
              <PlatformProgramCard
                key={program.id}
                programId={program.id}
                name={program.name}
                description={program.description}
                certificationLabel={program.certificationLabel}
                certificationLevel={program.certificationLevel}
                version={program.version}
                lastValidated={program.lastValidated}
                openFindings={program.openFindings}
                healthStatus={loading && !health ? 'loading' : (health?.healthStatus ?? 'unknown')}
                healthSummary={health?.healthSummary}
                readinessSummary={health?.readinessSummary}
                primaryAction={program.primaryAction}
                secondaryActions={program.secondaryActions}
                operatorLinks={program.operatorLinks}
                engineerLinks={program.engineerLinks}
              />
            );
          })}
        </div>
      </section>

      <section className="mt-v-8 pt-v-6 border-t border-v-border" aria-labelledby="quick-diagnostics-heading">
        <h2
          id="quick-diagnostics-heading"
          className="text-sm font-semibold text-v-text-secondary uppercase tracking-wide mb-v-3"
        >
          Quick diagnostics
        </h2>
        <p className="text-sm text-v-text-muted mb-v-3">
          Forensics and logs — same surfaces as before, grouped for operator discoverability.
        </p>
        <div className="flex flex-wrap gap-v-4">
          <Link
            href="/admin-portal/ai-pipeline/diagnostics"
            className="inline-flex items-center gap-v-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <Activity className="w-4 h-4" />
            AI trace diagnostics
          </Link>
          <Link
            href="/admin-portal/system-logs"
            className="inline-flex items-center gap-v-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <FileText className="w-4 h-4" />
            System logs
          </Link>
          <Link
            href="/admin-portal/performance"
            className="inline-flex items-center gap-v-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <Gauge className="w-4 h-4" />
            Performance
          </Link>
        </div>
      </section>

      <section className="mt-v-6">
        <p className="text-sm text-v-text-muted">
          Marketplace certification and delegate probes remain on{' '}
          <Link href="/admin-portal/modules" className="text-blue-600 dark:text-blue-400 underline">
            Marketplace → Modules
          </Link>{' '}
          submission detail via the readiness card.
        </p>
      </section>
    </AdminPortalPageShell>
  );
}
