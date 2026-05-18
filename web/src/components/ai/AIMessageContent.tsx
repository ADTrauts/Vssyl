'use client';

import React from 'react';
import AIMarkdown from './AIMarkdown';

export interface AIMessageContentProps {
  /** Raw AI response text (may contain newlines; double newlines become paragraph breaks) */
  content: string;
  /** Base text size - applied to paragraphs */
  className?: string;
  /** Text color class (default: text-gray-800 for light backgrounds) */
  textColor?: string;
  /** When true, render content as markdown (lists, bold, links, code). Use for plain-text model output that may contain markdown. */
  allowMarkdown?: boolean;
}

const defaultTextColor = 'text-gray-800 dark:text-gray-100';

/**
 * Renders AI response text with proper paragraph breaks and line breaks.
 * - When allowMarkdown is true: full markdown rendering via AIMarkdown.
 * - Otherwise: double newlines (\n\n) become separate paragraphs; single newlines preserved (whitespace-pre-wrap).
 */
export default function AIMessageContent({
  content,
  className = '',
  textColor = defaultTextColor,
  allowMarkdown = true,
}: AIMessageContentProps) {
  if (!content || typeof content !== 'string') {
    return null;
  }

  const trimmed = content.trim();
  if (!trimmed) return null;

  if (allowMarkdown) {
    return <AIMarkdown content={trimmed} className={className} textColor={textColor} />;
  }

  const paragraphs = trimmed.split(/\n\n+/).filter((p) => p.trim().length > 0);
  if (paragraphs.length === 0) return null;
  if (paragraphs.length === 1) {
    return (
      <p className={`text-[15px] leading-7 whitespace-pre-wrap ${textColor} ${className}`.trim()}>
        {paragraphs[0].trim()}
      </p>
    );
  }
  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {paragraphs.map((para, i) => (
        <p
          key={i}
          className={`text-[15px] leading-7 whitespace-pre-wrap ${textColor} last:mb-0`.trim()}
        >
          {para.trim()}
        </p>
      ))}
    </div>
  );
}
