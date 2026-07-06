/**
 * AI Identity (/ai) tab routing — canonical IDs and legacy query-param mapping.
 */

export type AIPrimaryTab = 'identity' | 'learning' | 'suggestions' | 'memory' | 'behavior';
export type AIMoreSection = 'provider' | 'actions' | 'insights';

export const DEFAULT_AI_TAB: AIPrimaryTab = 'identity';

export type AITabValue = AIPrimaryTab | 'more';

export interface NormalizedAITab {
  tab: AITabValue;
  section?: AIMoreSection;
  /** Legacy intelligence sub-tab (insights only). */
  intel?: string;
}

const LEGACY_TAB_MAP: Record<string, Omit<NormalizedAITab, 'intel'>> = {
  overview: { tab: 'identity' },
  identity: { tab: 'identity' },
  knowledge: { tab: 'memory' },
  memories: { tab: 'memory' },
  memory: { tab: 'memory' },
  learning: { tab: 'learning' },
  suggestions: { tab: 'suggestions' },
  behavior: { tab: 'behavior' },
  personality: { tab: 'behavior' },
  autonomy: { tab: 'behavior' },
  context: { tab: 'memory' },
  provider: { tab: 'more', section: 'provider' },
  actions: { tab: 'more', section: 'actions' },
  intelligence: { tab: 'more', section: 'insights' },
  insights: { tab: 'more', section: 'insights' },
  more: { tab: 'more' },
};

const VALID_INTEL = new Set([
  'analytics',
  'patterns',
  'suggestions',
  /** Legacy deep links (mapped in AIIntelligenceHub) */
  'review',
  'predictions',
  'recommendations',
]);

export function normalizeAITabFromQuery(
  tabParam: string | null,
  intelParam: string | null,
  sectionParam: string | null
): NormalizedAITab {
  const rawTab = tabParam?.trim() || '';
  const mapped = LEGACY_TAB_MAP[rawTab];

  if (mapped) {
    const intel =
      intelParam && VALID_INTEL.has(intelParam) ? intelParam : undefined;
    if (rawTab === 'intelligence' || rawTab === 'insights') {
      return { tab: 'more', section: 'insights', intel };
    }
    if (rawTab === 'more' && sectionParam) {
      const section = sectionParam as AIMoreSection;
      if (section === 'provider' || section === 'actions' || section === 'insights') {
        return { tab: 'more', section, intel };
      }
    }
    return { ...mapped, intel };
  }

  if (rawTab === 'more') {
    const section = sectionParam as AIMoreSection | null;
    if (section === 'provider' || section === 'actions' || section === 'insights') {
      return {
        tab: 'more',
        section,
        intel: intelParam && VALID_INTEL.has(intelParam) ? intelParam : undefined,
      };
    }
    return { tab: 'more', section: 'insights' };
  }

  if (rawTab === '') {
    return { tab: DEFAULT_AI_TAB };
  }

  return { tab: DEFAULT_AI_TAB };
}

/** Build URL search params for a tab (identity omits `tab` for clean default URL). */
export function buildAITabSearchParams(
  tab: AITabValue,
  options?: { section?: AIMoreSection; intel?: string; onboarding?: boolean }
): URLSearchParams {
  const params = new URLSearchParams();
  if (tab !== DEFAULT_AI_TAB) {
    params.set('tab', tab === 'memory' ? 'knowledge' : tab);
  }
  if (tab === 'more' && options?.section) {
    params.set('section', options.section);
  }
  if (options?.intel && options.section === 'insights') {
    params.set('intel', options.intel);
  }
  if (options?.onboarding) {
    params.set('onboarding', '1');
  }
  return params;
}

export function aiTabNeedsRedirect(
  tabParam: string | null,
  intelParam: string | null,
  sectionParam: string | null
): NormalizedAITab | null {
  const normalized = normalizeAITabFromQuery(tabParam, intelParam, sectionParam);
  const rawTab = tabParam?.trim() || '';

  if (!rawTab) {
    if (intelParam || sectionParam) return normalized;
    return null;
  }

  if (rawTab === 'overview') {
    return { tab: DEFAULT_AI_TAB };
  }

  if (LEGACY_TAB_MAP[rawTab]) {
    if (rawTab === 'memory' || rawTab === 'memories') {
      return { tab: 'memory' };
    }
    if (rawTab === 'personality' || rawTab === 'autonomy') {
      return normalized;
    }
    if (rawTab === 'context') return normalized;
    if (rawTab === 'intelligence') return normalized;
    if (rawTab === 'provider' || rawTab === 'actions') return normalized;
    if (rawTab === 'overview') return normalized;
  }

  return null;
}
