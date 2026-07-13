'use client';

import type { AIExecutionTimelineEvent } from 'shared/types';

interface ExecutionTimelinePanelProps {
  events: AIExecutionTimelineEvent[];
}

export function ExecutionTimelinePanel({ events }: ExecutionTimelinePanelProps) {
  if (events.length === 0) {
    return <p className="text-sm text-v-text-muted">No timeline events recorded.</p>;
  }
  return (
    <ol className="relative border-l border-v-border ml-v-2 space-y-v-4">
      {events.map((event, i) => (
        <li key={`${event.stage}-${event.at}-${i}`} className="ml-v-4">
          <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-v-accent border border-white" />
          <div className="text-xs text-v-text-muted">{new Date(event.at).toLocaleString()}</div>
          <div className="font-medium text-v-text-primary">{event.stage.replace(/_/g, ' ')}</div>
          {event.label ? <div className="text-sm text-v-text-secondary">{event.label}</div> : null}
          {event.detail && Object.keys(event.detail).length > 0 ? (
            <pre className="text-xs mt-v-1 p-v-2 bg-v-surface-secondary rounded overflow-x-auto max-h-32">
              {JSON.stringify(event.detail, null, 2)}
            </pre>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
