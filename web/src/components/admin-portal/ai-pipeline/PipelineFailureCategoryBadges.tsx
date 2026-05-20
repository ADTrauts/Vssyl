'use client';

import React from 'react';
import { Badge } from 'shared/components';
import type { PipelineFailureCategory } from '../../../types/adminAiPipeline';

const LABELS: Record<PipelineFailureCategory, string> = {
  GROUNDING_FAILURE: 'Grounding failure',
  RETRIEVAL_FAILURE: 'Retrieval failure',
  TOOL_SELECTION_FAILURE: 'Tool selection failure',
  GENERIC_RESPONSE: 'Generic response',
  LOW_CONFIDENCE_RESPONSE: 'Low confidence',
  MISSING_CONTEXT: 'Missing context',
  POLICY_MISMATCH: 'Policy mismatch',
};

const STYLES: Record<PipelineFailureCategory, string> = {
  GROUNDING_FAILURE: 'bg-red-100 text-red-800',
  RETRIEVAL_FAILURE: 'bg-orange-100 text-orange-900',
  TOOL_SELECTION_FAILURE: 'bg-amber-100 text-amber-900',
  GENERIC_RESPONSE: 'bg-yellow-100 text-yellow-900',
  LOW_CONFIDENCE_RESPONSE: 'bg-purple-100 text-purple-900',
  MISSING_CONTEXT: 'bg-slate-100 text-slate-800',
  POLICY_MISMATCH: 'bg-indigo-100 text-indigo-800',
};

export default function PipelineFailureCategoryBadges({
  categories,
}: {
  categories: PipelineFailureCategory[];
}) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {categories.map((cat) => (
        <Badge key={cat} className={STYLES[cat]}>
          {LABELS[cat]}
        </Badge>
      ))}
    </div>
  );
}
