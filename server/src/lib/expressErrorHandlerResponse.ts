/**
 * Builds the JSON body and HTTP status for the global Express error handler.
 * Extracted for unit tests (prod 5xx must not leak internal messages).
 */
export interface ErrorLike {
  message?: string;
  stack?: string;
  status?: number;
  code?: string | number;
}

export function buildExpressErrorResponse(
  err: ErrorLike,
  isProd: boolean
): { status: number; body: { message: string; error?: string; code?: string | number } } {
  const status = typeof err.status === 'number' ? err.status : 500;
  const publicMessage =
    isProd && status >= 500 ? 'Internal Server Error' : err.message || 'Internal Server Error';
  const body: { message: string; error?: string; code?: string | number } = {
    message: publicMessage,
  };

  if (!isProd && err.stack) {
    body.error = err.stack;
  } else if (err.code !== undefined) {
    body.code = err.code;
  }

  return { status, body };
}
