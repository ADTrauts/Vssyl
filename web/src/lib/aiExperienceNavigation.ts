/**
 * Canonical AI Experience navigation model (Wave 5H-AI-UX-C).
 * Single source for routes and surface hierarchy across page, embedded, dropdown, and widget mounts.
 */

export const AI_EXPERIENCE_ROUTES = {
  /** Full-page twin workspace */
  chat: '/ai-chat',
  /** AI Identity control center (memory, behavior, provider) */
  identity: '/ai',
} as const;

export type AIExperienceRoute = keyof typeof AI_EXPERIENCE_ROUTES;

/** User-facing surfaces in the AI Experience family */
export type AIExperienceSurface =
  | 'full-page'
  | 'embedded'
  | 'header-dropdown'
  | 'dashboard-widget';

/**
 * Surface hierarchy — all chat interactions delegate to `AIChatWorkspace` except identity settings.
 * Header dropdown is a certified quick-access exception (overlay, not workspace shell).
 */
export const AI_EXPERIENCE_SURFACE_MODEL: Record<
  AIExperienceSurface,
  { label: string; chatEngine: 'AIChatWorkspace' | 'none'; certifiedException?: string }
> = {
  'full-page': {
    label: 'Full chat',
    chatEngine: 'AIChatWorkspace',
  },
  embedded: {
    label: 'Embedded module',
    chatEngine: 'AIChatWorkspace',
  },
  'header-dropdown': {
    label: 'Header quick chat',
    chatEngine: 'AIChatWorkspace',
    certifiedException:
      'Portal overlay for in-context quick access; links to full-page for extended sessions.',
  },
  'dashboard-widget': {
    label: 'Dashboard widget',
    chatEngine: 'AIChatWorkspace',
    certifiedException:
      'Grid tile mount; same workspace engine as embedded with optional widget chrome (remove control).',
  },
};

export function buildAIChatUrl(options?: { conversationId?: string }): string {
  const base = AI_EXPERIENCE_ROUTES.chat;
  if (!options?.conversationId) return base;
  return `${base}?conversation=${encodeURIComponent(options.conversationId)}`;
}

export function buildAIIdentityUrl(options?: { tab?: string }): string {
  const base = AI_EXPERIENCE_ROUTES.identity;
  if (!options?.tab) return base;
  return `${base}?tab=${encodeURIComponent(options.tab)}`;
}
