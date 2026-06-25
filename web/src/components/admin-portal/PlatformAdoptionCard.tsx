'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Badge, Card } from 'shared/components';
import { ChevronRight } from 'lucide-react';

export type AdoptionLevelBadge = 'A' | 'B' | 'C' | 'D' | 'E';

export interface PlatformAdoptionCardProps {
  moduleId: string;
  displayName: string;
  adoptionLevel: AdoptionLevelBadge;
  adoptionLevelLabel: string;
  score: number;
  certificationRef: string;
  lastValidated: string;
  topGap: string;
  missingCapabilities: string[];
  validationWarningCount: number;
}

function levelColor(level: AdoptionLevelBadge): 'green' | 'blue' | 'yellow' | 'gray' {
  if (level === 'A') return 'green';
  if (level === 'B') return 'blue';
  if (level === 'C') return 'yellow';
  return 'gray';
}

export function PlatformAdoptionCard({
  moduleId,
  displayName,
  adoptionLevel,
  adoptionLevelLabel,
  score,
  certificationRef,
  lastValidated,
  topGap,
  missingCapabilities,
  validationWarningCount,
}: PlatformAdoptionCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-v-4">
      <div className="flex items-start justify-between gap-v-3">
        <div className="min-w-0">
          <Link
            href={`/admin-portal/platform-adoption/${moduleId}`}
            className="text-base font-semibold text-v-text-primary hover:text-blue-600 dark:hover:text-blue-400"
          >
            {displayName}
          </Link>
          <p className="text-sm text-v-text-muted mt-v-1">{topGap}</p>
        </div>
        <div className="text-right shrink-0">
          <Badge color={levelColor(adoptionLevel)}>{adoptionLevelLabel}</Badge>
          <p className="text-sm font-medium text-v-text-secondary mt-v-1">{score}/100</p>
        </div>
      </div>

      <dl className="mt-v-3 grid grid-cols-2 gap-v-2 text-sm">
        <div>
          <dt className="text-v-text-muted">Certification</dt>
          <dd className="text-v-text-secondary">{certificationRef}</dd>
        </div>
        <div>
          <dt className="text-v-text-muted">Last validation</dt>
          <dd className="text-v-text-secondary">{lastValidated}</dd>
        </div>
      </dl>

      {validationWarningCount > 0 ? (
        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-v-2">
          {validationWarningCount} validation warning{validationWarningCount === 1 ? '' : 's'}
        </p>
      ) : null}

      <button
        type="button"
        className="mt-v-3 inline-flex items-center gap-1 text-sm text-v-text-secondary hover:text-v-text-primary"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {expanded ? 'Hide' : 'Show'} missing capabilities
        <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded ? (
        <ul className="mt-v-2 text-sm text-v-text-muted list-disc pl-v-5 space-y-v-1">
          {missingCapabilities.length === 0 ? (
            <li>No missing applicable capabilities</li>
          ) : (
            missingCapabilities.map((cap) => <li key={cap}>{cap}</li>)
          )}
        </ul>
      ) : null}
    </Card>
  );
}
