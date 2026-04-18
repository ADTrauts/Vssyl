/**
 * Minimal typings for dynamic `import('tesseract.js')` (package ships without bundled .d.ts in some versions).
 */
declare module 'tesseract.js' {
  export interface RecognizeData {
    text: string;
  }

  export interface RecognizeResult {
    data: RecognizeData;
  }

  export interface TesseractWorker {
    recognize(image: Buffer): Promise<RecognizeResult>;
    terminate(): Promise<void>;
  }

  export function createWorker(languages?: string, oem?: number, options?: Record<string, unknown>): Promise<TesseractWorker>;
}
