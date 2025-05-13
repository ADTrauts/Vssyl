'use client';

import React from 'react';
import { Panel } from '../../core/Panel';
import { PanelHeader } from '../../shared/PanelHeader';
import { PANEL_SIZES } from '../../core/types';
import { MessageSquare } from 'lucide-react';

interface Thread {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ThreadPanelProps {
  threads: Thread[];
  activeThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
}

export const ThreadPanel: React.FC<ThreadPanelProps> = ({
  threads,
  activeThreadId,
  onThreadSelect,
}) => {
  return (
    <Panel
      id="threads"
      position="right"
      defaultWidth={PANEL_SIZES.md}
      minWidth={PANEL_SIZES.sm}
      maxWidth={PANEL_SIZES.lg}
      className="border-l"
    >
      <div className="flex h-full flex-col">
        <PanelHeader
          title="Threads"
          icon={<MessageSquare className="h-4 w-4" />}
          showMoreMenu
          onMoreClick={() => console.log('More options clicked')}
        />
        <div className="flex-1 overflow-y-auto">
          {threads.map(thread => (
            <div
              key={thread.id}
              className={`p-4 cursor-pointer hover:bg-muted/50 ${
                thread.id === activeThreadId ? 'bg-muted' : ''
              }`}
              onClick={() => onThreadSelect(thread.id)}
            >
              <h4 className="font-medium">{thread.title}</h4>
              <p className="text-sm text-muted-foreground">
                {new Date(thread.updatedAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}; 