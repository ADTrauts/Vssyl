'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Badge, Button, Card, Spinner } from 'shared/components';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { AdminPortalPageShell } from '../../../../components/admin-portal/AdminPortalPageShell';
import { usePlatformAdoptionModuleDetail } from '../../../../components/admin-portal/usePlatformAdoptionDashboard';

interface CapabilityRow {
  key: string;
  label: string;
  level: string;
  liveNote?: string;
}

interface ModuleDetail {
  moduleId: string;
  displayName: string;
  adoptionLevelLabel: string;
  score: number;
  certificationRef: string;
  lastValidated: string;
  topGap: string;
  recommendedImprovements: string[];
  recentChanges: Array<{ wave: number; date: string; summary: string }>;
  docLinks: Array<{ label: string; href: string }>;
  capabilityChecklist: CapabilityRow[];
  validationWarnings: string[];
}

function participationBadge(level: string): 'green' | 'blue' | 'yellow' | 'gray' {
  if (level === 'full') return 'green';
  if (level === 'partial') return 'blue';
  if (level === 'na') return 'gray';
  return 'yellow';
}

export default function PlatformAdoptionModulePage() {
  const params = useParams();
  const moduleId = typeof params.moduleId === 'string' ? params.moduleId : '';
  const { detail, loading, error, refresh } = usePlatformAdoptionModuleDetail(moduleId);
  const mod = detail as ModuleDetail | null;

  return (
    <AdminPortalPageShell
      title={mod?.displayName ?? 'Module adoption'}
      description={mod?.topGap}
      actions={
        <div className="flex items-center gap-v-2">
          <Link href="/admin-portal/platform-adoption">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2 inline" />
              Back
            </Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 inline ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      }
    >
      {error ? <p className="text-sm text-yellow-700 dark:text-yellow-300">{error}</p> : null}
      {loading && !mod ? (
        <div className="flex justify-center py-v-8">
          <Spinner />
        </div>
      ) : null}

      {mod ? (
        <div className="space-y-v-6">
          <Card className="p-v-4">
            <div className="flex flex-wrap gap-v-4 text-sm">
              <div>
                <p className="text-v-text-muted">Adoption level</p>
                <Badge color="blue">{mod.adoptionLevelLabel}</Badge>
              </div>
              <div>
                <p className="text-v-text-muted">Score</p>
                <p className="font-semibold">{mod.score}/100</p>
              </div>
              <div>
                <p className="text-v-text-muted">Certification</p>
                <p>{mod.certificationRef}</p>
              </div>
              <div>
                <p className="text-v-text-muted">Last validation</p>
                <p>{mod.lastValidated}</p>
              </div>
            </div>
          </Card>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-v-text-secondary mb-v-3">
              Platform capability checklist
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-v-border rounded-lg">
                <thead>
                  <tr className="bg-v-surface-secondary text-left">
                    <th className="p-v-2">Capability</th>
                    <th className="p-v-2">Participation</th>
                    <th className="p-v-2">Live signal</th>
                  </tr>
                </thead>
                <tbody>
                  {mod.capabilityChecklist.map((row) => (
                    <tr key={row.key} className="border-t border-v-border">
                      <td className="p-v-2">{row.label}</td>
                      <td className="p-v-2">
                        <Badge color={participationBadge(row.level)}>{row.level}</Badge>
                      </td>
                      <td className="p-v-2 text-v-text-muted">{row.liveNote ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {mod.recentChanges.length > 0 ? (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-v-text-secondary mb-v-3">
                Recent adoption changes
              </h2>
              <ul className="space-y-v-2 text-sm">
                {mod.recentChanges.map((change) => (
                  <li key={`${change.date}-${change.summary}`}>
                    <span className="text-v-text-muted">{change.date} · Wave {change.wave}</span>
                    <p>{change.summary}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-v-text-secondary mb-v-3">
              Recommended improvements
            </h2>
            <ul className="list-disc pl-v-5 text-sm space-y-v-1">
              {mod.recommendedImprovements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          {mod.validationWarnings.length > 0 ? (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-v-text-secondary mb-v-3">
                Validation warnings
              </h2>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-v-1">
                {mod.validationWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-v-text-secondary mb-v-3">
              Reference documentation
            </h2>
            <ul className="text-sm space-y-v-1">
              {mod.docLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-blue-600 dark:text-blue-400 underline">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </AdminPortalPageShell>
  );
}
