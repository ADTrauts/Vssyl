/**
 * Phase 8 — Pilot Skill definitions (code-owned, immutable versions).
 */
import type { AISkillDefinition } from 'vssyl-shared';

const basePolicies = {
  privacyPolicy: {
    redactSecrets: true,
    persistPrivateKnowledge: false,
    externalVisibilityAllowed: false,
  },
  timeoutPolicy: { softTimeoutMs: 45_000, hardTimeoutMs: 90_000 },
  costPolicy: { costTierHint: 'standard' as const },
  observationPolicy: { emitSkillEvents: true, attachToExecutionRecord: true },
  approvalPolicy: { mandatoryApproval: false, approvalForMutations: true },
};

export const NOTEBOOK_PAGE_SUMMARY_V1: AISkillDefinition = {
  key: 'notebook_page_summary',
  name: 'Notebook Page Summary',
  description:
    'Summarize an authorized Notebook page with key decisions, open tasks, and risks. Read-only.',
  version: '1.0.0',
  status: 'ACTIVE',
  owner: 'module:notebook',
  scope: 'MODULE_INTERNAL',
  intentTypes: ['DOCUMENT_SUMMARIZATION', 'MEETING_RECAP'],
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['pageId'],
    properties: {
      pageId: { type: 'string', description: 'Notebook page id' },
    },
  },
  outputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['summary', 'keyDecisions', 'openTasks', 'risksAndFollowUps', 'warnings'],
    properties: {
      summary: { type: 'string' },
      keyDecisions: { type: 'array', items: { type: 'string' } },
      openTasks: { type: 'array', items: { type: 'string' } },
      risksAndFollowUps: { type: 'array', items: { type: 'string' } },
      warnings: { type: 'array', items: { type: 'string' } },
      citedSources: { type: 'array', items: { type: 'string' } },
      uncertainties: { type: 'array', items: { type: 'string' } },
    },
  },
  capabilityRequest: {
    primary: 'STRUCTURED_SUMMARY',
    secondary: ['LONG_CONTEXT'],
    tier: 'BALANCED',
  },
  contextRequirements: {
    providers: ['notebook'],
    moduleIds: ['notebook'],
    minNecessary: true,
    personalMemoryAllowed: false,
    businessMembershipRequired: false,
  },
  knowledgeRequirements: {
    personalMemory: 'disallowed',
    businessPolicy: false,
    liveModuleSoR: true,
    platformGuidance: false,
    industryPackFuture: false,
  },
  groundingPolicy: {
    sourceCitationRequired: true,
    refuseWhenUngrounded: true,
    allowSpeculation: false,
  },
  allowedTools: [],
  actionPolicy: {
    allowedReadTools: [],
    allowedMutatingTools: [],
    prohibitedTools: ['*'],
    maxToolRounds: 0,
    mutationsDefaultOff: true,
  },
  ...basePolicies,
  evaluationProfile: {
    id: 'eval.notebook_page_summary.v1',
    factualGroundingRequired: true,
    sourceCitationCompleteness: true,
    schemaValidityRequired: true,
    toolCorrectness: false,
    uncertaintyBehavior: true,
    responseCompleteness: true,
    prohibitedClaims: ['fabricated_page_content'],
    latencyTargetMs: 30_000,
  },
  tags: ['pilot', 'notebook', 'read-only', 'summary'],
  compatibility: { minPlatformPhase: 'phase8' },
  customerVisible: true,
  internalOnly: false,
  systemsOfRecordRead: ['notebook.page'],
  instructionAssetKey: 'notebook_page_summary.instructions.v1',
  implementationKey: 'impl.notebook_page_summary.v1',
  certificationNotes: 'Wraps notebookAIActionService.summarizePage; no mutations.',
  activatedAt: '2026-07-13T00:00:00.000Z',
};

export const NOTEBOOK_ACTION_EXTRACTION_V1: AISkillDefinition = {
  key: 'notebook_action_extraction',
  name: 'Notebook Action Extraction',
  description:
    'Extract proposed action items from an authorized Notebook page. Does not create Todos.',
  version: '1.0.0',
  status: 'ACTIVE',
  owner: 'module:notebook',
  scope: 'MODULE_INTERNAL',
  intentTypes: ['ACTION_EXTRACTION'],
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['pageId'],
    properties: {
      pageId: { type: 'string' },
      selectedText: { type: 'string' },
    },
  },
  outputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['proposals', 'warnings'],
    properties: {
      proposals: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: ['string', 'null'] },
            dueDate: { type: ['string', 'null'] },
            priority: { type: ['string', 'null'] },
          },
        },
      },
      warnings: { type: 'array', items: { type: 'string' } },
      unresolvedQuestions: { type: 'array', items: { type: 'string' } },
    },
  },
  capabilityRequest: {
    primary: 'STRUCTURED_EXTRACTION',
    secondary: ['STRUCTURED_SUMMARY'],
    tier: 'BALANCED',
  },
  contextRequirements: {
    providers: ['notebook'],
    moduleIds: ['notebook'],
    minNecessary: true,
    personalMemoryAllowed: false,
    businessMembershipRequired: false,
  },
  knowledgeRequirements: {
    personalMemory: 'disallowed',
    businessPolicy: false,
    liveModuleSoR: true,
    platformGuidance: false,
    industryPackFuture: false,
  },
  groundingPolicy: {
    sourceCitationRequired: true,
    refuseWhenUngrounded: false,
    allowSpeculation: false,
  },
  allowedTools: [],
  actionPolicy: {
    allowedReadTools: [],
    allowedMutatingTools: [],
    prohibitedTools: ['confirm_extracted_action_items', 'todo.create'],
    maxToolRounds: 0,
    mutationsDefaultOff: true,
  },
  ...basePolicies,
  evaluationProfile: {
    id: 'eval.notebook_action_extraction.v1',
    factualGroundingRequired: true,
    sourceCitationCompleteness: false,
    schemaValidityRequired: true,
    toolCorrectness: true,
    uncertaintyBehavior: true,
    responseCompleteness: true,
    prohibitedClaims: ['auto_created_todo'],
    latencyTargetMs: 30_000,
  },
  tags: ['pilot', 'notebook', 'propose-only', 'actions'],
  compatibility: { minPlatformPhase: 'phase8' },
  customerVisible: true,
  internalOnly: false,
  systemsOfRecordRead: ['notebook.page'],
  instructionAssetKey: 'notebook_action_extraction.instructions.v1',
  implementationKey: 'impl.notebook_action_extraction.v1',
  certificationNotes:
    'Wraps extractActionItems only — never confirmExtractedActionItems.',
  activatedAt: '2026-07-13T00:00:00.000Z',
};

export const STRUCTURED_DOCUMENT_EXTRACTION_V1: AISkillDefinition = {
  key: 'structured_document_extraction',
  name: 'Structured Document Extraction',
  description:
    'Extract structured invoice/receipt fields from authorized document text. No mutations.',
  version: '1.0.0',
  status: 'ACTIVE',
  owner: 'platform:ai',
  scope: 'PLATFORM',
  intentTypes: ['STRUCTURED_DOCUMENT_EXTRACTION'],
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['documentText', 'documentType'],
    properties: {
      documentText: { type: 'string' },
      documentType: { type: 'string', enum: ['invoice', 'receipt'] },
    },
  },
  outputSchema: {
    type: 'object',
    additionalProperties: true,
    required: ['success'],
    properties: {
      success: { type: 'boolean' },
      data: { type: 'object' },
      error: { type: 'string' },
    },
  },
  capabilityRequest: {
    primary: 'STRUCTURED_EXTRACTION',
    tier: 'BALANCED',
  },
  contextRequirements: {
    providers: [],
    minNecessary: true,
    personalMemoryAllowed: false,
    businessMembershipRequired: false,
  },
  knowledgeRequirements: {
    personalMemory: 'disallowed',
    businessPolicy: false,
    liveModuleSoR: false,
    platformGuidance: false,
    industryPackFuture: false,
  },
  groundingPolicy: {
    sourceCitationRequired: true,
    refuseWhenUngrounded: true,
    allowSpeculation: false,
  },
  allowedTools: [],
  actionPolicy: {
    allowedReadTools: [],
    allowedMutatingTools: [],
    prohibitedTools: ['*'],
    maxToolRounds: 0,
    mutationsDefaultOff: true,
  },
  ...basePolicies,
  evaluationProfile: {
    id: 'eval.structured_document_extraction.v1',
    factualGroundingRequired: true,
    sourceCitationCompleteness: true,
    schemaValidityRequired: true,
    toolCorrectness: false,
    uncertaintyBehavior: true,
    responseCompleteness: true,
    prohibitedClaims: [],
    latencyTargetMs: 25_000,
  },
  tags: ['pilot', 'platform', 'extraction', 'read-only'],
  compatibility: { minPlatformPhase: 'phase8' },
  customerVisible: true,
  internalOnly: false,
  systemsOfRecordRead: [],
  instructionAssetKey: 'structured_document_extraction.instructions.v1',
  implementationKey: 'impl.structured_document_extraction.v1',
  certificationNotes: 'Wraps documentExtractionService.extractInvoiceOrReceipt.',
  activatedAt: '2026-07-13T00:00:00.000Z',
};

export const PHASE8_PILOT_SKILLS: AISkillDefinition[] = [
  NOTEBOOK_PAGE_SUMMARY_V1,
  NOTEBOOK_ACTION_EXTRACTION_V1,
  STRUCTURED_DOCUMENT_EXTRACTION_V1,
];
