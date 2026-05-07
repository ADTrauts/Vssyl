'use client';

import React, { useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  FileText,
  List,
  ListOrdered,
  MessageCircle,
  Zap,
  Table2,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Link2,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { Button } from 'shared/components';

export type StructuredResponseType = 'summary' | 'answer' | 'list' | 'steps' | 'actionable' | 'table' | string;

export interface StructuredAIResponseSection {
  /** Legacy */
  heading?: string;
  /** v2 */
  title?: string;
  content: string;
  /** Optional: emoji or icon name for section */
  icon?: string;
  /** v2 */
  bullets?: string[];
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

/** v2 + legacy fields (API may send both). */
export interface StructuredAIResponse {
  /** Legacy primary discriminator */
  type?: StructuredResponseType;
  title?: string;
  sections?: StructuredAIResponseSection[];
  actions?: StructuredAIActionButton[];
  table?: StructuredAITableData;
  /** v2 */
  mode?: string;
  summary?: string;
  keyInsights?: string[];
  evidence?: Array<{
    label: string;
    sourceType?: string;
    sourceId?: string;
    detail?: string;
  }>;
  assumptions?: string[];
  risks?: string[];
  recommendedActions?: Array<{
    title: string;
    description?: string;
    priority?: string;
    actionType?: string;
    targetModule?: string;
  }>;
  confidence?: {
    level: string;
    explanation?: string;
  };
  style?: {
    tone?: string;
    format?: string;
  };
  metadata?: {
    usedModules?: string[];
    usedFiles?: string[];
    generatedAt?: string;
    responseVersion?: string;
  };
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

function isV2Structured(s: StructuredAIResponse): boolean {
  if (typeof s.mode === 'string' && s.mode.length > 0) return true;
  if (s.metadata?.responseVersion === 'v2') return true;
  if (typeof s.summary === 'string' && s.summary.length > 0 && !s.type) return true;
  return false;
}

/**
 * Renders structured AI responses with clear typography: title, sections, and action buttons.
 * Supports v2 fields (summary, keyInsights, evidence, …) and legacy (type, sections, table, actions).
 */
const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
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
  const isV2 = useMemo(() => isV2Structured(structured), [structured]);

  const legacyType = (structured.type ?? 'answer') as StructuredResponseType;
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    () => new Set(structured.sections?.map((_, i) => i) ?? [])
  );
  const toggleSection = useCallback((index: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const sections = structured.sections ?? [];
  const hasSections = sections.length > 0;
  const hasTable = structured.type === 'table' && structured.table?.columns?.length && structured.table?.rows?.length;
  const hasActions = Array.isArray(structured.actions) && structured.actions.length > 0;
  const useOrderedList = structured.type === 'steps';
  const useUnorderedList = structured.type === 'list';
  const TypeIcon = TYPE_ICONS[legacyType] ?? FileText;

  const markdownComponents = {
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className={`text-sm whitespace-pre-wrap ${textColor}`.trim()} {...props}>
        {children}
      </p>
    ),
    strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props}>{children}</strong>
    ),
    a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a href={href} className="text-purple-600 underline hover:text-purple-700" target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined} {...props}>
        {children}
      </a>
    ),
    ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 my-2" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 my-2" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
      <li className="pl-1" {...props}>{children}</li>
    ),
    code: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <code className="bg-gray-100 dark:bg-slate-700 text-gray-800 px-1 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
    ),
  };

  const renderSectionContent = (content: string) => {
    const trimmed = content?.trim() || '';
    if (!trimmed) return null;
    const lines = trimmed.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (useOrderedList && lines.length > 1) {
      return (
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
          {lines.map((line, i) => (
            <li key={i} className="pl-1">{line}</li>
          ))}
        </ol>
      );
    }
    if (useUnorderedList && lines.length > 1) {
      return (
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
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

  const sectionHeading = (section: StructuredAIResponseSection) =>
    (section.title ?? section.heading ?? '').trim();

  const renderV2 = () => {
    const keyInsights = structured.keyInsights?.filter((x) => typeof x === 'string' && x.trim()) ?? [];
    const evidence = structured.evidence?.filter((e) => e?.label?.trim()) ?? [];
    const assumptions = structured.assumptions?.filter((x) => typeof x === 'string' && x.trim()) ?? [];
    const risks = structured.risks?.filter((x) => typeof x === 'string' && x.trim()) ?? [];
    const recActions = structured.recommendedActions?.filter((a) => a?.title?.trim()) ?? [];
    const watchoutCount = assumptions.length + risks.length;

    return (
      <div className="space-y-4" data-structured-version="v2">
        {structured.mode ? (
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {structured.mode.replace(/_/g, ' ')}
          </p>
        ) : null}

        {structured.summary?.trim() ? (
          <div className={`text-sm ${textColor}`.trim()}>
            {allowMarkdown ? (
              <ReactMarkdown components={markdownComponents}>{structured.summary.trim()}</ReactMarkdown>
            ) : (
              <p className="whitespace-pre-wrap">{structured.summary.trim()}</p>
            )}
          </div>
        ) : null}

        {keyInsights.length > 0 ? (
          <div className="rounded-lg border border-amber-100 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1.5">
              <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
              Key insights
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-800 dark:text-gray-200">
              {keyInsights.map((line, i) => (
                <li key={i} className="pl-0.5">{line.trim()}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {evidence.length > 0 ? (
          <div className="rounded-md border border-gray-200 dark:border-slate-600 bg-gray-50/80 dark:bg-slate-800/50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
              <Link2 className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
              Based on
            </div>
            <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              {evidence.map((e, i) => (
                <li key={i} className="flex flex-col gap-0.5">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{e.label}</span>
                  {e.sourceType || e.sourceId ? (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {[e.sourceType, e.sourceId].filter(Boolean).join(' · ')}
                    </span>
                  ) : null}
                  {e.detail?.trim() ? (
                    <span className="text-xs text-gray-600 dark:text-gray-400">{e.detail.trim()}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {watchoutCount > 0 ? (
          <div className="rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900/40 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              Context / watchouts
            </div>
            {assumptions.length > 0 ? (
              <div className="mb-2 last:mb-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assumptions</p>
                <ul className="list-disc list-inside space-y-0.5 text-sm text-gray-700 dark:text-gray-300">
                  {assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {risks.length > 0 ? (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Risks</p>
                <ul className="list-disc list-inside space-y-0.5 text-sm text-gray-700 dark:text-gray-300">
                  {risks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {hasSections ? (
          <div className="space-y-4">
            {sections.map((section, index) => {
              const isExpanded = !collapsibleSections || expandedSections.has(index);
              const heading = sectionHeading(section);
              return (
                <div key={index} className="border-b border-gray-100 dark:border-slate-700 last:border-b-0 pb-3 last:pb-0">
                  {collapsibleSections && heading ? (
                    <button
                      type="button"
                      onClick={() => toggleSection(index)}
                      className="flex items-center gap-2 w-full text-left text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-800 rounded px-1 py-0.5 -mx-1"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                      {section.icon ? <span className="text-base" aria-hidden>{section.icon}</span> : null}
                      {heading}
                    </button>
                  ) : heading ? (
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                      {section.icon ? <span className="text-base" aria-hidden>{section.icon}</span> : null}
                      {heading}
                    </h3>
                  ) : section.icon ? (
                    <span className="text-base mr-1" aria-hidden>{section.icon}</span>
                  ) : null}
                  {(!collapsibleSections || isExpanded) && (
                    <>
                      {renderSectionContent(section.content)}
                      {section.bullets && section.bullets.length > 0 ? (
                        <ul className="mt-2 list-disc list-inside space-y-0.5 text-sm text-gray-700 dark:text-gray-300">
                          {section.bullets.map((b, bi) => (
                            <li key={bi}>{b}</li>
                          ))}
                        </ul>
                      ) : null}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {recActions.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Recommended actions</p>
            <ul className="space-y-2">
              {recActions.map((a, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-purple-100 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/25 px-3 py-2 text-sm"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">{a.title.trim()}</div>
                  {a.description?.trim() ? (
                    <p className="mt-1 text-gray-700 dark:text-gray-300 text-sm">{a.description.trim()}</p>
                  ) : null}
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                    {a.priority ? <span className="rounded bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5">{a.priority}</span> : null}
                    {a.actionType ? <span className="rounded bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5">{a.actionType}</span> : null}
                    {a.targetModule ? <span>→ {a.targetModule}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {structured.confidence?.level ? (
          <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-80" aria-hidden />
            <div>
              <span className="capitalize">{structured.confidence.level}</span>
              {structured.confidence.explanation?.trim() ? (
                <span className="block mt-0.5 text-gray-500 dark:text-gray-500 leading-snug">
                  {structured.confidence.explanation.trim()}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderLegacyTableAndActions = () => (
    <>
      {hasTable && structured.table ? (
        (() => {
          const { columns, rows } = structured.table!;
          const colCount = columns.length;
          const normalizedRows = rows.map((row) =>
            Array.from({ length: colCount }, (_, i) => String(row[i] ?? '').trim())
          );
          return (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 font-medium">
                  <tr>
                    {columns.map((col, i) => (
                      <th key={i} className="px-3 py-2 border-b border-gray-200 dark:border-slate-700">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-300">
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
      {hasActions ? (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
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
    </>
  );

  const renderLegacyFull = () => (
    <>
      {structured.title?.trim() && (
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
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
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 font-medium">
                  <tr>
                    {columns.map((col, i) => (
                      <th key={i} className="px-3 py-2 border-b border-gray-200 dark:border-slate-700">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-300">
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
          {sections.map((section, index) => {
            const isExpanded = !collapsibleSections || expandedSections.has(index);
            const hasHeading = sectionHeading(section);
            return (
              <div key={index} className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0">
                {collapsibleSections && hasHeading ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(index)}
                    className="flex items-center gap-2 w-full text-left text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 rounded px-1 py-0.5 -mx-1"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                    {section.icon ? <span className="text-base" aria-hidden>{section.icon}</span> : null}
                    {hasHeading}
                  </button>
                ) : hasHeading ? (
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                    {section.icon ? <span className="text-base" aria-hidden>{section.icon}</span> : null}
                    {hasHeading}
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
    </>
  );

  const showNumericConfidence =
    confidence !== undefined &&
    confidence < 1 &&
    !(isV2 && structured.confidence?.level);

  return (
    <div
      className={`max-w-2xl space-y-4 leading-relaxed ${className}`.trim()}
      data-response-type={legacyType}
      data-structured-v2={isV2 ? 'true' : undefined}
    >
      {isV2 ? (
        <>
          {renderV2()}
          {renderLegacyTableAndActions()}
        </>
      ) : (
        renderLegacyFull()
      )}

      {showNumericConfidence ? (
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          Confidence: {Math.round(confidence * 100)}%
        </p>
      ) : null}
    </div>
  );
}
