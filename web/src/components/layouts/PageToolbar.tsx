'use client';

import React from 'react';

const ROOT_CLASS =
  'shrink-0 border-b border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800';

const PRIMARY_ROW_CLASS =
  'flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between';

const LEADING_CLASS = 'flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center';

const TRAILING_CLASS =
  'flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end';

const SECONDARY_ROW_CLASS =
  'border-t border-gray-200 px-4 py-3 dark:border-slate-700';

export interface PageToolbarProps {
  /** Search, filter chips, category controls — left / primary region */
  leading?: React.ReactNode;
  /** View toggles, bulk actions, select mode — right region */
  trailing?: React.ReactNode;
  /** Optional second row (extended filters, time range, etc.) */
  secondary?: React.ReactNode;
  className?: string;
}

export function PageToolbar({
  leading,
  trailing,
  secondary,
  className = '',
}: PageToolbarProps) {
  const hasPrimary = Boolean(leading || trailing);

  return (
    <div className={`${ROOT_CLASS} ${className}`.trim()} role="toolbar" aria-label="Page tools">
      {hasPrimary ? (
        <div className={PRIMARY_ROW_CLASS}>
          {leading ? <div className={LEADING_CLASS}>{leading}</div> : null}
          {trailing ? <div className={TRAILING_CLASS}>{trailing}</div> : null}
        </div>
      ) : null}
      {secondary ? <div className={SECONDARY_ROW_CLASS}>{secondary}</div> : null}
    </div>
  );
}
