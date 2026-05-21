'use client';

import React from 'react';
import { Badge } from 'shared/components';
import type { RegistryGraph } from '../../../../types/adminAiPipeline';

export default function PipelineRegistryDependencyChips({
  graph,
  entityId,
}: {
  graph: RegistryGraph | null;
  entityId: string;
}) {
  if (!graph) return null;
  const related = graph.edges.filter((e) => e.from === entityId || e.to === entityId);
  if (related.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {related.slice(0, 6).map((edge) => {
        const other = edge.from === entityId ? edge.to : edge.from;
        return (
          <Badge key={`${edge.kind}-${other}`} className="bg-slate-100 text-slate-700 text-xs">
            {edge.kind}: {other}
          </Badge>
        );
      })}
      {related.length > 6 && (
        <Badge className="bg-slate-100 text-slate-600 text-xs">+{related.length - 6}</Badge>
      )}
    </div>
  );
}
