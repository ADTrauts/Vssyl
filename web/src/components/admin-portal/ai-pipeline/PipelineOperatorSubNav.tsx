'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  hash?: boolean;
};

/** Canonical AI Pipeline operator sub-navigation (Phase 4B). */
export const PIPELINE_OPERATOR_NAV: NavItem[] = [
  { href: '/admin-portal/ai-pipeline', label: 'Overview', exact: true },
  { href: '/admin-portal/ai-pipeline/executions', label: 'Executions' },
  { href: '/admin-portal/ai-pipeline/evaluations', label: 'Evaluations' },
  { href: '/admin-portal/ai-pipeline/corrections', label: 'Corrections' },
  { href: '/admin-portal/ai-pipeline/regressions', label: 'Regressions' },
  { href: '/admin-portal/ai-pipeline/metrics', label: 'Metrics' },
  { href: '/admin-portal/ai-pipeline/model-routing', label: 'Model Routing' },
  { href: '/admin-portal/ai-pipeline/diagnostics', label: 'Diagnostics' },
  { href: '/admin-portal/ai-pipeline/test-lab', label: 'Test Lab' },
  { href: '/admin-portal/ai-pipeline/replay', label: 'Replay' },
  { href: '/admin-portal/ai-pipeline/quality', label: 'Quality' },
  { href: '/admin-portal/ai-pipeline#provider-governance', label: 'Providers', hash: true },
  { href: '/admin-portal/ai-pipeline/system-health', label: 'System Health' },
  { href: '/admin-portal/ai-pipeline/settings', label: 'Settings' },
];

export function PipelineOperatorSubNav() {
  const pathname = usePathname() ?? '';
  return (
    <nav
      className="flex flex-wrap gap-v-2 border-b border-v-border pb-v-3 mb-v-4"
      aria-label="AI Pipeline operator sections"
    >
      {PIPELINE_OPERATOR_NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href || pathname === '/admin-portal/ai-pipeline/'
          : !item.hash && pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-v-3 py-v-1.5 rounded-md text-sm font-medium transition-colors ${
              active
                ? 'bg-v-accent text-white'
                : 'text-v-text-secondary hover:bg-v-surface-secondary'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
