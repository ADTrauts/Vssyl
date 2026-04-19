/**
 * Last-resort sink when structured `logger` throws (e.g. transport failure).
 * Avoids throwing; does not log secrets — only failure context and safe summaries.
 */
export function logWhenLoggerFails(
  context: string,
  logError: unknown,
  originalError?: unknown
): void {
  try {
    const logMsg = logError instanceof Error ? logError.message : String(logError);
    const orig =
      originalError === undefined
        ? ''
        : originalError instanceof Error
          ? originalError.message
          : String(originalError);
    process.stderr.write(`[${context}] logger failed: ${logMsg}${orig ? ` | original: ${orig}` : ''}\n`);
  } catch {
    // Absolute last resort — ignore
  }
}
