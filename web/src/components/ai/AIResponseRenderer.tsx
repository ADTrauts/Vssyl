'use client';

import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, List, ListOrdered, MessageCircle, Zap, Table2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from 'shared/components';

export type StructuredResponseType = 'summary' | 'answer' | 'list' | 'steps' | 'actionable' | 'table';

export interface StructuredAIResponseSection {
  heading: string;
  content: string;
  /** Optional: emoji or icon name for section */
  icon?: string;
}

export interface StructuredAITableData {
  columns: string[];
  rows: string[][];
}

export interface StructuredAIActionButton {
  label: string;
  action?: string;
  fileId?: string;
  href?: string;
}

export interface StructuredAIResponse {
  type: StructuredResponseType;
  title?: string;
  sections: StructuredAIResponseSection[];
  actions?: StructuredAIActionButton[];
  table?: StructuredAITableData;
}

export interface AIResponseRendererProps {
  /** Structured response from API (when present, use this instead of raw content) */
  structured: StructuredAIResponse;
  /** Optional confidence 0–1 for display */
  confidence?: number;
  className?: string;
  /** Text color for body (default: text-gray-700 per readability standards) */
  textColor?: string;
  /** Callback when user clicks an action button */
  onAction?: (action: StructuredAIActionButton) => void;
  /** When true (default), render section content as Markdown so **bold**, links, etc. display correctly */
  allowMarkdown?: boolean;
  /** When true, section content is collapsible via the heading */
  collapsibleSections?: boolean;
}

/**
 * Renders structured AI responses with clear typography: title, sections, and action buttons.
 * Use when the API returns data.structured; otherwise fall back to AIMessageContent with content string.
 */
const TYPE_ICONS: Record<StructuredResponseType, React.ComponentType<{ className?: string; size?: number }>> = {
  summary: FileText as React.ComponentType<{ className?: string; size?: number }>,
  answer: MessageCircle as React.ComponentType<{ className?: string; size?: number }>,
  list: List as React.ComponentType<{ className?: string; size?: number }>,
  steps: ListOrdered as React.ComponentType<{ className?: string; size?: number }>,
  actionable: Zap as React.ComponentType<{ className?: string; size?: number }>,
  table: Table2 as React.ComponentType<{ className?: string; size?: number }>,
};

export default function AIResponseRenderer({
  structured,
  confidence,
  className = '',
  textColor = 'text-gray-700',
  onAction,
  allowMarkdown = true,
  collapsibleSections = false,
}: AIResponseRendererProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(() => new Set(structured.sections?.map((_, i) => i) ?? []));
  const toggleSection = useCallback((index: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const hasSections = Array.isArray(structured.sections) && structured.sections.length > 0;
  const hasTable = structured.type === 'table' && structured.table?.columns?.length && structured.table?.rows?.length;
  const hasActions = Array.isArray(structured.actions) && structured.actions.length > 0;
  const useOrderedList = structured.type === 'steps';
  const useUnorderedList = structured.type === 'list';
  const TypeIcon = TYPE_ICONS[structured.type] ?? FileText;

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

  const renderSectionContent = (content: string) => {
    const trimmed = content?.trim() || '';
    if (!trimmed) return null;
    const lines = trimmed.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (useOrderedList && lines.length > 1) {
      return (
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
          {lines.map((line, i) => (
            <li key={i} className="pl-1">{line}</li>
          ))}
        </ol>
      );
    }
    if (useUnorderedList && lines.length > 1) {
      return (
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          {lines.map((line, i) => (
            <li key={i} className="pl-1">{line}</li>
          ))}
        </ul>
      );
    }
    if (allowMarkdown) {
      return (
        <div className={`text-sm ${textColor}`.trim()}>
          <ReactMarkdown components={markdownComponents}>{trimmed}</ReactMarkdown>
        </div>
      );
    }
    return (
      <p className={`text-sm whitespace-pre-wrap ${textColor}`.trim()}>
        {trimmed}
      </p>
    );
  };

  return (
    <div
      className={`max-w-2xl space-y-4 leading-relaxed ${className}`.trim()}
      data-response-type={structured.type}
    >
      {structured.title?.trim() && (
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TypeIcon className="text-purple-600 flex-shrink-0" size={20} />
          {structured.title.trim()}
        </h2>
      )}

      {hasTable && structured.table ? (
        (() => {
          const { columns, rows } = structured.table;
          const colCount = columns.length;
          const normalizedRows = rows.map((row) =>
            Array.from({ length: colCount }, (_, i) => String(row[i] ?? '').trim())
          );
          return (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-900 font-medium">
                  <tr>
                    {columns.map((col, i) => (
                      <th key={i} className="px-3 py-2 border-b border-gray-200">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {normalizedRows.map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2 border-b border-gray-100">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()
      ) : null}

      {hasSections ? (
        <div className="space-y-4">
          {structured.sections.map((section, index) => {
            const isExpanded = !collapsibleSections || expandedSections.has(index);
            const hasHeading = section.heading?.trim();
            return (
              <div key={index} className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0">
                {collapsibleSections && hasHeading ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(index)}
                    className="flex items-center gap-2 w-full text-left text-sm font-medium text-gray-900 hover:bg-gray-50 rounded px-1 py-0.5 -mx-1"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                    {section.icon ? <span className="text-base" aria-hidden>{section.icon}</span> : null}
                    {section.heading.trim()}
                  </button>
                ) : hasHeading ? (
                  <h3 className="text-sm font-medium text-gray-900 mb-1 flex items-center gap-2">
                    {section.icon ? <span className="text-base" aria-hidden>{section.icon}</span> : null}
                    {section.heading.trim()}
                  </h3>
                ) : section.icon ? (
                  <span className="text-base mr-1" aria-hidden>{section.icon}</span>
                ) : null}
                {(!collapsibleSections || isExpanded) && renderSectionContent(section.content)}
              </div>
            );
          })}
        </div>
      ) : null}

      {hasActions ? (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {structured.actions!.map((action, index) => (
            <Button
              key={index}
              variant="secondary"
              size="sm"
              onClick={() => onAction?.(action)}
              className="text-sm"
            >
              {action.label?.trim() || 'Action'}
            </Button>
          ))}
        </div>
      ) : null}

      {confidence !== undefined && confidence < 1 ? (
        <p className="text-xs text-gray-600 mt-2">
          Confidence: {Math.round(confidence * 100)}%
        </p>
      ) : null}
    </div>
  );
}
