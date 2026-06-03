export class NotebookAIServiceError extends Error {
  constructor(
    message: string,
    readonly code: 'not_found' | 'forbidden' | 'invalid' | 'unavailable',
    readonly httpStatus = 400
  ) {
    super(message);
    this.name = 'NotebookAIServiceError';
  }
}
