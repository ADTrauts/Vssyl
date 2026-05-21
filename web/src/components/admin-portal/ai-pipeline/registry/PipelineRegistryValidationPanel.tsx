'use client';

import React from 'react';
import { Alert } from 'shared/components';
import type { RegistryValidationResult } from '../../../../types/adminAiPipeline';

export default function PipelineRegistryValidationPanel({
  validation,
}: {
  validation: RegistryValidationResult | null;
}) {
  if (!validation) return null;
  if (validation.valid && validation.warnings.length === 0) {
    return <p className="text-sm text-green-700 dark:text-green-400">Validation passed.</p>;
  }
  return (
    <div className="space-y-2">
      {validation.errors.map((e) => (
        <Alert key={`${e.code}-${e.message}`}>{e.message}</Alert>
      ))}
      {validation.warnings.map((w) => (
        <p key={`${w.code}-${w.message}`} className="text-sm text-amber-700 dark:text-amber-400">
          {w.message}
        </p>
      ))}
    </div>
  );
}
