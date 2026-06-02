export type TodoErrorCode = 'not_found' | 'forbidden' | 'invalid' | 'unauthorized' | 'conflict';

export class TodoServiceError extends Error {
  constructor(
    message: string,
    readonly code: TodoErrorCode,
    readonly status: number = 400
  ) {
    super(message);
    this.name = 'TodoServiceError';
  }
}

export function todoErrorStatus(code: TodoErrorCode): number {
  switch (code) {
    case 'not_found':
      return 404;
    case 'forbidden':
    case 'unauthorized':
      return code === 'unauthorized' ? 401 : 403;
    case 'conflict':
      return 409;
    default:
      return 400;
  }
}
