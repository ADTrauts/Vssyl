export class NotebookLinkServiceError extends Error {
  constructor(
    message: string,
    readonly code: 'not_found' | 'forbidden' | 'invalid' | 'unsupported',
    readonly httpStatus = 400
  ) {
    super(message);
    this.name = 'NotebookLinkServiceError';
  }
}
