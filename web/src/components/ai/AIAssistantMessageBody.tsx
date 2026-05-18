'use client';

import React from 'react';
import AIMessageContent from './AIMessageContent';
import AIResponseRenderer, {
  type StructuredAIResponse,
  type StructuredAIActionButton,
} from './AIResponseRenderer';
import { resolveAIDisplayFields } from '../../lib/aiResponseHandler';

export interface AIAssistantMessageBodyProps {
  content: string;
  structured?: StructuredAIResponse;
  confidence?: number;
  textColor?: string;
  allowMarkdown?: boolean;
  collapsibleSections?: boolean;
  showOrchestrationDetails?: boolean;
  onAction?: (action: StructuredAIActionButton) => void;
}

/**
 * Renders assistant message prose (structured summary or markdown) — never raw v2 JSON.
 */
export default function AIAssistantMessageBody({
  content,
  structured,
  confidence,
  textColor = 'text-gray-800 dark:text-gray-100',
  allowMarkdown = true,
  collapsibleSections,
  showOrchestrationDetails = false,
  onAction,
}: AIAssistantMessageBodyProps) {
  const display = resolveAIDisplayFields({ content, structured });

  if (display.structured) {
    return (
      <AIResponseRenderer
        structured={display.structured}
        confidence={confidence}
        textColor={textColor}
        allowMarkdown={allowMarkdown}
        collapsibleSections={collapsibleSections}
        showOrchestrationDetails={showOrchestrationDetails}
        onAction={onAction}
      />
    );
  }

  return (
    <AIMessageContent
      content={display.content}
      textColor={textColor}
      allowMarkdown={allowMarkdown}
    />
  );
}
