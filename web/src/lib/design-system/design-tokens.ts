/**
 * Shared UI tokens for the application shell and layout math.
 * Complements CSS variables in `web/src/styles/tokens.css`.
 * Do not move Tailwind into CSS variables yet — use these as TypeScript constants.
 */

/** 4px base grid — aligned with `--v-space-*` in tokens.css */
export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

/** Border radius scale — aligned with `--v-radius-*` in tokens.css */
export const radius = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  full: 9999,
  button: 6,
  card: 8,
  panel: 12,
  modal: 16,
} as const;

/** Elevation shadows — aligned with `--v-shadow-*` in tokens.css */
export const shadow = {
  none: 'none',
  subtle: '0 1px 2px rgba(0, 0, 0, 0.05)',
  card: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  panel: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  overlay: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
} as const;

/** Content max widths (px) — common shell and page constraints */
export const maxWidth = {
  modal: 448,
  content: 640,
  prose: 672,
  contentWide: 768,
  page: 1280,
  modalWide: 1024,
} as const;

/** Fixed header heights (px) — aligned with PlatformShell defaults */
export const headerHeight = {
  default: 64,
  compact: 56,
} as const;

/** Sidebar and rail widths (px) — aligned with PlatformShell defaults */
export const sidebarWidth = {
  leftNav: 240,
  leftNavCollapsed: 0,
  rightRail: 40,
  thin: 48,
} as const;

/** Minimum interactive target sizes (px) — WCAG-friendly touch targets */
export const touchTarget = {
  minimum: 44,
  comfortable: 48,
  iconButton: 40,
} as const;

/** Badge dimensions — aligned with shared Badge size variants */
export const badgeSize = {
  sm: { paddingX: 4, paddingY: 2, fontSize: 12 },
  md: { paddingX: 8, paddingY: 4, fontSize: 12 },
  lg: { paddingX: 12, paddingY: 6, fontSize: 14 },
} as const;

/** Card interior padding (px) */
export const cardPadding = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/** Grouped export for consumers that prefer a single import */
export const designTokens = {
  spacing,
  radius,
  shadow,
  maxWidth,
  headerHeight,
  sidebarWidth,
  touchTarget,
  badgeSize,
  cardPadding,
} as const;

export type DesignTokens = typeof designTokens;
