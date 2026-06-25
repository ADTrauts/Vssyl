'use client';

import React from 'react';
import Link from 'next/link';
import { Button, Spinner } from 'shared/components';
import { RefreshCw } from 'lucide-react';
import { AdminPortalPageShell } from '../../../components/admin-portal/AdminPortalPageShell';
import { PlatformAdoptionCard } from '../../../components/admin-portal/PlatformAdoptionCard';
import { usePlatformAdoptionDashboard } from '../../../components/admin-portal/usePlatformAdoptionDashboard';

export default function PlatformAdoptionPage() {
  const { data, loading, error, refresh } = usePlatformAdoptionDashboard();

  const fleet = data?.fleet;

  return (
    <AdminPortalPageShell
      title="Platform Adoption"
      description="Operational visibility into how each module participates in platform capabilities — search, kernel, AI retrieval, context graph, and more."
      actions={
        <Button variant="secondary" size="sm" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 inline ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      {error ? (
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-v-4">{error}</p>
      ) : null}

      {loading && !data ? (
        <div className="flex justify-center py-v-8">
          <Spinner />
        </div>
      ) : null}

      {fleet ? (
        <section className="mb-v-8" aria-labelledby="fleet-summary-heading">
          <h2 id="fleet-summary-heading" className="text-sm font-semibold text-v-text-secondary uppercase tracking-wide mb-v-3">
            Fleet summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-v-4 text-sm">
            <div className="rounded-lg border border-v-border p-v-3">
              <p className="text-v-text-muted">Average score</p>
              <p className="text-xl font-semibold text-v-text-primary">{fleet.averageScore}</p>
            </div>
            <div className="rounded-lg border border-v-border p-v-3">
              <p className="text-v-text-muted">Fully searchable</p>
              <p className="text-xl font-semibold text-v-text-primary">
                {fleet.modulesFullySearchable}/{fleet.totalModules}
              </p>
            </div>
            <div className="rounded-lg border border-v-border p-v-3">
              <p className="text-v-text-muted">AI retrieval (Full)</p>
              <p className="text-xl font-semibold text-v-text-primary">
                {fleet.modulesAiRetrievalFull}/{fleet.totalModules}
              </p>
            </div>
            <div className="rounded-lg border border-v-border p-v-3">
              <p className="text-v-text-muted">Kernel (Full)</p>
              <p className="text-xl font-semibold text-v-text-primary">
                {fleet.modulesKernelActivityFull}/{fleet.totalModules}
              </p>
            </div>
            <div className="rounded-lg border border-v-border p-v-3">
              <p className="text-v-text-muted">Context graph (Full)</p>
              <p className="text-xl font-semibold text-v-text-primary">
                {fleet.modulesContextGraphFull}/{fleet.totalModules}
              </p>
            </div>
            <div className="rounded-lg border border-v-border p-v-3">
              <p className="text-v-text-muted">Marketplace modules</p>
              <p className="text-xl font-semibold text-v-text-primary">{fleet.marketplaceCapableModules}</p>
            </div>
            <div className="rounded-lg border border-v-border p-v-3">
              <p className="text-v-text-muted">Level B+</p>
              <p className="text-xl font-semibold text-v-text-primary">
                {(fleet.levelDistribution.A ?? 0) + (fleet.levelDistribution.B ?? 0)}
              </p>
            </div>
            <div className="rounded-lg border border-v-border p-v-3">
              <p className="text-v-text-muted">CI warnings</p>
              <p className="text-xl font-semibold text-v-text-primary">{fleet.validationWarningCount}</p>
            </div>
          </div>
        </section>
      ) : null}

      {data?.trends?.length ? (
        <section className="mb-v-8" aria-labelledby="adoption-trends-heading">
          <h2 id="adoption-trends-heading" className="text-sm font-semibold text-v-text-secondary uppercase tracking-wide mb-v-3">
            Adoption trend
          </h2>
          <ol className="space-y-v-2 text-sm">
            {data.trends.map((point) => (
              <li key={`${point.date}-${point.label}`} className="flex justify-between gap-v-4 border-b border-v-border pb-v-2">
                <span className="text-v-text-secondary">
                  {point.label}
                  {point.wave ? ` (Wave ${point.wave})` : ''}
                </span>
                <span className="font-medium text-v-text-primary">{point.averageScore}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section aria-labelledby="module-adoption-grid-heading">
        <h2 id="module-adoption-grid-heading" className="text-sm font-semibold text-v-text-secondary uppercase tracking-wide mb-v-3">
          Module adoption cards
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-v-4">
          {data?.modules.map((mod) => (
            <PlatformAdoptionCard
              key={mod.moduleId}
              moduleId={mod.moduleId}
              displayName={mod.displayName}
              adoptionLevel={mod.adoptionLevel}
              adoptionLevelLabel={mod.adoptionLevelLabel}
              score={mod.score}
              certificationRef={mod.certificationRef}
              lastValidated={mod.lastValidated}
              topGap={mod.topGap}
              missingCapabilities={mod.missingCapabilities}
              validationWarningCount={mod.validationWarnings.length}
            />
          ))}
        </div>
      </section>

      <section className="mt-v-8 pt-v-6 border-t border-v-border">
        <p className="text-sm text-v-text-muted">
          Partner module certification probes remain on{' '}
          <Link href="/admin-portal/modules" className="text-blue-600 dark:text-blue-400 underline">
            Marketplace → Modules
          </Link>
          . Platform program health:{' '}
          <Link href="/admin-portal/platform-programs" className="text-blue-600 dark:text-blue-400 underline">
            Platform Programs
          </Link>
          .
        </p>
      </section>
    </AdminPortalPageShell>
  );
}
