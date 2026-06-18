export type BusinessServiceErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'invalid'
  | 'conflict';

export class BusinessServiceError extends Error {
  readonly code: BusinessServiceErrorCode;
  readonly httpStatus: number;

  constructor(message: string, code: BusinessServiceErrorCode, httpStatus: number) {
    super(message);
    this.name = 'BusinessServiceError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export function isPrismaUniqueViolation(error: unknown): boolean {
  return typeof (error as { code?: string }).code === 'string' && (error as { code: string }).code === 'P2002';
}
