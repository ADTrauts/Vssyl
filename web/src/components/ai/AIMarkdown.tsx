'use client';

import React, { useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { StructuredAIResponse, StructuredAIResponseSection } from './AIResponseRenderer';

export const aiMarkdownProseClassName =
  'max-w-none text-[15px] leading-7 text-gray-800 dark:text-gray-100 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0';

export interface AIMarkdownProps {
  content: string;
  className?: string;
  textColor?: string;
}

function sectionHeading(section: StructuredAIResponseSection): string {
  return (section.title ?? section.heading ?? '').trim();
}

/**
 * Flatten structured AI payloads into a single markdown document for prose-first rendering.
 */
export function structuredResponseToMarkdown(structured: StructuredAIResponse): string {
  const parts: string[] = [];

  if (structured.title?.trim()) {
    parts.push(`## ${structured.title.trim()}`);
  }

  if (structured.summary?.trim()) {
    parts.push(structured.summary.trim());
  }

  const sections = structured.sections ?? [];
  for (const section of sections) {
    const heading = sectionHeading(section);
    if (heading) {
      parts.push(`### ${heading}`);
    }
    if (section.content?.trim()) {
      parts.push(section.content.trim());
    }
    if (section.bullets?.length) {
      parts.push(
        section.bullets
          .filter((b) => typeof b === 'string' && b.trim())
          .map((b) => `- ${b.trim()}`)
          .join('\n')
      );
    }
  }

  return parts.join('\n\n').trim();
}

export interface ShouldEnhanceStructuredOptions {
  showOrchestrationDetails?: boolean;
  collapsibleSections?: boolean;
}

/**
 * Enhanced UI (tables, actions, orchestration panels, collapsible report chrome)
 * only when the payload actually needs it.
 */
export function shouldEnhanceStructured(
  structured: StructuredAIResponse,
  options?: ShouldEnhanceStructuredOptions
): boolean {
  const showOrchestrationDetails = options?.showOrchestrationDetails ?? false;
  const collapsibleSections = options?.collapsibleSections ?? false;

  const hasLegacyTable =
    structured.type === 'table' &&
    Boolean(structured.table?.columns?.length) &&
    Boolean(structured.table?.rows?.length);

  const hasActions = Array.isArray(structured.actions) && structured.actions.length > 0;

  if (hasLegacyTable || hasActions) return true;

  if (showOrchestrationDetails) {
    const hasOrchestration =
      (structured.keyInsights?.some((x) => typeof x === 'string' && x.trim()) ?? false) ||
      (structured.evidence?.some((e) => e?.label?.trim()) ?? false) ||
      (structured.assumptions?.some((x) => typeof x === 'string' && x.trim()) ?? false) ||
      (structured.risks?.some((x) => typeof x === 'string' && x.trim()) ?? false) ||
      (structured.recommendedActions?.some((a) => a?.title?.trim()) ?? false) ||
      Boolean(structured.confidence?.level);
    if (hasOrchestration) return true;
  }

  const sections = structured.sections ?? [];
  const titledSectionCount = sections.filter((s) => sectionHeading(s).length > 0).length;
  if (collapsibleSections && titledSectionCount > 1) return true;

  const legacyType = structured.type ?? 'answer';
  if (
    structured.title?.trim() &&
    (legacyType === 'summary' || legacyType === 'actionable' || legacyType === 'table')
  ) {
    return true;
  }

  return false;
}

export function createAIMarkdownComponents(textColor?: string): Components {
  const bodyColor = textColor ?? 'text-gray-800 dark:text-gray-100';

  return {
    h1: ({ children, ...props }) => (
      <h1 className={`text-2xl font-semibold mt-6 mb-3 ${bodyColor}`} {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className={`text-xl font-semibold mt-5 mb-2.5 ${bodyColor}`} {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className={`text-lg font-semibold mt-4 mb-2 ${bodyColor}`} {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 className={`text-base font-semibold mt-3 mb-1.5 ${bodyColor}`} {...props}>
        {children}
      </h4>
    ),
    h5: ({ children, ...props }) => (
      <h5 className={`text-sm font-semibold mt-3 mb-1 ${bodyColor}`} {...props}>
        {children}
      </h5>
    ),
    h6: ({ children, ...props }) => (
      <h6 className={`text-sm font-medium mt-2 mb-1 ${bodyColor}`} {...props}>
        {children}
      </h6>
    ),
    p: ({ children, ...props }) => (
      <p className={`my-3 last:mb-0 ${bodyColor}`} {...props}>
        {children}
      </p>
    ),
    strong: ({ children, ...props }) => (
      <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em className="italic text-gray-800 dark:text-gray-200" {...props}>
        {children}
      </em>
    ),
    del: ({ children, ...props }) => (
      <del className="text-gray-600 dark:text-gray-400" {...props}>
        {children}
      </del>
    ),
    a: ({ href, children, ...props }) => {
      const external = href?.startsWith('http');
      return (
        <a
          href={href}
          className="text-purple-600 dark:text-purple-400 hover:underline"
          target={external ? '_blank' : undefined}
          rel={external ? 'noreferrer' : undefined}
          {...props}
        >
          {children}
        </a>
      );
    },
    ul: ({ children, ...props }) => (
      <ul className={`my-3 ml-5 list-disc space-y-1.5 ${bodyColor}`} {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className={`my-3 ml-5 list-decimal space-y-1.5 ${bodyColor}`} {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="pl-1 leading-7" {...props}>
        {children}
      </li>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="my-4 border-l-4 border-gray-300 dark:border-slate-600 pl-4 text-gray-700 dark:text-gray-300 italic"
        {...props}
      >
        {children}
      </blockquote>
    ),
    hr: (props) => <hr className="my-6 border-gray-200 dark:border-slate-600" {...props} />,
    code: ({ className, children, ...props }) => {
      const isFenced = Boolean(className?.includes('language-'));
      if (isFenced) {
        return (
          <code
            className={`block font-mono text-[13px] leading-6 text-gray-100 ${className ?? ''}`.trim()}
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          className="rounded bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[13px] text-gray-900 dark:text-gray-100"
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }) => (
      <pre
        className="my-4 overflow-x-auto rounded-xl bg-gray-900 dark:bg-slate-950 px-4 py-3 text-gray-100"
        {...props}
      >
        {children}
      </pre>
    ),
    table: ({ children, ...props }) => (
      <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
        <table className="min-w-full border-collapse text-left text-sm" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }) => (
      <tbody className="text-gray-800 dark:text-gray-200" {...props}>
        {children}
      </tbody>
    ),
    tr: ({ children, ...props }) => (
      <tr className="border-b border-gray-200 dark:border-slate-700 last:border-b-0" {...props}>
        {children}
      </tr>
    ),
    th: ({ children, ...props }) => (
      <th className="px-3 py-2 font-medium border border-gray-200 dark:border-slate-700" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="px-3 py-2 border border-gray-200 dark:border-slate-700" {...props}>
        {children}
      </td>
    ),
    input: ({ type, checked, ...props }) => {
      if (type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={checked}
            readOnly
            className="mr-2 rounded border-gray-300 dark:border-slate-600"
            {...props}
          />
        );
      }
      return <input type={type} {...props} />;
    },
  };
}

export default function AIMarkdown({ content, className = '', textColor }: AIMarkdownProps) {
  const trimmed = content?.trim() ?? '';
  const components = useMemo(() => createAIMarkdownComponents(textColor), [textColor]);

  if (!trimmed) return null;

  return (
    <div className={`${aiMarkdownProseClassName} ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {trimmed}
      </ReactMarkdown>
    </div>
  );
}
