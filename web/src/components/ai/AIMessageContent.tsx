'use client';

import React from 'react';

export interface AIMessageContentProps {
  /** Raw AI response text (may contain newlines; double newlines become paragraph breaks) */
  content: string;
  /** Base text size - applied to paragraphs */
  className?: string;
  /** Text color class (default: text-gray-800 for light backgrounds) */
  textColor?: string;
}

/**
 * Renders AI response text with proper paragraph breaks and line breaks.
 * - Double newlines (\n\n) become separate paragraphs with spacing.
 * - Single newlines within a paragraph are preserved (whitespace-pre-wrap).
 * This is display-only and does not depend on the model provider (Anthropic vs OpenAI).
 */
export default function AIMessageContent({
  content,
  className = '',
  textColor = 'text-gray-800',
}: AIMessageContentProps) {
  if (!content || typeof content !== 'string') {
    return null;
  }

  const trimmed = content.trim();
  if (!trimmed) return null;

  // Split on double (or more) newlines for paragraph breaks
  const paragraphs = trimmed.split(/\n\n+/).filter((p) => p.trim().length > 0);

  if (paragraphs.length === 0) return null;
  if (paragraphs.length === 1) {
    return (
      <p className={`text-sm whitespace-pre-wrap ${textColor} ${className}`.trim()}>
        {paragraphs[0].trim()}
      </p>
    );
  }

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {paragraphs.map((para, i) => (
        <p
          key={i}
          className={`text-sm whitespace-pre-wrap ${textColor} last:mb-0`.trim()}
        >
          {para.trim()}
        </p>
      ))}
    </div>
  );
}
