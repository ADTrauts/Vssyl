/**
 * File Analysis Service
 *
 * Extracts text content or summaries from Drive files for AI context.
 * Supports plain text, markdown, JSON, CSV, HTML, and PDF.
 */

import { logger } from '../lib/logger';
import { storageService } from './storageService';

const MAX_FILE_SIZE_BYTES = 500 * 1024; // 500 KB
const MAX_SUMMARY_CHARS = 4000;
const MAX_FILES_TO_ANALYZE = 5;

const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'json', 'csv', 'html', 'htm', 'xml', 'log',
  'yml', 'yaml', 'js', 'ts', 'tsx', 'jsx', 'css', 'scss', 'py', 'sh',
]);

function getExtension(name: string): string {
  const lastDot = name.lastIndexOf('.');
  return lastDot >= 0 ? name.slice(lastDot + 1).toLowerCase() : '';
}

function resolveStoragePath(file: { path?: string | null; url?: string | null }): string | null {
  if (file.path && file.path.trim()) {
    return file.path;
  }
  if (file.url && typeof file.url === 'string') {
    return storageService.extractPathFromUrl(file.url);
  }
  return null;
}

async function extractTextFromBuffer(
  buffer: Buffer,
  extension: string,
  name: string
): Promise<string> {
  if (TEXT_EXTENSIONS.has(extension)) {
    try {
      const text = buffer.toString('utf-8');
      const truncated = text.length > MAX_SUMMARY_CHARS
        ? text.slice(0, MAX_SUMMARY_CHARS) + '\n\n[... truncated ...]'
        : text;
      return truncated.trim() || `(Empty file: ${name})`;
    } catch {
      return `(Could not decode text from ${name})`;
    }
  }

  if (extension === 'pdf') {
    try {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText({ first: 10 });
      await parser.destroy();
      const text = (result && typeof result === 'object' && 'text' in result ? (result as { text?: string }).text : '')?.trim() ?? '';
      const truncated = text.length > MAX_SUMMARY_CHARS
        ? text.slice(0, MAX_SUMMARY_CHARS) + '\n\n[... truncated ...]'
        : text;
      return truncated || `(PDF with no extractable text: ${name})`;
    } catch (err) {
      logger.warn('PDF extraction failed', {
        operation: 'file_analysis_pdf',
        fileName: name,
        error: { message: err instanceof Error ? err.message : 'Unknown error' },
      });
      return `(PDF file: ${name} - text extraction unavailable)`;
    }
  }

  return `(Binary or unsupported file type: ${name})`;
}

export interface FileRecordForAnalysis {
  id: string;
  name: string;
  path?: string | null;
  url?: string | null;
  size: number;
  type?: string | null;
}

export interface FileAnalysisResult {
  id: string;
  name: string;
  summary: string;
  truncated?: boolean;
}

/**
 * Extract text summaries from files for AI context.
 * Limits: max 5 files, 500KB per file, 4000 chars per summary.
 */
export async function getFileSummaries(
  files: FileRecordForAnalysis[]
): Promise<FileAnalysisResult[]> {
  const results: FileAnalysisResult[] = [];

  const toProcess = files.slice(0, MAX_FILES_TO_ANALYZE);

  for (const file of toProcess) {
    try {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        results.push({
          id: file.id,
          name: file.name,
          summary: `(File too large to analyze: ${file.name}, ${Math.round(file.size / 1024)} KB)`,
        });
        continue;
      }

      const storagePath = resolveStoragePath(file);
      if (!storagePath) {
        results.push({
          id: file.id,
          name: file.name,
          summary: `(Could not locate file: ${file.name})`,
        });
        continue;
      }

      const buffer = await storageService.getFileBuffer(storagePath);
      const extension = getExtension(file.name);
      const summary = await extractTextFromBuffer(buffer, extension, file.name);

      results.push({
        id: file.id,
        name: file.name,
        summary,
        truncated: summary.includes('[... truncated ...]'),
      });
    } catch (err) {
      logger.warn('File analysis failed', {
        operation: 'file_analysis',
        fileId: file.id,
        fileName: file.name,
        error: { message: err instanceof Error ? err.message : 'Unknown error' },
      });
      results.push({
        id: file.id,
        name: file.name,
        summary: `(Could not analyze file: ${file.name})`,
      });
    }
  }

  return results;
}
