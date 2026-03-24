import { unzipSync } from 'fflate';
import { logger } from '../lib/logger';

/** Guardrails for zip bombs and trivially unsafe layouts. */
const MAX_UNCOMPRESSED_BYTES = 200 * 1024 * 1024;
const MAX_FILE_COUNT = 5000;
const MAX_SINGLE_FILE_BYTES = 50 * 1024 * 1024;

export type BaselineScanStatus = 'PASSED' | 'FAILED';

export interface BaselineScanOutcome {
  scanStatus: BaselineScanStatus;
  scanSummary: Record<string, unknown>;
}

/**
 * Baseline (internal) scanner: structure, path safety, size limits, HTML entry presence.
 * External / pluggable scanners run separately and can update the same artifact row later.
 */
export function runBaselineZipScan(zipBuffer: Buffer, context?: { objectPath?: string }): BaselineScanOutcome {
  const baseMeta = {
    scanner: 'baseline',
    engine: 'fflate',
    pipeline: 'hybrid_internal',
    scannedAt: new Date().toISOString(),
    objectPath: context?.objectPath,
  };

  try {
    const u8 = new Uint8Array(zipBuffer);
    const files = unzipSync(u8);
    const names = Object.keys(files);

    if (names.length === 0) {
      return {
        scanStatus: 'FAILED',
        scanSummary: { ...baseMeta, reason: 'empty_zip' },
      };
    }

    if (names.length > MAX_FILE_COUNT) {
      return {
        scanStatus: 'FAILED',
        scanSummary: {
          ...baseMeta,
          reason: 'too_many_entries',
          fileCount: names.length,
          maxFileCount: MAX_FILE_COUNT,
        },
      };
    }

    let uncompressedTotal = 0;
    for (const name of names) {
      if (
        name.includes('..') ||
        name.startsWith('/') ||
        name.startsWith('\\') ||
        name.includes('\0')
      ) {
        return {
          scanStatus: 'FAILED',
          scanSummary: { ...baseMeta, reason: 'unsafe_path', path: name },
        };
      }
      const len = files[name].length;
      if (len > MAX_SINGLE_FILE_BYTES) {
        return {
          scanStatus: 'FAILED',
          scanSummary: {
            ...baseMeta,
            reason: 'entry_too_large',
            path: name,
            maxSingleFileBytes: MAX_SINGLE_FILE_BYTES,
          },
        };
      }
      uncompressedTotal += len;
      if (uncompressedTotal > MAX_UNCOMPRESSED_BYTES) {
        return {
          scanStatus: 'FAILED',
          scanSummary: {
            ...baseMeta,
            reason: 'uncompressed_total_exceeded',
            uncompressedTotal,
            maxUncompressedBytes: MAX_UNCOMPRESSED_BYTES,
          },
        };
      }
    }

    const hasHtml = names.some(n => /\.html?$/i.test(n));
    if (!hasHtml) {
      return {
        scanStatus: 'FAILED',
        scanSummary: {
          ...baseMeta,
          reason: 'no_html_entry',
          samplePaths: names.slice(0, 30),
        },
      };
    }

    return {
      scanStatus: 'PASSED',
      scanSummary: {
        ...baseMeta,
        checks: [
          'zip_parse',
          'path_traversal_guard',
          'size_limits',
          'html_entry_present',
        ],
        fileCount: names.length,
        uncompressedBytes: uncompressedTotal,
      },
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.warn('Baseline zip scan threw', {
      operation: 'module_artifact_baseline_scan',
      error: { message: err.message, stack: err.stack },
    });
    return {
      scanStatus: 'FAILED',
      scanSummary: {
        ...baseMeta,
        reason: 'unzip_error',
        message: err.message,
      },
    };
  }
}
