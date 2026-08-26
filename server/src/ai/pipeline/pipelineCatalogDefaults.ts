/**
 * Default pipeline catalog (code constants). DB policies override these at runtime.
 */

import type {
  PipelineCatalog,
  PipelineContextSourceDefinition,
  PipelineGroundingRule,
  PipelineIntentDefinition,
  PipelineIntentId,
  PipelineRegistryMeta,
  PipelineToolPolicy,
} from '../types/pipelineDiagnostics';
import { buildSourceToToolsMap } from './pipelineRegistryValidator';

type DefaultIntentSeed = Omit<PipelineIntentDefinition, keyof PipelineRegistryMeta>;
type DefaultGroundingSeed = Omit<PipelineGroundingRule, keyof PipelineRegistryMeta | 'enabled'>;
type DefaultSourceSeed = Omit<PipelineContextSourceDefinition, keyof PipelineRegistryMeta>;
type DefaultToolSeed = Omit<PipelineToolPolicy, keyof PipelineRegistryMeta>;

export const DEFAULT_PIPELINE_INTENT_DEFINITIONS: DefaultIntentSeed[] = [
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
    id: 'project_assistant',
    name: 'Project assistant',
    description: 'Cross-module discovery and context for a project or initiative.',
    triggerExamples: [
      'Help me understand everything related to this project',
      'What is the status of the launch project?',
    ],
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

export const DEFAULT_PIPELINE_GROUNDING_RULES: DefaultGroundingSeed[] = [
  {
    intentId: 'local_discovery',
    requiredSources: ['location'],
    optionalSources: ['vssyl_place', 'google_places', 'web_search'],
    requirementSummary: 'location + (vssyl_place | google_places | place_search | web_search)',
  },
  {
    intentId: 'planning',
    requiredSources: [],
    optionalSources: ['user_memory', 'calendar', 'drive_files', 'vlink', 'graph_bundle'],
    requirementSummary: 'optional memory, calendar, drive, vlink, graph_bundle',
  },
  {
    intentId: 'recommendation',
    requiredSources: ['user_memory'],
    optionalSources: ['web_search', 'profile', 'vssyl_place', 'google_places'],
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
    optionalSources: ['notifications_activity', 'calendar', 'vlink', 'graph_bundle'],
    requirementSummary: 'business_context + module_context',
  },
  {
    intentId: 'personal_reflection',
    requiredSources: [],
    optionalSources: ['user_memory', 'recent_conversations'],
    requirementSummary: 'optional memory',
  },
  {
    intentId: 'workflow_action',
    requiredSources: [],
    optionalSources: ['calendar', 'drive_files', 'vlink', 'graph_bundle', 'module_context'],
    requirementSummary: 'optional workflow modules, vlink, graph_bundle',
  },
  {
    intentId: 'project_assistant',
    requiredSources: [],
    optionalSources: [
      'module_context',
      'drive_files',
      'calendar',
      'vlink',
      'graph_bundle',
      'notifications_activity',
    ],
    requirementSummary: 'optional cross-module context, drive, calendar, vlink, graph_bundle',
  },
  {
    intentId: 'technical_help',
    requiredSources: [],
    optionalSources: ['repo_context', 'module_context', 'vlink', 'graph_bundle'],
    requirementSummary: 'optional repo_context, graph_bundle',
  },
];

export const SOURCE_TO_TOOLS: Record<string, PipelineToolPolicy['toolId'][]> = {
  location: ['location'],
  vssyl_place: ['place_search'],
  google_places: ['google_places_search', 'google_place_details'],
  vlink: ['module_context'],
  graph_bundle: ['module_context'],
  web_search: ['web_search'],
  user_memory: ['memory'],
  business_context: ['business_context'],
  module_context: ['module_context'],
  repo_context: ['module_context'],
};

export const DEFAULT_PIPELINE_CONTEXT_SOURCES: DefaultSourceSeed[] = [
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
    id: 'vlink',
    label: 'V_Link Relationships',
    description: 'Permission-filtered relationship graph context from confirmed V_Links.',
    enabled: true,
    wiredInTwin: true,
  },
  {
    id: 'graph_bundle',
    label: 'Context Graph Bundles',
    description:
      'Formal ContextBundleDescriptor federation views via Tier 0 Context Graph provider (read-only; PE at every hop).',
    enabled: true,
    wiredInTwin: true,
  },
  {
    id: 'google_places',
    label: 'Google Places',
    description: 'External physical-place discovery via Google Maps Platform Places API (New)',
    enabled: true,
    wiredInTwin: true,
  },
  {
    id: 'web_search',
    label: 'Web search',
    description:
      'Live public web search via Tavily (SEARCH ONLY Wave 1; ephemeral external evidence)',
    enabled: true,
    wiredInTwin: true,
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

export const DEFAULT_PIPELINE_TOOL_POLICIES: DefaultToolSeed[] = [
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
    toolId: 'google_places_search',
    purpose: 'Search Google Places for external physical-place discovery (Text Search)',
    requiredIntents: [],
    optionalIntents: ['local_discovery', 'recommendation'],
    requiredPermissions: [],
    fallbackBehavior: 'Disclose that external place discovery is unavailable; use Vssyl Place if present',
    enabled: true,
  },
  {
    toolId: 'google_place_details',
    purpose: 'Fetch Google Place Details for a known place resource id',
    requiredIntents: [],
    optionalIntents: ['local_discovery', 'recommendation'],
    requiredPermissions: [],
    fallbackBehavior: 'Answer from prior search evidence only',
    enabled: true,
  },
  {
    toolId: 'web_search',
    purpose: 'Search the public web for current factual information (pipeline prepass only)',
    requiredIntents: ['research'],
    optionalIntents: ['local_discovery', 'recommendation'],
    requiredPermissions: [],
    fallbackBehavior: 'Disclose that live web data is unavailable; do not invent current facts',
    enabled: true,
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
