/**
 * Phase 8 — Provider-neutral instruction assets (versioned with Skill impl).
 * Not executable code; referenced by instructionAssetKey on definitions.
 */
export interface SkillInstructionAsset {
  key: string;
  version: string;
  systemResponsibility: string;
  userInputPlacement: string;
  contextPlacement: string;
  citationRequirements: string;
  structuredOutputContract: string;
  refusalAndUncertainty: string;
  prohibitedBehavior: string[];
  toolInstructions: string;
  evaluationHooks: string[];
}

export const SKILL_INSTRUCTION_ASSETS: Record<string, SkillInstructionAsset> = {
  'notebook_page_summary.instructions.v1': {
    key: 'notebook_page_summary.instructions.v1',
    version: '1.0.0',
    systemResponsibility: 'Summarize authorized notebook page content only.',
    userInputPlacement: 'pageId resolved via Notebook SoR before prompting.',
    contextPlacement: 'Grounded page text from notebookAIContextService.',
    citationRequirements: 'Stay within page content; surface warnings from context.',
    structuredOutputContract: 'JSON: summary, keyDecisions, openTasks, risksAndFollowUps.',
    refusalAndUncertainty: 'If page empty or inaccessible, fail closed via service errors.',
    prohibitedBehavior: [
      'Invent page content',
      'Mutate notebook or todos',
      'Expose private chain-of-thought',
    ],
    toolInstructions: 'No tools allowed for this Skill.',
    evaluationHooks: ['schema_validity', 'grounding', 'completeness'],
  },
  'notebook_action_extraction.instructions.v1': {
    key: 'notebook_action_extraction.instructions.v1',
    version: '1.0.0',
    systemResponsibility: 'Propose action items; never confirm/create tasks.',
    userInputPlacement: 'pageId (+ optional selectedText).',
    contextPlacement: 'Grounded page text; optional selection overlay.',
    citationRequirements: 'Proposals must be supported by page text.',
    structuredOutputContract: 'JSON proposals[{title, description, dueDate, priority}].',
    refusalAndUncertainty: 'Empty proposals allowed when no actions present.',
    prohibitedBehavior: [
      'Call confirmExtractedActionItems',
      'Write todos',
      'Escalate tools',
    ],
    toolInstructions: 'No tools; propose-only.',
    evaluationHooks: ['schema_validity', 'no_mutation', 'uncertainty'],
  },
  'structured_document_extraction.instructions.v1': {
    key: 'structured_document_extraction.instructions.v1',
    version: '1.0.0',
    systemResponsibility: 'Extract invoice/receipt fields from provided text.',
    userInputPlacement: 'documentText + documentType in Skill input.',
    contextPlacement: 'Input text only; no memory.',
    citationRequirements: 'Fields must come from document text.',
    structuredOutputContract: 'Validated InvoiceExtraction schema via Zod.',
    refusalAndUncertainty: 'Return success:false on short/invalid text.',
    prohibitedBehavior: ['Persist extracted data', 'Call mutating tools'],
    toolInstructions: 'No tools.',
    evaluationHooks: ['schema_validity', 'grounding'],
  },
};

export function getSkillInstructionAsset(key: string): SkillInstructionAsset | undefined {
  return SKILL_INSTRUCTION_ASSETS[key];
}
