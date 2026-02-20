/**
 * Schema-guaranteed structured output for document extraction (e.g. invoice, receipt).
 * Used for automation: expense creation, categorization, workflows.
 */

import { z } from 'zod';

/** Single line item on an invoice or receipt */
export const InvoiceLineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().optional(),
  unitPrice: z.number().optional(),
  amount: z.number(),
});

/** Invoice or receipt extraction result */
export const InvoiceExtractionSchema = z.object({
  vendor: z.string().describe('Vendor or merchant name'),
  amount: z.number().describe('Total amount'),
  currency: z.string().optional().describe('Currency code e.g. USD'),
  date: z.string().optional().describe('Date of the document (ISO or readable)'),
  category: z.string().optional().describe('Suggested category e.g. Office Supplies'),
  lineItems: z.array(InvoiceLineItemSchema).optional().describe('Line items if present'),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type InvoiceLineItem = z.infer<typeof InvoiceLineItemSchema>;
export type InvoiceExtraction = z.infer<typeof InvoiceExtractionSchema>;

export type DocumentType = 'invoice' | 'receipt';
