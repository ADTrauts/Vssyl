'use client';

import React from 'react';
import { Bot } from 'lucide-react';

export interface AIThinkingIndicatorProps {
  /** Optional short message (e.g. "Thinking...", "Generating...") */
  message?: string;
  /** Size of the icon */
  iconSize?: number;
  /** Additional class for the container */
  className?: string;
}

/**
 * Animated "thinking" / typing indicator shown while the AI is generating a response.
 * Shows a bot icon and bouncing dots so the user sees progress instead of a blank wait.
 */
export default function AIThinkingIndicator({
  message = 'Thinking...',
  iconSize = 20,
  className = '',
}: AIThinkingIndicatorProps) {
  return (
    <div
      className={`flex items-center gap-3 ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <Bot className="text-purple-600 flex-shrink-0" size={iconSize} />
      <div className="flex items-center gap-1">
        <span className="text-sm text-gray-600 dark:text-gray-400">{message.replace(/\.+$/, '')}</span>
        <span className="flex gap-0.5" aria-hidden>
          <span
            className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"
            style={{ animationDelay: '0ms', animationDuration: '1.2s' }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"
            style={{ animationDelay: '200ms', animationDuration: '1.2s' }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"
            style={{ animationDelay: '400ms', animationDuration: '1.2s' }}
          />
        </span>
      </div>
    </div>
  );
}
