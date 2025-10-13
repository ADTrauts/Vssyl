'use client';

import React from 'react';
import ChatContent from '../../app/chat/ChatContent';

interface ChatModuleProps {
  businessId?: string;
  className?: string;
  refreshTrigger?: number;
}

/**
 * Standard Chat Module - Personal and basic business chat
 * 
 * This is the full-featured chat system with:
 * - Three-panel layout (Conversations, Messages, Details)
 * - Real-time messaging with WebSocket
 * - File sharing and attachments
 * - Thread support
 * - Reactions and read receipts
 * - Search and discovery
 */
export default function ChatModule({ 
  businessId,
  className = '',
  refreshTrigger 
}: ChatModuleProps) {
  
  return (
    <div className={`h-full ${className}`}>
      {/* Use the existing full-featured ChatContent component */}
      <ChatContent />
    </div>
  );
}

