export type ChatErrorCode = 'not_found' | 'forbidden' | 'invalid' | 'unauthorized';

export class ChatServiceError extends Error {
  constructor(
    message: string,
    readonly code: ChatErrorCode,
    readonly status: number = 400
  ) {
    super(message);
    this.name = 'ChatServiceError';
  }
}

export function chatErrorStatus(code: ChatErrorCode): number {
  switch (code) {
    case 'not_found':
      return 404;
    case 'forbidden':
    case 'unauthorized':
      return code === 'unauthorized' ? 401 : 403;
    default:
      return 400;
  }
}
