#!/usr/bin/env node
/**
 * BO-1B: migrate legacy gray-* Tailwind classes to v-* design tokens in BO module UI.
 * UX-only — no business logic changes.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = [
  'web/src/components/scheduling',
  'web/src/components/hr',
  'web/src/components/workforce-comms',
];

const REPLACEMENTS = [
  ['text-gray-900 dark:text-gray-100', 'text-v-text-primary'],
  ['text-gray-800 dark:text-gray-200', 'text-v-text-primary'],
  ['text-gray-700 dark:text-gray-300', 'text-v-text-secondary'],
  ['text-gray-600 dark:text-gray-400', 'text-v-text-secondary'],
  ['text-gray-500 dark:text-gray-400', 'text-v-text-muted'],
  ['text-gray-400 dark:text-gray-500', 'text-v-text-muted'],
  ['text-gray-900', 'text-v-text-primary'],
  ['text-gray-800', 'text-v-text-primary'],
  ['text-gray-700', 'text-v-text-secondary'],
  ['text-gray-600', 'text-v-text-secondary'],
  ['text-gray-500', 'text-v-text-muted'],
  ['text-gray-400', 'text-v-text-muted'],
  ['bg-gray-50 dark:bg-slate-800/50', 'bg-v-surface-muted'],
  ['bg-gray-50 dark:bg-slate-800', 'bg-v-surface-muted'],
  ['bg-white dark:bg-slate-900', 'bg-v-surface'],
  ['bg-white dark:bg-slate-800', 'bg-v-surface'],
  ['hover:bg-gray-100 dark:hover:bg-slate-800', 'hover:bg-v-surface-muted'],
  ['hover:bg-gray-50 dark:hover:bg-slate-800', 'hover:bg-v-surface-muted'],
  ['hover:bg-gray-200', 'hover:bg-v-surface-muted'],
  ['bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-v-surface-muted text-v-text-secondary hover:bg-v-border'],
  ['bg-gray-100 text-gray-800', 'bg-v-surface-muted text-v-text-primary'],
  ['bg-gray-100', 'bg-v-surface-muted'],
  ['bg-gray-200 rounded-full', 'bg-v-border rounded-full'],
  ['bg-gray-200', 'bg-v-border'],
  ['border-gray-200 dark:border-slate-700', 'border-v-border'],
  ['border-gray-300 dark:border-slate-600', 'border-v-border'],
  ['border-gray-200', 'border-v-border'],
  ['border-gray-300', 'border-v-border'],
  ['border-t border-gray-200 dark:border-slate-700', 'border-t border-v-border'],
  ['divide-gray-200', 'divide-v-border'],
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

let touched = 0;
for (const root of ROOTS) {
  for (const file of walk(root)) {
    let source = readFileSync(file, 'utf8');
    const before = source;
    for (const [from, to] of REPLACEMENTS) {
      source = source.split(from).join(to);
    }
    if (source !== before) {
      writeFileSync(file, source);
      touched += 1;
    }
  }
}
console.log(`BO-1B token migration: ${touched} files updated`);
