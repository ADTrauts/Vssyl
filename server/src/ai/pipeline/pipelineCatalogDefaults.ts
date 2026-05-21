/**
 * Default pipeline catalog (code constants). DB policies override these at runtime.
 */

import type {
  PipelineCatalog,
  PipelineContextSourceDefinition,
  PipelineGroundingRule,
  PipelineIntentDefinition,
  PipelineIntentId,
  PipelineToolPolicy,
} from '../types/pipelineDiagnostics';
import { buildSourceToToolsMap } from './pipelineRegistryValidator';

export const DEFAULT_PIPELINE_INTENT_DEFINITIONS: PipelineIntentDefinition[] = [
  {
    id: 'emotional_support',
    name: 'Emotional support',
    description: 'Stress, burnout, overwhelm, or need for empathy and pacing.',
    triggerExamples: [
      'I feel burned out and need a change of pace',
      "I'm overwhelmed at work",
    ],
    groundingRequired: false,
    enabled: true,
  },
  {
    id: 'local_discovery',
    name: 'Local discovery',
    description: 'Find nearby places, events, clubs, workshops, or local activities.',
    triggerExamples: ['Yoga clubs near me', 'Workshops in my area this weekend'],
    groundingRequired: true,
    enabled: true,
  },
  {
    id: 'recommendation',
    name: 'Recommendation',
    description: 'Suggestions for products, places, options, or next choices.',
    triggerExamples: ['What should I do tonight?', 'Recommend a good restaurant'],
    groundingRequired: true,
    enabled: true,
  },
  {
    id: 'planning',
    name: 'Planning',
    description: 'Plans, roadmaps, schedules, and step-by-step next actions.',
    triggerExamples: ['Help me plan my week', 'Roadmap for the launch'],
    groundingRequired: false,
    enabled: true,
  },
  {
    id: 'research',
    name: 'Research',
    description: 'Look up current facts, verify claims, or compare external information.',
    triggerExamples: ['What are the latest rates?', 'Look up current regulations'],
    groundingRequired: true,
    enabled: true,
  },
  {
    id: 'personal_reflection',
    name: 'Personal reflection',
    description: 'Journaling, life direction, values, and introspective conversation.',
    triggerExamples: ['I have been thinking about my career path', 'Help me reflect on last year'],
    groundingRequired: false,
    enabled: true,
  },
  {
    id: 'business_operations',
    name: 'Business operations',
    description: 'Team, operations, HR, scheduling, and workspace business context.',
    triggerExamples: ['How is our team utilization?', 'Business KPIs this quarter'],
    groundingRequired: true,
    enabled: true,
  },
  {
    id: 'technical_help',
    name: 'Technical help',
    description: 'Code, debugging, repositories, errors, and implementation questions.',
    triggerExamples: ['Why is this TypeScript error happening?', 'Debug this API route'],
    groundingRequired: false,
    enabled: true,
  },
  {
    id: 'workflow_action',
    name: 'Workflow action',
    description: 'Execute or prepare tasks: todos, files, calendar, module actions.',
    triggerExamples: ['Create a todo for tomorrow', 'Share this file with the team'],
    groundingRequired: false,
    enabled: true,
  },
  {
    id: 'general_chat',
    name: 'General chat',
    description: 'Casual conversation without specialized grounding requirements.',
    triggerExamples: ['Hello', 'Thanks for your help earlier'],
    groundingRequired: false,
    enabled: true,
  },
];

export const DEFAULT_PIPELINE_GROUNDING_RULES: PipelineGroundingRule[] = [
  {
    intentId: 'local_discovery',
    requiredSources: ['location'],
    optionalSources: ['vssyl_place', 'web_search'],
    requirementSummary: 'location + (place_search | web_search)',
  },
  {
    intentId: 'recommendation',
    requiredSources: ['user_memory'],
    optionalSources: ['web_search', 'profile', 'vssyl_place'],
    requirementSummary: 'memory + optional web_search',
  },
  {
    intentId: 'research',
    requiredSources: ['web_search'],
    optionalSources: ['module_context'],
    requirementSummary: 'web_search',
  },
  {
    intentId: 'business_operations',
    requiredSources: ['business_context', 'module_context'],
    optionalSources: ['notifications_activity', 'calendar'],
    requirementSummary: 'business_context + module_context',
  },
  {
    intentId: 'personal_reflection',
    requiredSources: [],
    optionalSources: ['user_memory', 'recent_conversations'],
    requirementSummary: 'optional memory',
  },
  {
    intentId: 'technical_help',
    requiredSources: [],
    optionalSources: ['repo_context', 'module_context'],
    requirementSummary: 'optional repo_context',
  },
];

export const SOURCE_TO_TOOLS: Record<string, PipelineToolPolicy['toolId'][]> = {
  location: ['location'],
  vssyl_place: ['place_search'],
  web_search: ['web_search'],
  user_memory: ['memory'],
  business_context: ['business_context'],
  module_context: ['module_context'],
  repo_context: ['module_context'],
};

export const DEFAULT_PIPELINE_CONTEXT_SOURCES: PipelineContextSourceDefinition[] = [
  {
    id: 'user_memory',
    label: 'User memory',
    description: 'Structured UserMemoryFact and learned UserAIContext',
    enabled: true,
    wiredInTwin: true,
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'User profile and preferences',
    enabled: true,
    wiredInTwin: true,
  },
  {
    id: 'recent_conversations',
    label: 'Recent conversations',
    description: 'Thread history and cross-session summaries',
    enabled: true,
    wiredInTwin: true,
  },
  {
    id: 'active_goals',
    label: 'Active goals',
    description: 'User goals and priorities when available',
    enabled: true,
    wiredInTwin: false,
  },
  {
    id: 'location',
    label: 'Location',
    description: 'IP geolocation or registered user location',
    enabled: true,
    wiredInTwin: false,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    description: 'Calendar module AI context providers',
    enabled: true,
    wiredInTwin: true,
  },
  {
    id: 'drive_files',
    label: 'Drive / files',
    description: 'Drive module context and file attachments',
    enabled: true,
    wiredInTwin: true,
  },
  {
    id: 'business_context',
    label: 'Business context',
    description: 'Business workspace policies and scope',
    enabled: true,
    wiredInTwin: true,
  },
  {
    id: 'vssyl_place',
    label: 'Vssyl Place',
    description: 'Place module AI context providers',
    enabled: true,
    wiredInTwin: true,
  },
  {
    id: 'web_search',
    label: 'Web search',
    description: 'External web search (not yet implemented in twin)',
    enabled: false,
    wiredInTwin: false,
  },
  {
    id: 'module_context',
    label: 'Module context',
    description: 'Cross-module context engine providers',
    enabled: true,
    wiredInTwin: true,
  },
  {
    id: 'notifications_activity',
    label: 'Notifications / activity',
    description: 'Recent notifications and activity feed',
    enabled: true,
    wiredInTwin: false,
  },
  {
    id: 'repo_context',
    label: 'Repository / docs context',
    description: 'Codebase or documentation context files',
    enabled: true,
    wiredInTwin: false,
  },
];

export const DEFAULT_PIPELINE_TOOL_POLICIES: PipelineToolPolicy[] = [
  {
    toolId: 'memory',
    purpose: 'Load user memory facts and learned context',
    requiredIntents: ['recommendation'],
    optionalIntents: ['personal_reflection', 'local_discovery'],
    requiredPermissions: [],
    fallbackBehavior: 'Proceed without memory; flag generic recommendation risk',
    enabled: true,
  },
  {
    toolId: 'location',
    purpose: 'Resolve user geographic context',
    requiredIntents: ['local_discovery'],
    optionalIntents: [],
    requiredPermissions: [],
    fallbackBehavior: 'Ask user for location or use IP geolocation when available',
    enabled: true,
  },
  {
    toolId: 'place_search',
    purpose: 'Search Vssyl Place listings and discoveries',
    requiredIntents: [],
    optionalIntents: ['local_discovery', 'recommendation'],
    requiredPermissions: [],
    fallbackBehavior: 'Fall back to web_search when implemented',
    enabled: true,
  },
  {
    toolId: 'web_search',
    purpose: 'Search the public web for current local or factual information',
    requiredIntents: ['research'],
    optionalIntents: ['local_discovery', 'recommendation'],
    requiredPermissions: [],
    fallbackBehavior: 'Disclose that live web data is unavailable',
    enabled: false,
  },
  {
    toolId: 'list_drive_files',
    purpose: 'List Drive files via OpenAI tool loop',
    requiredIntents: [],
    optionalIntents: ['workflow_action', 'technical_help'],
    requiredPermissions: ['drive:read'],
    fallbackBehavior: 'Suggest manual Drive navigation',
    enabled: true,
  },
  {
    toolId: 'share_file',
    purpose: 'Share a Drive file',
    requiredIntents: [],
    optionalIntents: ['workflow_action'],
    requiredPermissions: ['drive:write'],
    fallbackBehavior: 'Provide share instructions only',
    enabled: true,
  },
  {
    toolId: 'create_todo',
    purpose: 'Create a todo item',
    requiredIntents: [],
    optionalIntents: ['workflow_action', 'planning'],
    requiredPermissions: ['todo:write'],
    fallbackBehavior: 'Suggest creating todo manually',
    enabled: true,
  },
  {
    toolId: 'module_context',
    purpose: 'Fetch module AI context providers',
    requiredIntents: ['business_operations'],
    optionalIntents: ['technical_help', 'workflow_action'],
    requiredPermissions: [],
    fallbackBehavior: 'Answer from general knowledge with lower confidence',
    enabled: true,
  },
  {
    toolId: 'business_context',
    purpose: 'Load business workspace policies and scope',
    requiredIntents: ['business_operations'],
    optionalIntents: [],
    requiredPermissions: ['business:member'],
    fallbackBehavior: 'Refuse business-specific claims without workspace context',
    enabled: true,
  },
];

export const DEFAULT_WEAK_GENERIC_PHRASES: readonly string[] = [
  'consider checking',
  'you may want to',
  'local community centers',
  'online platforms like meetup',
  'it depends',
];

function withSystemMeta<T extends { id?: string; toolId?: string; intentId?: string }>(
  rows: T[]
): (T & { isSystem: boolean; archived: boolean })[] {
  return rows.map((row) => ({ ...row, isSystem: true, archived: false }));
}

export function getDefaultPipelineCatalog(): PipelineCatalog {
  return {
    intents: withSystemMeta(DEFAULT_PIPELINE_INTENT_DEFINITIONS),
    groundingRules: withSystemMeta(DEFAULT_PIPELINE_GROUNDING_RULES).map((r) => ({
      ...r,
      enabled: true,
    })),
    contextSources: withSystemMeta(DEFAULT_PIPELINE_CONTEXT_SOURCES),
    toolPolicies: withSystemMeta(DEFAULT_PIPELINE_TOOL_POLICIES),
    weakGenericPhrases: [...DEFAULT_WEAK_GENERIC_PHRASES],
  };
}

export function getIntentDefinitionFromCatalog(
  catalog: PipelineCatalog,
  intentId: PipelineIntentId
): PipelineIntentDefinition | undefined {
  return catalog.intents.find((d) => d.id === intentId);
}

export function isGroundingRequiredForIntentsInCatalog(
  catalog: PipelineCatalog,
  intentIds: PipelineIntentId[]
): boolean {
  return intentIds.some(
    (id) => getIntentDefinitionFromCatalog(catalog, id)?.groundingRequired === true
  );
}

export function getGroundingRuleForIntentInCatalog(
  catalog: PipelineCatalog,
  intentId: PipelineIntentId
): PipelineGroundingRule | undefined {
  return catalog.groundingRules.find((r) => r.intentId === intentId);
}

export function getToolsConsideredForIntentsInCatalog(
  catalog: PipelineCatalog,
  intentIds: PipelineIntentId[]
): string[] {
  const sourceToolMap = buildSourceToToolsMap(catalog);
  const tools = new Set<string>();
  for (const policy of catalog.toolPolicies) {
    if (!policy.enabled || policy.archived) continue;
    const matchesRequired = policy.requiredIntents.some((i) => intentIds.includes(i));
    const matchesOptional = policy.optionalIntents.some((i) => intentIds.includes(i));
    if (matchesRequired || matchesOptional) {
      tools.add(policy.toolId);
    }
  }
  for (const intentId of intentIds) {
    const rule = getGroundingRuleForIntentInCatalog(catalog, intentId);
    if (!rule || rule.archived || rule.enabled === false) continue;
    for (const toolId of rule.requiredTools ?? []) {
      tools.add(toolId);
    }
    for (const sourceId of [...rule.requiredSources, ...rule.optionalSources]) {
      const mapped = sourceToolMap[sourceId];
      if (mapped) {
        for (const t of mapped) {
          tools.add(t);
        }
      }
    }
  }
  return [...tools].sort();
}

export function getWeakPhrasesFromCatalog(catalog: PipelineCatalog): readonly string[] {
  return catalog.weakGenericPhrases;
}
