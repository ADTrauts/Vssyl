export class NotesServiceError extends Error {
  constructor(
    message: string,
    readonly code: 'not_found' | 'forbidden' | 'invalid',
    readonly httpStatus = 400
  ) {
    super(message);
    this.name = 'NotesServiceError';
  }
}

export class NotesTrashError extends Error {
  constructor(
    message: string,
    readonly code: 'not_found' | 'forbidden' | 'invalid' = 'invalid'
  ) {
    super(message);
    this.name = 'NotesTrashError';
  }
}
