/**
 * Phase 8 — Skill implementation registry (code-owned adapters).
 */
import type { AISkillExecutionPlan } from 'vssyl-shared';

export interface SkillImplementationContext {
  plan: AISkillExecutionPlan;
  userId: string;
  businessId?: string | null;
}

export interface SkillImplementationResult {
  output: Record<string, unknown>;
  groundingFailed?: boolean;
  schemaValidationFailed?: boolean;
  provider?: string;
  model?: string;
}

export type SkillImplementation = (
  ctx: SkillImplementationContext
) => Promise<SkillImplementationResult>;

const implementations = new Map<string, SkillImplementation>();

export function registerSkillImplementation(
  implementationKey: string,
  impl: SkillImplementation
): void {
  if (implementations.has(implementationKey)) {
    throw new Error(`Duplicate skill implementation: ${implementationKey}`);
  }
  implementations.set(implementationKey, impl);
}

export function getSkillImplementation(
  implementationKey: string
): SkillImplementation | undefined {
  return implementations.get(implementationKey);
}

export function clearSkillImplementationsForTests(): void {
  implementations.clear();
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export async function registerPilotImplementations(): Promise<void> {
  registerSkillImplementation(
    'impl.notebook_page_summary.v1',
    async ({ plan, userId }) => {
      const pageId = asString(plan.normalizedInput.pageId);
      if (!pageId) {
        return {
          output: {},
          schemaValidationFailed: true,
          groundingFailed: true,
        };
      }
      const { summarizePageImplementation } = await import(
        '../../services/notebook/notebookAIActionService.js'
      );
      const data = await summarizePageImplementation(pageId, userId);
      return {
        output: {
          summary: data.summary,
          keyDecisions: data.keyDecisions,
          openTasks: data.openTasks,
          risksAndFollowUps: data.risksAndFollowUps,
          warnings: data.warnings,
          citedSources: [`notebook.page:${pageId}`],
          uncertainties: data.warnings.filter((w) => /uncertain|missing|empty/i.test(w)),
        },
        groundingFailed: false,
        provider: 'openai',
        model: process.env.NOTEBOOK_AI_MODEL?.trim() || 'gpt-4o-mini',
      };
    }
  );

  registerSkillImplementation(
    'impl.notebook_action_extraction.v1',
    async ({ plan, userId }) => {
      const pageId = asString(plan.normalizedInput.pageId);
      if (!pageId) {
        return { output: {}, schemaValidationFailed: true, groundingFailed: true };
      }
      const selectedText = asString(plan.normalizedInput.selectedText);
      const { extractActionItemsImplementation } = await import(
        '../../services/notebook/notebookAIActionService.js'
      );
      const data = await extractActionItemsImplementation({ pageId, userId, selectedText });
      return {
        output: {
          proposals: data.proposals,
          warnings: data.warnings,
          unresolvedQuestions: data.warnings,
        },
        groundingFailed: false,
        provider: 'openai',
        model: process.env.NOTEBOOK_AI_MODEL?.trim() || 'gpt-4o-mini',
      };
    }
  );

  registerSkillImplementation(
    'impl.structured_document_extraction.v1',
    async ({ plan }) => {
      const documentText = asString(plan.normalizedInput.documentText);
      const documentType = asString(plan.normalizedInput.documentType);
      if (!documentText || (documentType !== 'invoice' && documentType !== 'receipt')) {
        return {
          output: { success: false, error: 'Invalid documentText or documentType' },
          schemaValidationFailed: true,
        };
      }
      const { extractInvoiceOrReceiptImplementation } = await import(
        '../../services/documentExtractionService.js'
      );
      const result = await extractInvoiceOrReceiptImplementation(documentText, documentType, {
        skipShadowRouting: true,
      });
      if (!result.success) {
        return {
          output: { success: false, error: result.error },
          groundingFailed: /short|invalid/i.test(result.error),
          provider: 'openai',
          model: 'gpt-4o',
        };
      }
      return {
        output: { success: true, data: result.data as unknown as Record<string, unknown> },
        groundingFailed: false,
        provider: 'openai',
        model: 'gpt-4o',
      };
    }
  );
}
