'use client';

import React from 'react';
import { Panel } from '../../core/Panel';
import { PanelHeader } from '../../shared/PanelHeader';
import { ConversationList } from '@/components/chat/ConversationList';
import { PANEL_SIZES } from '../../core/types';
import { MessageCircle } from 'lucide-react';

export const ConversationPanel: React.FC = () => {
  const handleMoreClick = () => {
    // TODO: Implement more options menu
    console.log('More options clicked');
  };

  return (
    <Panel
      id="conversations"
      position="left"
      defaultWidth={PANEL_SIZES.md}
      minWidth={PANEL_SIZES.sm}
      maxWidth={PANEL_SIZES.lg}
      className="border-r"
    >
      <div className="flex h-full flex-col">
        <PanelHeader
          title="Conversations"
          icon={<MessageCircle className="h-4 w-4" />}
          showMoreMenu
          onMoreClick={handleMoreClick}
        />
        <div className="flex-1 overflow-y-auto">
          <ConversationList />
        </div>
      </div>
    </Panel>
  );
}; 