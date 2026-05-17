'use client';

import React from 'react';
import { Badge } from 'shared/components';
import { AlertTriangle, CheckCircle, XCircle, ClipboardList } from 'lucide-react';

export interface ModuleCertificationChecklistItem {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  message?: string;
}

export interface ModuleCertificationShape {
  status: 'not_run' | 'passed' | 'warning' | 'failed';
  errors: string[];
  warnings: string[];
  checklist: ModuleCertificationChecklistItem[];
  validatedAt: string | null;
  validatorVersion: string | null;
}

function statusBadge(status: ModuleCertificationShape['status']) {
  switch (status) {
    case 'passed':
      return (
        <Badge color="green" size="sm">
          <CheckCircle className="w-3 h-3 mr-1 inline" />
          Certification passed
        </Badge>
      );
    case 'warning':
      return (
        <Badge color="yellow" size="sm">
          <AlertTriangle className="w-3 h-3 mr-1 inline" />
          Certification warnings
        </Badge>
      );
    case 'failed':
      return (
        <Badge color="red" size="sm">
          <XCircle className="w-3 h-3 mr-1 inline" />
          Certification failed
        </Badge>
      );
    default:
      return (
        <Badge color="gray" size="sm">
          Certification not run
        </Badge>
      );
  }
}

function checklistStatusClass(status: ModuleCertificationChecklistItem['status']): string {
  switch (status) {
    case 'pass':
      return 'text-green-700 dark:text-green-300';
    case 'fail':
      return 'text-red-700 dark:text-red-300';
    case 'warn':
      return 'text-yellow-700 dark:text-yellow-300';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

export function ModuleCertificationReviewPanel({
  certification,
  compact = false,
}: {
  certification: ModuleCertificationShape;
  compact?: boolean;
}) {
  const validatedLabel = certification.validatedAt
    ? new Date(certification.validatedAt).toLocaleString()
    : 'Not validated yet';

  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 p-3">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1">
          <ClipboardList className="w-3.5 h-3.5" />
          Structural certification
        </span>
        {statusBadge(certification.status)}
        {!compact && certification.validatorVersion && (
          <span className="text-xs text-gray-500 dark:text-gray-400">v{certification.validatorVersion}</span>
        )}
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
        Validated: {validatedLabel}. Warnings do not block approval but should be reviewed before publish.
      </p>

      {certification.errors.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Hard errors (block approval)</p>
          <ul className="list-disc list-inside text-xs text-red-700 dark:text-red-300 space-y-0.5">
            {certification.errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {certification.warnings.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-1">Warnings (advisory)</p>
          <ul className="list-disc list-inside text-xs text-yellow-700 dark:text-yellow-300 space-y-0.5">
            {certification.warnings.map((warn) => (
              <li key={warn}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {!compact && certification.checklist.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Checklist</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs">
            {certification.checklist.map((item) => (
              <div key={item.id} className={checklistStatusClass(item.status)}>
                {item.status === 'pass' ? '✓' : item.status === 'fail' ? '✗' : item.status === 'warn' ? '!' : '–'}{' '}
                {item.label}
                {item.message ? ` — ${item.message}` : ''}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}