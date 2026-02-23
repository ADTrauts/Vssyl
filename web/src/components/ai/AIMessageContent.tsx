'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

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

const defaultTextColor = 'text-gray-800';

/**
 * Renders AI response text with proper paragraph breaks and line breaks.
 * - When allowMarkdown is true: full markdown rendering (OpenAI/Anthropic plain-text that includes markdown).
 * - Otherwise: double newlines (\n\n) become separate paragraphs; single newlines preserved (whitespace-pre-wrap).
 */
export default function AIMessageContent({
  content,
  className = '',
  textColor = defaultTextColor,
  allowMarkdown = false,
}: AIMessageContentProps) {
  if (!content || typeof content !== 'string') {
    return null;
  }

  const trimmed = content.trim();
  if (!trimmed) return null;

  if (allowMarkdown) {
    const markdownComponents = {
      p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
        <p className={`text-sm whitespace-pre-wrap ${textColor}`.trim()} {...props}>
          {children}
        </p>
      ),
      strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
        <strong className="font-semibold text-gray-900" {...props}>{children}</strong>
      ),
      a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a href={href} className="text-purple-600 underline hover:text-purple-700" target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined} {...props}>
          {children}
        </a>
      ),
      ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 my-2" {...props}>{children}</ul>
      ),
      ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 my-2" {...props}>{children}</ol>
      ),
      li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
        <li className="pl-1" {...props}>{children}</li>
      ),
      code: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
        <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
      ),
    };
    return (
      <div className={`text-sm ${textColor} ${className}`.trim()}>
        <ReactMarkdown components={markdownComponents}>{trimmed}</ReactMarkdown>
      </div>
    );
  }

  // Plain text: paragraph breaks only
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
