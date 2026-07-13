'use client';

import { Card } from 'shared/components';

interface MetricItem {
  id: string;
  name: string;
  value: number | null;
  unit: string;
}

export function OperationsMetricGrid({ metrics }: { metrics: MetricItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-v-4">
      {metrics.map((m) => (
        <Card key={m.id} className="p-v-4">
          <p className="text-xs text-v-text-muted uppercase tracking-wide">{m.name}</p>
          <p className="text-2xl font-bold text-v-text-primary mt-v-1">
            {m.value === null
              ? '—'
              : m.unit === 'ratio'
                ? `${(m.value * 100).toFixed(1)}%`
                : m.unit === 'milliseconds'
                  ? `${Math.round(m.value)}ms`
                  : m.value.toFixed(2)}
          </p>
          <p className="text-xs text-v-text-secondary mt-v-1">{m.id}</p>
        </Card>
      ))}
    </div>
  );
}
