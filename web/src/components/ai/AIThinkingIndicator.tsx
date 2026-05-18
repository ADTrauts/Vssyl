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
  /** Compact layout for inline bubble use */
  variant?: 'default' | 'bubble';
}

/**
 * Animated "thinking" / typing indicator shown while the AI is generating a response.
 */
export default function AIThinkingIndicator({
  message = 'Thinking...',
  iconSize = 20,
  className = '',
  variant = 'default',
}: AIThinkingIndicatorProps) {
  const label = message.replace(/\.+$/, '');

  return (
    <div
      className={`flex items-center gap-3 ${variant === 'bubble' ? 'min-h-[1.25rem]' : ''} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <Bot
        className={`text-purple-600 flex-shrink-0 ${variant === 'bubble' ? 'animate-pulse' : ''}`}
        size={iconSize}
      />
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
        <span className="flex gap-0.5 items-center h-4" aria-hidden>
          <span
            className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"
            style={{ animationDelay: '0ms', animationDuration: '1.1s' }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"
            style={{ animationDelay: '180ms', animationDuration: '1.1s' }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"
            style={{ animationDelay: '360ms', animationDuration: '1.1s' }}
          />
        </span>
      </div>
    </div>
  );
}
