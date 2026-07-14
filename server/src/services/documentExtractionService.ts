/**
 * Document extraction service: extract structured data (e.g. invoice/receipt) from document text
 * using schema-guaranteed output. Validates with Zod.
 *
 * Phase 8B: product callers use Skill canonical entry. Domain implementation below is Skill-owned.
 */

import { InvoiceExtractionSchema, type InvoiceExtraction, type DocumentType } from '../ai/types/documentExtraction';
import { logger } from '../lib/logger';

const EXTRACTION_MODEL = 'gpt-4o';

/**
 * Domain implementation (Skill runner observes/routers). Prefer Skill canonical entry for products.
 */
export async function extractInvoiceOrReceiptImplementation(
  documentText: string,
  documentType: DocumentType,
  options?: { skipShadowRouting?: boolean }
): Promise<{ success: true; data: InvoiceExtraction } | { success: false; error: string }> {
  if (!documentText || documentText.trim().length < 10) {
    return { success: false, error: 'Document text is too short to extract from.' };
  }

  const prompt = `Extract structured data from this ${documentType}. Return ONLY a single JSON object with no markdown or extra text.
Use this exact shape:
{
  "vendor": "string - merchant/vendor name",
  "amount": number - total amount,
  "currency": "string optional e.g. USD",
  "date": "string optional - document date",
  "category": "string optional - suggested category e.g. Office Supplies",
  "lineItems": [{"description": "string", "quantity": number optional, "unitPrice": number optional, "amount": number}] optional,
  "invoiceNumber": "string optional",
  "notes": "string optional"
}

Document text:
---
${documentText.slice(0, 12000)}
---`;

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'OpenAI API key not configured.' };
    }

    if (!options?.skipShadowRouting) {
      try {
        const { shadowRouteForSpecializedPath } = await import('../ai/routing/shadowRouting');
        shadowRouteForSpecializedPath({
          capability: 'STRUCTURED_EXTRACTION',
          currentProvider: 'openai',
          currentModel: EXTRACTION_MODEL,
          surface: 'DOCUMENT_EXTRACTION',
        });
      } catch {
        /* shadow never blocks extraction */
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EXTRACTION_MODEL,
        messages: [
          {
            role: 'system',
            content: `You extract ${documentType} data and return only valid JSON matching the requested schema. No other text.`,
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      await logger.warn('OpenAI extraction API error', {
        operation: 'document_extraction_api_error',
        status: response.status,
        body: errText.slice(0, 200),
      });
      return { success: false, error: `Extraction API error: ${response.status}` };
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return { success: false, error: 'No extraction content in response.' };
    }

    const parsed = JSON.parse(content) as Record<string, unknown>;
    const result = InvoiceExtractionSchema.safeParse(parsed);
    if (!result.success) {
      await logger.warn('Document extraction schema validation failed', {
        operation: 'document_extraction_validation',
        errors: result.error.flatten(),
      });
      return { success: false, error: 'Extraction did not match expected schema.' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await logger.error('Document extraction failed', {
      operation: 'document_extraction_error',
      error: { message },
    });
    return { success: false, error: message };
  }
}

/**
 * @deprecated Prefer Skill canonical entry. Compatibility wrapper → Skill runner when userId known.
 * Falls back to domain implementation only when Skill entry is unavailable (tests without user).
 */
export async function extractInvoiceOrReceipt(
  documentText: string,
  documentType: DocumentType,
  opts?: { userId?: string; businessId?: string | null; preferSkill?: boolean }
): Promise<{ success: true; data: InvoiceExtraction } | { success: false; error: string }> {
  if (opts?.preferSkill !== false && opts?.userId) {
    const { runStructuredDocumentExtractionSkill } = await import(
      '../ai/skills/skillCanonicalEntry.js'
    );
    return runStructuredDocumentExtractionSkill({
      documentText,
      documentType,
      userId: opts.userId,
      businessId: opts.businessId,
    });
  }
  return extractInvoiceOrReceiptImplementation(documentText, documentType, {
    skipShadowRouting: false,
  });
}
