/**
 * Module context provider selection and multi-module fetch policy (Phase 3B).
 */

export interface MatchedModuleInput {
  moduleId: string;
  moduleName: string;
  confidence: number;
  matchedKeywords: string[];
  matchedPatterns: string[];
  relevance: 'high' | 'medium' | 'low';
}

export interface ContextProviderConfig {
  name: string;
  endpoint: string;
  cacheDuration?: number;
  description?: string;
}

export const MODULE_MENTION_ALIASES: Record<string, string[]> = {
  drive: ['drive', 'files', 'documents', 'file', 'storage', 'upload', 'download'],
  chat: ['chat', 'messages', 'conversations', 'message', 'conversation'],
  calendar: ['calendar', 'events', 'event', 'schedule', 'meeting', 'appointment'],
  hr: ['hr', 'employees', 'employee', 'team', 'staff', 'workforce', 'people'],
  scheduling: ['scheduling', 'shifts', 'shift', 'coverage', 'schedule', 'roster'],
  todo: ['todo', 'todos', 'task', 'tasks', 'to-do', 'todo-list'],
  notes: ['notes', 'note', 'journal', 'memo'],
  notebook: ['notebook', 'page', 'pages', 'meeting notes', 'meeting page'],
  place: ['place', 'places', 'discovery', 'discover', 'local'],
  dashboard: ['dashboard', 'home', 'widgets', 'workspace'],
};

/** Modules whose context endpoints require businessId. */
export const BUSINESS_SCOPED_MODULE_IDS = new Set(['hr', 'scheduling']);

export function requiresBusinessId(moduleId: string): boolean {
  return BUSINESS_SCOPED_MODULE_IDS.has(moduleId);
}

export function detectMultiModuleIntent(
  query: string,
  matchedModules: MatchedModuleInput[]
): boolean {
  const highCount = matchedModules.filter((m) => m.relevance === 'high').length;
  if (highCount >= 2) return true;

  const mediumCount = matchedModules.filter((m) => m.relevance === 'medium').length;
  if (highCount >= 1 && mediumCount >= 1) return true;

  const q = query.toLowerCase();
  if (/\b(and|plus|also|as well as)\b/.test(q) && matchedModules.length >= 2) {
    return true;
  }

  const crossModulePatterns = [
    /(meeting|calendar|event|appointment).*(file|drive|document|chat|message|share)/,
    /(file|drive|document|share).*(meeting|calendar|event|chat|message)/,
    /(task|todo).*(meeting|calendar|file|drive)/,
    /(note|notes).*(meeting|calendar|file|drive)/,
  ];
  if (crossModulePatterns.some((pattern) => pattern.test(q)) && matchedModules.length >= 2) {
    return true;
  }

  return false;
}

export function resolveModulesToFetch(
  matchedModules: MatchedModuleInput[],
  query: string,
  maxModules = 4
): MatchedModuleInput[] {
  const relevanceScore = (relevance: MatchedModuleInput['relevance']) =>
    relevance === 'high' ? 3 : relevance === 'medium' ? 2 : 1;

  const sorted = [...matchedModules].sort(
    (a, b) =>
      relevanceScore(b.relevance) - relevanceScore(a.relevance) ||
      b.confidence - a.confidence
  );

  const multi = detectMultiModuleIntent(query, matchedModules);
  const eligible = multi
    ? sorted.filter((m) => m.relevance === 'high' || m.relevance === 'medium')
    : sorted.filter((m) => m.relevance === 'high');

  const seen = new Set<string>();
  const result: MatchedModuleInput[] = [];
  for (const match of eligible) {
    if (seen.has(match.moduleId)) continue;
    seen.add(match.moduleId);
    result.push(match);
    if (result.length >= maxModules) break;
  }
  return result;
}

export function selectContextProvider(
  moduleId: string,
  query: string,
  providers: ContextProviderConfig[]
): ContextProviderConfig | undefined {
  if (providers.length === 0) return undefined;

  const q = query.toLowerCase();
  const names = new Set(providers.map((p) => p.name));
  const pick = (name: string) => providers.find((p) => p.name === name);

  switch (moduleId) {
    case 'drive':
      if (/\b(storage|quota|space|capacity|usage|full)\b/.test(q) && names.has('storage_overview')) {
        return pick('storage_overview');
      }
      if (/\b(count|how many)\b/.test(q) && names.has('file_count')) {
        return pick('file_count');
      }
      return pick('recent_files') ?? providers[0];

    case 'todo':
      if (/\b(overdue|late|past due|missed)\b/.test(q) && names.has('overdue_tasks')) {
        return pick('overdue_tasks');
      }
      if (/\b(priority|urgent|important|high priority)\b/.test(q) && names.has('priority_tasks')) {
        return pick('priority_tasks');
      }
      if (
        /\b(upcoming|due|tomorrow|today|this week|deadline)\b/.test(q) &&
        names.has('upcoming_tasks')
      ) {
        return pick('upcoming_tasks');
      }
      return pick('task_overview') ?? providers[0];

    case 'notes':
      if (/\b(pinned|pin)\b/.test(q) && names.has('pinned_notes')) {
        return pick('pinned_notes');
      }
      return pick('recent_notes') ?? providers[0];

    case 'notebook':
      if (/\b(task|todo|action)\b/.test(q) && names.has('task_overview')) {
        return pick('task_overview');
      }
      if (/\b(pinned|pin)\b/.test(q) && names.has('pinned_pages')) {
        return pick('pinned_pages');
      }
      return pick('recent_pages') ?? providers[0];

    case 'place':
      if (
        /\b(discover|discovery|explore|restaurant|nearby|trending)\b/.test(q) &&
        names.has('place_discoveries')
      ) {
        return pick('place_discoveries');
      }
      if (/\b(connection|follow|following)\b/.test(q) && names.has('place_connections')) {
        return pick('place_connections');
      }
      return pick('place_overview') ?? providers[0];

    case 'chat':
      if (/\b(unread|notification)\b/.test(q) && names.has('unread_messages')) {
        return pick('unread_messages');
      }
      return pick('recent_conversations') ?? providers[0];

    case 'calendar':
      if (/\b(today|now)\b/.test(q) && names.has('today_events')) {
        return pick('today_events');
      }
      if (/\b(available|availability|free|busy)\b/.test(q) && names.has('availability')) {
        return pick('availability');
      }
      return pick('upcoming_events') ?? providers[0];

    case 'hr':
      if (
        /\b(?:my (?:job )?title|my (?:position|department|manager|boss|supervisor)|what (?:job )?(?:title|position|department) am i in|which department do i work in|who (?:is my (?:manager|boss|supervisor)|do i report to))\b/.test(
          q
        ) &&
        names.has('self_employment')
      ) {
        return pick('self_employment');
      }
      if (/\b(headcount|employee count|head count)\b/.test(q) && names.has('employee_count')) {
        return pick('employee_count');
      }
      if (/\b(time off|pto|vacation|leave)\b/.test(q) && names.has('time_off_summary')) {
        return pick('time_off_summary');
      }
      return pick('hr_overview') ?? providers[0];

    case 'scheduling':
      if (/\b(coverage|staffed|covered)\b/.test(q) && names.has('coverage_status')) {
        return pick('coverage_status');
      }
      if (/\b(conflict|gap|overlap)\b/.test(q) && names.has('scheduling_conflicts')) {
        return pick('scheduling_conflicts');
      }
      return pick('scheduling_overview') ?? providers[0];

    case 'dashboard':
      if (/\b(stat|stats|quick|summary)\b/.test(q) && names.has('dashboard_quick_stats')) {
        return pick('dashboard_quick_stats');
      }
      if (/\b(widget)\b/.test(q) && names.has('dashboard_widget_summary')) {
        return pick('dashboard_widget_summary');
      }
      return pick('dashboard_overview') ?? providers[0];

    default:
      return providers[0];
  }
}

export function buildSuggestedContextProviders(
  matches: Array<{ moduleId: string; contextProviders?: ContextProviderConfig[] }>,
  query: string
): Array<{ moduleId: string; providerName: string; endpoint: string }> {
  const result: Array<{ moduleId: string; providerName: string; endpoint: string }> = [];

  for (const match of matches) {
    const providers = match.contextProviders ?? [];
    const selected = selectContextProvider(match.moduleId, query, providers);
    if (selected) {
      result.push({
        moduleId: match.moduleId,
        providerName: selected.name,
        endpoint: selected.endpoint.replace(':id', match.moduleId),
      });
    }
  }

  return result;
}

export function buildModuleContextFetchParams(
  moduleId: string,
  userId: string,
  scope?: { businessId?: string; dashboardId?: string }
): Record<string, unknown> {
  const params: Record<string, unknown> = { userId };

  if (scope?.dashboardId) {
    params.dashboardId = scope.dashboardId;
  }

  if (scope?.businessId) {
    params.businessId = scope.businessId;
  }

  if (requiresBusinessId(moduleId) && !params.businessId) {
    throw new Error(`businessId is required for ${moduleId} context fetch`);
  }

  return params;
}
