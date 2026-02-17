/**
 * File Analysis Service
 *
 * Extracts text content or summaries from Drive files for AI context.
 * Pipeline: store in Drive → extract text → cap per-file (chunk-style) → send to AI.
 *
 * Production-style limits (aligned with ChatGPT/OpenAI recommendations):
 * - File size: 25 MB (PDF/Office/text), 5 MB (images). Never send raw binary; always extract → chunk → send.
 * - Per-file context: ~5 chunks × ~1k tokens ≈ 20k chars per file.
 * - Total file context is capped in DigitalLifeTwinCore (~15k tokens).
 *
 * Supports:
 * - Text files: .txt, .md, .json, .csv, .html, etc.
 * - PDF: .pdf
 * - Word: .docx, .doc
 * - Excel: .xlsx, .xls
 * - PowerPoint: .pptx, .ppt
 * - Images: .png, .jpg, .jpeg (with OCR)
 */

import { spawn } from 'child_process';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import sharp from 'sharp';
import { logger } from '../lib/logger';
import { storageService } from './storageService';

// File size limits (production-safe: 25 MB upload max, 5 MB images)
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB for PDFs, Office, text (ChatGPT-style max)
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB for images
// Per-file context: ~1k tokens per chunk, 5 chunks max → ~20k chars. Total file context capped in Core.
const CHUNK_SIZE_CHARS = 4000; // ~1000 tokens
const MAX_CHUNKS_PER_FILE = 5;
const MAX_SUMMARY_CHARS = CHUNK_SIZE_CHARS * MAX_CHUNKS_PER_FILE; // 20_000 chars (~5k tokens per file)
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

/** Max PDF pages to OCR when text extraction returns nothing (image-based PDF). */
const MAX_PDF_OCR_PAGES = 5;
/** If extracted PDF text is below this, treat as scanned and try OCR. */
const MIN_PDF_TEXT_CHARS_FOR_SUCCESS = 500;

/**
 * When PDF has no extractable text, render pages to images and run OCR (image-based/scanned PDF).
 * Uses pdfjs-dist + canvas + tesseract. Returns null if any step fails (e.g. canvas not installed).
 */
async function tryPdfOcrFallback(buffer: Buffer, name: string): Promise<string | null> {
  try {
    // Try to load canvas - it may not be available in production if native build failed
    let Canvas: typeof import('canvas');
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      Canvas = require('canvas');
      if (!Canvas || !Canvas.createCanvas) {
        logger.warn('Canvas module loaded but createCanvas not available', {
          operation: 'file_analysis_pdf_ocr',
          fileName: name,
        });
        return null;
      }
    } catch (canvasErr) {
      logger.warn('Canvas module not available (OCR fallback disabled)', {
        operation: 'file_analysis_pdf_ocr',
        fileName: name,
        error: { message: canvasErr instanceof Error ? canvasErr.message : 'Unknown error' },
      });
      return null; // Gracefully skip OCR if canvas isn't available
    }

    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    function createNodeCanvasFactory() {
      return {
        create(width: number, height: number) {
          const canvas = Canvas.createCanvas(width, height);
          return { canvas, context: canvas.getContext('2d') };
        },
        reset(canvasAndContext: { canvas: { width: number; height: number } }, width: number, height: number) {
          canvasAndContext.canvas.width = width;
          canvasAndContext.canvas.height = height;
        },
        destroy(canvasAndContext: { canvas: { width: number; height: number }; context: unknown }) {
          canvasAndContext.canvas.width = 0;
          canvasAndContext.canvas.height = 0;
          (canvasAndContext as Record<string, unknown>).canvas = null;
          (canvasAndContext as Record<string, unknown>).context = null;
        },
      };
    }

    const data = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pagesToOcr = Math.min(MAX_PDF_OCR_PAGES, numPages);
    const textParts: string[] = [];

    for (let p = 1; p <= pagesToOcr; p++) {
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 2.0 });
      const factory = createNodeCanvasFactory();
      const canvasAndContext = factory.create(viewport.width, viewport.height);
      const renderContext = {
        canvasContext: canvasAndContext.context,
        viewport,
        canvasFactory: factory,
        canvas: canvasAndContext.canvas,
      };
      const renderTask = page.render(renderContext as unknown as Parameters<typeof page.render>[0]);
      await renderTask.promise;
      const imageBuffer = canvasAndContext.canvas.toBuffer('image/png');
      factory.destroy(canvasAndContext);

      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      try {
        const { data: { text } } = await worker.recognize(imageBuffer);
        if (text && text.trim()) textParts.push(`[Page ${p}]\n${text.trim()}`);
      } finally {
        await worker.terminate();
      }
    }

    if (textParts.length === 0) return null;
    const full = textParts.join('\n\n');
    const truncated = full.length > MAX_SUMMARY_CHARS
      ? full.slice(0, MAX_SUMMARY_CHARS) + '\n\n[... truncated ...]'
      : full;
    logger.info('PDF OCR fallback succeeded', {
      operation: 'file_analysis_pdf_ocr',
      fileName: name,
      pagesOcred: textParts.length,
      textLength: full.length,
    });
    return truncated;
  } catch (err) {
    logger.warn('PDF OCR fallback failed (image-based PDF may be unreadable)', {
      operation: 'file_analysis_pdf_ocr',
      fileName: name,
      error: { message: err instanceof Error ? err.message : 'Unknown error' },
    });
    return null;
  }
}

/**
 * Parse CSV content and format as markdown table for structured AI context.
 * Handles simple CSV (comma-separated, optional quoted fields). Caps output by maxChars.
 */
function parseCsvToMarkdownTable(csv: string, maxChars: number): string | null {
  try {
    const lines = csv.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length === 0) return null;
    const rows: string[][] = [];
    for (const line of lines) {
      const row: string[] = [];
      let i = 0;
      while (i < line.length) {
        if (line[i] === '"') {
          i++;
          let cell = '';
          while (i < line.length) {
            if (line[i] === '"') {
              i++;
              if (line[i] === '"') {
                cell += '"';
                i++;
              } else break;
            } else {
              cell += line[i];
              i++;
            }
          }
          row.push(cell.trim());
        } else {
          const comma = line.indexOf(',', i);
          const end = comma >= 0 ? comma : line.length;
          row.push(line.slice(i, end).trim());
          i = comma >= 0 ? comma + 1 : line.length;
        }
      }
      rows.push(row);
    }
    if (rows.length === 0) return null;
    const colCount = Math.max(...rows.map((r) => r.length));
    const header = rows[0];
    const headerCells = header.concat(Array(colCount - header.length).fill(''));
    const sep = '| ' + headerCells.map(() => '---').join(' | ') + ' |';
    let out = '| ' + headerCells.join(' | ') + ' |\n' + sep + '\n';
    for (let r = 1; r < rows.length && out.length < maxChars - 50; r++) {
      const cells = rows[r].concat(Array(colCount - rows[r].length).fill(''));
      out += '| ' + cells.join(' | ') + ' |\n';
    }
    if (out.length > maxChars) {
      out = out.slice(0, maxChars - 20) + '\n\n[... truncated ...]';
    }
    return out.trim();
  } catch {
    return null;
  }
}

async function extractTextFromBuffer(
  buffer: Buffer,
  fileExtension: string,
  name: string
): Promise<string> {
  // Handle text files
  if (TEXT_EXTENSIONS.has(fileExtension)) {
    try {
      let text = buffer.toString('utf-8').trim();
      if (!text) return `(Empty file: ${name})`;
      // Optional: for CSV, parse and format as markdown table for structured context
      if (fileExtension === 'csv') {
        const table = parseCsvToMarkdownTable(text, MAX_SUMMARY_CHARS);
        if (table) return table;
      }
      const truncated = text.length > MAX_SUMMARY_CHARS
        ? text.slice(0, MAX_SUMMARY_CHARS) + '\n\n[... truncated ...]'
        : text;
      return truncated;
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

    let extractedText: string | null = null;
    let extractionLibrary: string | null = null;

    for (let i = 0; i < order.length; i++) {
      try {
        const text = await order[i]();
        if (text) {
          extractedText = text;
          extractionLibrary = names[i];
          break;
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

    // Log extraction result (high-signal for Cloud Run debugging)
    const extractedTextChars = extractedText ? extractedText.length : 0;
    const isScannedHeuristic = extractedTextChars < MIN_PDF_TEXT_CHARS_FOR_SUCCESS;
    logger.info('PDF extraction result', {
      operation: 'file_analysis_pdf_result',
      fileName: name,
      extractedTextChars,
      extractionLibrary: extractionLibrary ?? 'none',
      isScannedHeuristic,
      bufferBytes: buffer.length,
    });

    // If we got enough text, use it
    if (extractedText && extractedTextChars >= MIN_PDF_TEXT_CHARS_FOR_SUCCESS) {
      const truncated = extractedText.length > MAX_SUMMARY_CHARS
        ? extractedText.slice(0, MAX_SUMMARY_CHARS) + '\n\n[... truncated ...]'
        : extractedText;
      return truncated;
    }

    // No text or very little text: try OCR (image-based/scanned PDF)
    logger.info('PDF text insufficient, attempting OCR fallback', {
      operation: 'file_analysis_pdf_ocr_attempt',
      fileName: name,
      extractedTextChars,
    });
    const ocrText = await tryPdfOcrFallback(buffer, name);
    if (ocrText) {
      logger.info('PDF OCR fallback succeeded', {
        operation: 'file_analysis_pdf_ocr_success',
        fileName: name,
        ocrTextChars: ocrText.length,
      });
      return ocrText;
    }

    return `(No text could be extracted from "${name}" — the PDF is likely scanned or image-only. STRICT INSTRUCTION: Say only that you could not read this file's contents and suggest a text-based PDF or that they describe the document. You must NOT mention: file size, "too large", "exceeds", "processing capabilities", or "limits". The problem is extraction only.)`;
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

import type { FileIssueCode } from '../ai/types/fileIssues';

export interface FileAnalysisResult {
  id: string;
  name: string;
  summary: string;
  truncated?: boolean;
  /** Set when summary describes a failure; use for fileIssues in API response. */
  fileIssueCode?: FileIssueCode;
}

/** Vision API: image part for multimodal prompts (base64 + mime for OpenAI/Anthropic). */
export interface VisionImagePart {
  mimeType: string;
  dataBase64: string;
  fileName: string;
}

const EXT_TO_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
};

/** Max image parts to send to vision API (token/size safety). */
const DEFAULT_MAX_VISION_PARTS = 5;
/** Max size per image for vision (5 MB). */
const DEFAULT_MAX_VISION_IMAGE_BYTES = 5 * 1024 * 1024;
/** Optional: max dimension (longest side) for resizing; reduces tokens/cost. */
const VISION_IMAGE_MAX_DIMENSION = 1600;
/** JPEG quality when converting for vision (balance quality vs size). */
const VISION_IMAGE_JPEG_QUALITY = 85;

async function resizeImageForVision(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  maxDimension: number = VISION_IMAGE_MAX_DIMENSION,
  maxBytes: number = DEFAULT_MAX_VISION_IMAGE_BYTES
): Promise<{ buffer: Buffer; mimeType: string }> {
  try {
    const meta = await sharp(buffer).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    const needsResize = w > maxDimension || h > maxDimension;
    if (!needsResize && buffer.length <= maxBytes) return { buffer, mimeType };
    let outBuffer = await sharp(buffer)
      .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: VISION_IMAGE_JPEG_QUALITY })
      .toBuffer();
    if (outBuffer.length > maxBytes) {
      const scale = Math.sqrt(maxBytes / outBuffer.length);
      const smallerDim = Math.max(256, Math.floor(maxDimension * scale));
      outBuffer = await sharp(buffer)
        .resize(smallerDim, smallerDim, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: Math.max(60, VISION_IMAGE_JPEG_QUALITY - 20) })
        .toBuffer();
    }
    if (needsResize || outBuffer.length < buffer.length) {
      logger.debug('[VISION_PIPELINE] image resized for vision', {
        operation: 'vision_image_resize',
        fileName,
        originalBytes: buffer.length,
        resizedBytes: outBuffer.length,
      });
    }
    return { buffer: outBuffer, mimeType: 'image/jpeg' };
  } catch (err) {
    logger.debug('[VISION_PIPELINE] image resize skipped (sharp failed)', {
      operation: 'vision_image_resize',
      fileName,
      error: { message: err instanceof Error ? err.message : 'Unknown error' },
    });
    return { buffer, mimeType };
  }
}

/**
 * Get image parts for Vision API: fetch image files from storage, return base64 + mime.
 * Used so the model can "see" attached images (photos, screenshots) instead of only OCR text.
 * Caller should pass only image-type files; non-image entries are skipped.
 */
export async function getVisionImageParts(
  files: FileRecordForAnalysis[],
  maxParts: number = DEFAULT_MAX_VISION_PARTS,
  maxSizePerPartBytes: number = DEFAULT_MAX_VISION_IMAGE_BYTES
): Promise<VisionImagePart[]> {
  const VISION_PIPELINE = '[VISION_PIPELINE]';
  const parts: VisionImagePart[] = [];
  for (const file of files) {
    if (parts.length >= maxParts) break;
    const extension = getExtension(file.name);
    if (!IMAGE_EXTENSIONS.has(extension)) {
      logger.debug(`${VISION_PIPELINE} vision skip`, {
        operation: 'vision_image_parts',
        skipReason: 'unsupported_mime',
        fileName: file.name,
        extension,
      });
      continue;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      logger.info(`${VISION_PIPELINE} vision skip (too large to process)`, {
        operation: 'vision_image_parts',
        skipReason: 'too_large',
        fileName: file.name,
        size: file.size,
        max: MAX_FILE_SIZE_BYTES,
      });
      continue;
    }
    const storagePath = resolveStoragePath(file);
    if (!storagePath) {
      logger.debug(`${VISION_PIPELINE} vision skip (no path)`, {
        operation: 'vision_image_parts',
        skipReason: 'no_path',
        fileName: file.name,
      });
      continue;
    }
    try {
      const t0_fetch = Date.now();
      let buffer = await storageService.getFileBuffer(storagePath);
      const fetch_ms = Date.now() - t0_fetch;
      let mimeType = EXT_TO_MIME[extension] ?? 'image/jpeg';
      const t0_resize = Date.now();
      const resized = await resizeImageForVision(buffer, mimeType, file.name, VISION_IMAGE_MAX_DIMENSION, maxSizePerPartBytes);
      buffer = resized.buffer;
      mimeType = resized.mimeType;
      const resize_ms = Date.now() - t0_resize;
      if (buffer.length > maxSizePerPartBytes) {
        logger.info(`${VISION_PIPELINE} vision skip (resized still too large)`, {
          operation: 'vision_image_parts',
          skipReason: 'too_large_after_resize',
          fileName: file.name,
          size: buffer.length,
          max: maxSizePerPartBytes,
        });
        continue;
      }
      const t0_base64 = Date.now();
      const dataBase64 = buffer.toString('base64');
      const base64_ms = Date.now() - t0_base64;
      parts.push({
        mimeType,
        dataBase64,
        fileName: file.name,
      });
      logger.info(`${VISION_PIPELINE} vision image part added`, {
        operation: 'vision_image_parts',
        fileName: file.name,
        sizeBytes: buffer.length,
        mimeType,
        fetch_ms,
        resize_ms,
        base64_ms,
        dataBase64Length: dataBase64.length,
      });
    } catch (err) {
      logger.warn(`${VISION_PIPELINE} vision skip (getFileBuffer failed)`, {
        operation: 'vision_image_parts',
        skipReason: 'getFileBuffer_failed',
        fileName: file.name,
        error: { message: err instanceof Error ? err.message : 'Unknown error' },
      });
    }
  }
  return parts;
}

/** Phase 3 PDF vision: max pages to render per PDF, DPI, timeout, and per-image size cap */
const PDF_VISION_MAX_PAGES_DEFAULT = 2;
const PDF_VISION_DPI = 150;
const PDF_VISION_TIMEOUT_MS = 10000;
const PDF_VISION_MAX_BYTES_PER_IMAGE = 5 * 1024 * 1024;
/** Minimum summary length to consider PDF "text-based" (skip vision for it) */
const PDF_TEXT_BASED_SUMMARY_LENGTH = 500;

/**
 * Render PDF pages to PNGs via pdftoppm (poppler-utils), then return as VisionImagePart[].
 * Used when PDF has little/no extractable text (image-based PDF). Writes to OS tmp dir.
 * @param pdfBuffer - raw PDF bytes
 * @param fileName - original file name for part labels
 * @param options - maxPages (default 2), maxPartBytes (default 5MB), timeoutMs (default 10s), dpi (default 150)
 * @returns VisionImagePart[] (base64 data URLs); empty if pdftoppm missing or fails
 */
export async function renderPdfPagesToVisionParts(
  pdfBuffer: Buffer,
  fileName: string,
  options: {
    maxPages?: number;
    maxPartBytes?: number;
    timeoutMs?: number;
    dpi?: number;
  } = {}
): Promise<VisionImagePart[]> {
  const {
    maxPages = PDF_VISION_MAX_PAGES_DEFAULT,
    maxPartBytes = PDF_VISION_MAX_BYTES_PER_IMAGE,
    timeoutMs = PDF_VISION_TIMEOUT_MS,
    dpi = PDF_VISION_DPI,
  } = options;
  const prefix = `pdfvision_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const tmpDir = tmpdir();
  const pdfPath = join(tmpDir, `${prefix}.pdf`);
  const outPrefix = join(tmpDir, prefix);
  const parts: VisionImagePart[] = [];
  const toClean: string[] = [pdfPath];

  try {
    await writeFile(pdfPath, pdfBuffer, { flag: 'w' });
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(
        'pdftoppm',
        ['-png', '-r', String(dpi), '-f', '1', '-l', String(maxPages), pdfPath, outPrefix],
        { stdio: ['ignore', 'pipe', 'pipe'] }
      );
      const t = setTimeout(() => {
        proc.kill('SIGKILL');
        reject(new Error('pdftoppm timeout'));
      }, timeoutMs);
      proc.on('error', (err) => {
        clearTimeout(t);
        reject(err);
      });
      proc.on('close', (code) => {
        clearTimeout(t);
        if (code === 0) resolve();
        else reject(new Error(`pdftoppm exited ${code}`));
      });
    });

    for (let p = 1; p <= maxPages; p++) {
      const pngPath = `${outPrefix}-${p}.png`;
      toClean.push(pngPath);
      try {
        const buf = await readFile(pngPath);
        if (buf.length > maxPartBytes) {
          logger.info('[VISION_PIPELINE] pdf vision skip (page too large)', {
            operation: 'pdf_vision_page_skip',
            fileName,
            page: p,
            sizeBytes: buf.length,
            maxBytes: maxPartBytes,
          });
          continue;
        }
        const b64 = buf.toString('base64');
        const mime = 'image/png';
        parts.push({
          mimeType: mime,
          dataBase64: b64,
          fileName: `${fileName} (page ${p})`,
        });
      } catch {
        // page file missing or unreadable
        break;
      }
    }
  } catch (err) {
    logger.info('[VISION_PIPELINE] pdf vision render failed (pdftoppm missing or error)', {
      operation: 'pdf_vision_render',
      fileName,
      error: { message: err instanceof Error ? err.message : 'Unknown error' },
    });
  } finally {
    for (const p of toClean) {
      try {
        await unlink(p);
      } catch {
        // ignore
      }
    }
    // pdftoppm may write page-1.png, page-2.png; we already added those to toClean
  }
  return parts;
}

/**
 * Get vision image parts for a single PDF when it is image-based (short/no text summary).
 * Fetches PDF from storage, renders up to maxPages pages (respecting remaining slots).
 * @param file - file record with path or url for resolveStoragePath
 * @param summary - existing text summary; if length >= 500 and not starting with "(", skip (text-based PDF)
 * @param currentPartCount - current visionImageParts.length
 * @param maxTotalParts - cap (e.g. 5)
 * @returns VisionImagePart[] to append; empty if not PDF, text-based, no slots, or error
 */
export async function getPdfVisionParts(
  file: FileRecordForAnalysis,
  summary: string | undefined,
  currentPartCount: number,
  maxTotalParts: number
): Promise<VisionImagePart[]> {
  const name = (file.name || '').toLowerCase();
  if (!name.endsWith('.pdf')) return [];
  if (currentPartCount >= maxTotalParts) return [];
  const summaryLen = (summary ?? '').length;
  const looksTextBased = summaryLen >= PDF_TEXT_BASED_SUMMARY_LENGTH && !(summary ?? '').startsWith('(');
  if (looksTextBased) return [];

  const storagePath = resolveStoragePath(file);
  if (!storagePath) return [];
  let buffer: Buffer;
  try {
    buffer = await storageService.getFileBuffer(storagePath);
  } catch {
    return [];
  }
  const remainingSlots = maxTotalParts - currentPartCount;
  const maxPages = Math.min(PDF_VISION_MAX_PAGES_DEFAULT, remainingSlots);
  if (maxPages < 1) return [];

  return renderPdfPagesToVisionParts(buffer, file.name || 'document.pdf', {
    maxPages,
    maxPartBytes: PDF_VISION_MAX_BYTES_PER_IMAGE,
    timeoutMs: PDF_VISION_TIMEOUT_MS,
    dpi: PDF_VISION_DPI,
  });
}

/**
 * Extract text summaries from files for AI context.
 * Supports: Text files, PDF, Word (.docx, .doc), Excel (.xlsx, .xls), 
 * PowerPoint (.pptx, .ppt), Images with OCR (.png, .jpg, .jpeg, etc.)
 * Limits: max 5 files, 25MB per file (5MB for images), ~20k chars per file (~5 chunks × 1k tokens).
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

      logger.info('File analysis starting', {
        operation: 'file_analysis_start',
        fileId: file.id,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type ?? extension,
        extension,
      });

      if (file.size > maxSize) {
        results.push({
          id: file.id,
          name: file.name,
          summary: `(File exceeds size limit: ${file.name}, ${Math.round(file.size / 1024)} KB. Max: ${Math.round(maxSize / 1024)} KB)`,
          fileIssueCode: 'FILE_TOO_LARGE_POLICY',
        });
        continue;
      }

      // Skip fetch + OCR for image files: vision pipeline will send image to model; avoid double GCS fetch and heavy OCR
      if (isImage) {
        results.push({
          id: file.id,
          name: file.name,
          summary: '(Image attached; vision will be used to describe it.)',
        });
        logger.info('File analysis skipped (image – vision path)', {
          operation: 'file_analysis_skip_image',
          fileId: file.id,
          fileName: file.name,
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
          summary: `(File not found in storage: ${file.name})`,
          fileIssueCode: 'FILE_NOT_IN_STORAGE',
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
          summary: `(Could not load file from storage: ${file.name})`,
          fileIssueCode: 'FILE_NOT_FETCHABLE_FROM_STORAGE',
        });
        continue;
      }

      const summary = await extractTextFromBuffer(buffer, extension, file.name);

      const extractedTextChars = summary.startsWith('(') ? 0 : summary.length;
      const extractedTextIsEmpty = extractedTextChars < MIN_PDF_TEXT_CHARS_FOR_SUCCESS;
      logger.info('File analysis complete', {
        operation: 'file_analysis_complete',
        fileId: file.id,
        fileName: file.name,
        summaryLength: summary.length,
        extractedTextChars,
        extractedTextIsEmpty,
        hasErrorPrefix: summary.startsWith('('),
      });

      results.push({
        id: file.id,
        name: file.name,
        summary,
        truncated: summary.includes('[... truncated ...]'),
        fileIssueCode: summary.startsWith('(') ? 'NO_TEXT_EXTRACTED' : undefined,
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
        summary: `(Text could not be extracted from file: ${file.name})`,
        fileIssueCode: 'NO_TEXT_EXTRACTED',
      });
    }
  }

  return results;
}
