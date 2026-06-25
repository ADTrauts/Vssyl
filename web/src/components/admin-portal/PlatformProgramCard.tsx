'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Card } from 'shared/components';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

export type PlatformProgramHealthStatus = 'healthy' | 'degraded' | 'unknown' | 'loading';

export interface PlatformProgramCardProps {
  programId: string;
  name: string;
  description: string;
  certificationLabel: string;
  certificationLevel: string;
  version: string;
  lastValidated: string;
  openFindings: string[];
  healthStatus: PlatformProgramHealthStatus;
  healthSummary?: string;
  readinessSummary?: string;
  primaryAction: { label: string; href: string };
  secondaryActions?: Array<{ label: string; href: string }>;
  operatorLinks?: Array<{ label: string; href: string; description?: string }>;
  engineerLinks?: Array<{ label: string; href: string; description?: string }>;
}

function healthBadgeColor(status: PlatformProgramHealthStatus): 'green' | 'yellow' | 'gray' | 'blue' {
  switch (status) {
    case 'healthy':
      return 'green';
    case 'degraded':
      return 'yellow';
    case 'loading':
      return 'blue';
    default:
      return 'gray';
  }
}

function healthLabel(status: PlatformProgramHealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'Within threshold';
    case 'degraded':
      return 'Needs attention';
    case 'loading':
      return 'Loading…';
    default:
      return 'Unknown';
  }
}

function isExternalHref(href: string): boolean {
  return href.startsWith('http') || href.startsWith('/docs/');
}

function ActionLink({
  href,
  label,
  variant,
}: {
  href: string;
  label: string;
  variant: 'primary' | 'secondary';
}) {
  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={
          variant === 'primary'
            ? 'inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400'
            : 'inline-flex items-center gap-1 text-sm text-v-text-secondary hover:text-v-text-primary'
        }
      >
        {label}
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }

  if (variant === 'primary') {
    return (
      <Link href={href}>
        <Button variant="primary" size="sm">
          {label}
        </Button>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="text-sm text-v-text-secondary hover:text-v-text-primary underline-offset-2 hover:underline"
    >
      {label}
    </Link>
  );
}

/** Reusable certified platform program card with progressive disclosure (Phase 1B). */
export function PlatformProgramCard({
  name,
  description,
  certificationLabel,
  version,
  lastValidated,
  openFindings,
  healthStatus,
  healthSummary,
  readinessSummary,
  primaryAction,
  secondaryActions = [],
  operatorLinks = [],
  engineerLinks = [],
}: PlatformProgramCardProps) {
  const [showOperator, setShowOperator] = useState(false);
  const [showEngineer, setShowEngineer] = useState(false);

  const findingCount = openFindings.length;

  return (
    <Card className="p-v-5 flex flex-col h-full border border-v-border bg-v-surface">
      {/* Executive layer — always visible */}
      <div className="space-y-v-3 flex-1">
        <div className="flex items-start justify-between gap-v-2">
          <div>
            <h2 className="text-lg font-semibold text-v-text-primary">{name}</h2>
            <p className="text-sm text-v-text-secondary mt-v-1">{description}</p>
          </div>
          <Badge color={healthBadgeColor(healthStatus)} size="sm">
            {healthLabel(healthStatus)}
          </Badge>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-v-2 text-sm">
          <div>
            <dt className="text-v-text-muted">Certification</dt>
            <dd className="text-v-text-primary font-medium">{certificationLabel}</dd>
          </div>
          <div>
            <dt className="text-v-text-muted">Version</dt>
            <dd className="text-v-text-primary">{version}</dd>
          </div>
          <div>
            <dt className="text-v-text-muted">Last validation</dt>
            <dd className="text-v-text-primary">{lastValidated}</dd>
          </div>
          <div>
            <dt className="text-v-text-muted">Open findings</dt>
            <dd className="text-v-text-primary">
              {findingCount === 0 ? 'None' : `${findingCount} advisory`}
            </dd>
          </div>
        </dl>

        {healthSummary ? (
          <p className="text-sm text-v-text-secondary">
            <span className="font-medium text-v-text-primary">Operational signal: </span>
            {healthSummary}
          </p>
        ) : null}

        {readinessSummary ? (
          <p className="text-sm text-v-text-secondary">
            <span className="font-medium text-v-text-primary">Readiness: </span>
            {readinessSummary}
          </p>
        ) : null}

        {findingCount > 0 ? (
          <ul className="text-xs text-v-text-muted list-disc list-inside space-y-0.5">
            {openFindings.slice(0, 2).map((f) => (
              <li key={f}>{f}</li>
            ))}
            {findingCount > 2 ? <li>+{findingCount - 2} more</li> : null}
          </ul>
        ) : null}

        <div className="flex flex-wrap items-center gap-v-3 pt-v-2">
          <ActionLink href={primaryAction.href} label={primaryAction.label} variant="primary" />
          {secondaryActions.map((action) => (
            <ActionLink key={action.href} href={action.href} label={action.label} variant="secondary" />
          ))}
        </div>
      </div>

      {/* Operator layer — expandable */}
      {(operatorLinks.length > 0 || findingCount > 0) && (
        <div className="mt-v-4 pt-v-3 border-t border-v-border">
          <button
            type="button"
            onClick={() => setShowOperator((v) => !v)}
            className="flex items-center gap-v-1 text-sm font-medium text-v-text-secondary hover:text-v-text-primary w-full"
            aria-expanded={showOperator}
          >
            {showOperator ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            Operator details
          </button>
          {showOperator ? (
            <ul className="mt-v-2 space-y-v-2 text-sm">
              {operatorLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                    {link.label}
                  </Link>
                  {link.description ? (
                    <span className="block text-xs text-v-text-muted">{link.description}</span>
                  ) : null}
                </li>
              ))}
              {findingCount > 0 ? (
                <li className="text-v-text-muted text-xs pt-v-1">
                  Probes and certification checklists run on Marketplace submission detail.
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      )}

      {/* Engineer layer — expandable */}
      {engineerLinks.length > 0 && (
        <div className="mt-v-2">
          <button
            type="button"
            onClick={() => setShowEngineer((v) => !v)}
            className="flex items-center gap-v-1 text-sm font-medium text-v-text-muted hover:text-v-text-secondary w-full"
            aria-expanded={showEngineer}
          >
            {showEngineer ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            Technical details
          </button>
          {showEngineer ? (
            <ul className="mt-v-2 space-y-v-2 text-sm">
              {engineerLinks.map((link) => (
                <li key={link.href}>
                  {isExternalHref(link.href) ? (
                    <a
                      href={link.href}
                      className="text-v-text-secondary hover:text-v-text-primary inline-flex items-center gap-1"
                    >
                      {link.label}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <Link href={link.href} className="text-v-text-secondary hover:text-v-text-primary">
                      {link.label}
                    </Link>
                  )}
                  {link.description ? (
                    <span className="block text-xs text-v-text-muted">{link.description}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </Card>
  );
}
