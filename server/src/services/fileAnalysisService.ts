/**
 * File Analysis Service
 *
 * Extracts text content or summaries from Drive files for AI context.
 * Supports:
 * - Text files: .txt, .md, .json, .csv, .html, etc.
 * - PDF: .pdf
 * - Word: .docx, .doc
 * - Excel: .xlsx, .xls
 * - PowerPoint: .pptx, .ppt
 * - Images: .png, .jpg, .jpeg (with OCR)
 */

import { logger } from '../lib/logger';
import { storageService } from './storageService';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB (increased for images and Office docs)
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB for images (OCR can handle larger)
const MAX_SUMMARY_CHARS = 4000;
const MAX_FILES_TO_ANALYZE = 5;

const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'json', 'csv', 'html', 'htm', 'xml', 'log',
  'yml', 'yaml', 'js', 'ts', 'tsx', 'jsx', 'css', 'scss', 'py', 'sh',
]);

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']);
const OFFICE_EXTENSIONS = new Set(['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'odt', 'ods', 'odp', 'rtf']);

function getExtension(name: string): string {
  const lastDot = name.lastIndexOf('.');
  return lastDot >= 0 ? name.slice(lastDot + 1).toLowerCase() : '';
}

function resolveStoragePath(file: { path?: string | null; url?: string | null }): string | null {
  // Prefer path; ensure it's not a URL (GCS may store object path or full URL)
  if (file.path && file.path.trim()) {
    const p = file.path.trim();
    // If path looks like a URL, extract object path for GCS
    if (p.startsWith('http://') || p.startsWith('https://')) {
      return storageService.extractPathFromUrl(p);
    }
    return p;
  }
  if (file.url && typeof file.url === 'string') {
    return storageService.extractPathFromUrl(file.url);
  }
  return null;
}

/** Use unpdf first in production (serverless-optimized); pdf-parse may fail on Cloud Run. */
const isProduction = process.env.NODE_ENV === 'production';

async function extractTextFromBuffer(
  buffer: Buffer,
  fileExtension: string,
  name: string
): Promise<string> {
  // Handle text files
  if (TEXT_EXTENSIONS.has(fileExtension)) {
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

  // Handle PDF files
  // Production (Cloud Run): use unpdf first (serverless-optimized; pdf-parse native modules may fail)
  // Local dev: try pdf-parse first, fallback to unpdf
  if (fileExtension === 'pdf') {
    const data = buffer instanceof Buffer ? new Uint8Array(buffer) : buffer;

    const tryUnpdf = async (): Promise<string | null> => {
      try {
        const { extractText, getDocumentProxy } = await import('unpdf');
        const pdf = await getDocumentProxy(data);
        const { text } = await extractText(pdf, { mergePages: true });
        const trimmed = (text || '').trim();
        return trimmed || null;
      } catch {
        return null;
      }
    };

    const tryPdfParse = async (): Promise<string | null> => {
      try {
        const { PDFParse } = await import('pdf-parse');
        const parser = new PDFParse({ data });
        const result = await parser.getText();
        await parser.destroy();
        const text = (result && typeof result === 'object' && 'text' in result ? (result as { text?: string }).text : '')?.trim() ?? '';
        return text || null;
      } catch {
        return null;
      }
    };

    // Production: unpdf first (works better on Cloud Run)
    const order = isProduction ? [tryUnpdf, tryPdfParse] : [tryPdfParse, tryUnpdf];
    const names = isProduction ? ['unpdf', 'pdf-parse'] : ['pdf-parse', 'unpdf'];

    for (let i = 0; i < order.length; i++) {
      try {
        const text = await order[i]();
        if (text) {
          const truncated = text.length > MAX_SUMMARY_CHARS
            ? text.slice(0, MAX_SUMMARY_CHARS) + '\n\n[... truncated ...]'
            : text;
          logger.info('PDF extraction succeeded', {
            operation: 'file_analysis_pdf',
            fileName: name,
            textLength: text.length,
            library: names[i],
            environment: isProduction ? 'production' : 'development',
          });
          return truncated;
        }
      } catch (err) {
        logger.warn('PDF extraction attempt failed', {
          operation: 'file_analysis_pdf',
          fileName: name,
          library: names[i],
          error: { message: err instanceof Error ? err.message : 'Unknown error' },
        });
      }
    }

    return `(PDF file: ${name} - text extraction unavailable. The file may be image-based; try exporting as text from the original application.)`;
  }

  // Handle Office documents (Word, Excel, PowerPoint)
  if (OFFICE_EXTENSIONS.has(fileExtension)) {
    try {
      const OfficeParser = await import('officeparser');
      const result = await OfficeParser.parseOffice(buffer, {
        outputErrorToConsole: false,
      });
      
      // Extract text from the parsed result
      let text = '';
      if (typeof result === 'string') {
        text = result;
      } else if (result && typeof result === 'object') {
        // officeparser returns different structures for different file types
        if ('text' in result && typeof result.text === 'string') {
          text = result.text;
        } else if ('content' in result && typeof result.content === 'string') {
          text = result.content;
        } else if (Array.isArray(result)) {
          // Some formats return arrays of text blocks
          text = result.map((item: unknown) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object' && 'text' in item) {
              return String((item as { text: unknown }).text);
            }
            return '';
          }).join('\n');
        } else {
          // Try to extract any text-like properties
          text = JSON.stringify(result).substring(0, MAX_SUMMARY_CHARS);
        }
      }
      
      const truncated = text.length > MAX_SUMMARY_CHARS
        ? text.slice(0, MAX_SUMMARY_CHARS) + '\n\n[... truncated ...]'
        : text;
      return truncated.trim() || `(${fileExtension.toUpperCase()} file: ${name} - no extractable text)`;
    } catch (err) {
      logger.warn('Office document extraction failed', {
        operation: 'file_analysis_office',
        fileName: name,
        fileType: fileExtension,
        error: { message: err instanceof Error ? err.message : 'Unknown error' },
      });
      return `(${fileExtension.toUpperCase()} file: ${name} - text extraction unavailable)`;
    }
  }

  // Handle images with OCR
  if (IMAGE_EXTENSIONS.has(fileExtension)) {
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng'); // English language
      
      try {
        const { data: { text } } = await worker.recognize(buffer);
        await worker.terminate();
        
        const truncated = text.length > MAX_SUMMARY_CHARS
          ? text.slice(0, MAX_SUMMARY_CHARS) + '\n\n[... truncated ...]'
          : text;
        return truncated.trim() || `(Image: ${name} - no text detected via OCR)`;
      } catch (ocrError) {
        await worker.terminate();
        throw ocrError;
      }
    } catch (err) {
      logger.warn('Image OCR failed', {
        operation: 'file_analysis_ocr',
        fileName: name,
        error: { message: err instanceof Error ? err.message : 'Unknown error' },
      });
      return `(Image: ${name} - OCR text extraction unavailable)`;
    }
  }

  return `(Unsupported file type: ${name} - ${fileExtension.toUpperCase()})`;
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
 * Supports: Text files, PDF, Word (.docx, .doc), Excel (.xlsx, .xls), 
 * PowerPoint (.pptx, .ppt), Images with OCR (.png, .jpg, .jpeg, etc.)
 * Limits: max 5 files, 2MB per file (5MB for images), 4000 chars per summary.
 */
export async function getFileSummaries(
  files: FileRecordForAnalysis[]
): Promise<FileAnalysisResult[]> {
  const results: FileAnalysisResult[] = [];

  const toProcess = files.slice(0, MAX_FILES_TO_ANALYZE);

  for (const file of toProcess) {
    try {
      const extension = getExtension(file.name);
      const isImage = IMAGE_EXTENSIONS.has(extension);
      const maxSize = isImage ? MAX_IMAGE_SIZE_BYTES : MAX_FILE_SIZE_BYTES;
      
      if (file.size > maxSize) {
        results.push({
          id: file.id,
          name: file.name,
          summary: `(File too large to analyze: ${file.name}, ${Math.round(file.size / 1024)} KB. Max size: ${Math.round(maxSize / 1024)} KB)`,
        });
        continue;
      }

      const storagePath = resolveStoragePath(file);
      if (!storagePath) {
        logger.warn('Could not resolve storage path for file', {
          operation: 'file_analysis_resolve',
          fileId: file.id,
          fileName: file.name,
          hasPath: !!file.path,
          hasUrl: !!file.url,
          pathPreview: file.path ? `${String(file.path).slice(0, 80)}...` : undefined,
        });
        results.push({
          id: file.id,
          name: file.name,
          summary: `(Could not locate file in storage: ${file.name})`,
        });
        continue;
      }

      let buffer: Buffer;
      try {
        buffer = await storageService.getFileBuffer(storagePath);
      } catch (storageErr) {
        const msg = storageErr instanceof Error ? storageErr.message : 'Unknown error';
        logger.warn('Failed to fetch file from storage', {
          operation: 'file_analysis_storage_fetch',
          fileId: file.id,
          fileName: file.name,
          storagePath: storagePath.slice(0, 100),
          provider: storageService.getProvider(),
          error: { message: msg },
        });
        results.push({
          id: file.id,
          name: file.name,
          summary: `(Could not fetch file from storage: ${file.name})`,
        });
        continue;
      }

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
