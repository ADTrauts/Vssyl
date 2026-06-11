'use client';

import React from 'react';

const ROOT_CLASS =
  'shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800';

const INNER_CLASS =
  'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between';

const TITLE_BLOCK_CLASS = 'flex min-w-0 items-start gap-3';

const ICON_CLASS = 'mt-0.5 shrink-0 text-gray-700 dark:text-gray-300';

const TEXT_BLOCK_CLASS = 'min-w-0';

const TITLE_CLASS = 'text-2xl font-semibold text-gray-900 dark:text-gray-100';

const DESCRIPTION_CLASS = 'text-sm text-gray-600 dark:text-gray-400';

const ACTIONS_CLASS =
  'flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end';

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Optional leading icon (module icon, status glyph, etc.) */
  icon?: React.ReactNode;
  /** Primary page actions — settings, create, mark-all; not filters or bulk bars */
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`${ROOT_CLASS} ${className}`.trim()}>
      <div className={INNER_CLASS}>
        <div className={TITLE_BLOCK_CLASS}>
          {icon ? <div className={ICON_CLASS}>{icon}</div> : null}
          <div className={TEXT_BLOCK_CLASS}>
            <h1 className={TITLE_CLASS}>{title}</h1>
            {description ? <p className={DESCRIPTION_CLASS}>{description}</p> : null}
          </div>
        </div>
        {actions ? <div className={ACTIONS_CLASS}>{actions}</div> : null}
      </div>
    </header>
  );
}
