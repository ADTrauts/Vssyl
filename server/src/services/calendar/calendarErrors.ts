export type CalendarErrorCode = 'not_found' | 'forbidden' | 'invalid' | 'unauthorized' | 'conflict';

export class CalendarServiceError extends Error {
  constructor(
    message: string,
    readonly code: CalendarErrorCode,
    readonly status: number = 400
  ) {
    super(message);
    this.name = 'CalendarServiceError';
  }
}

export function calendarErrorStatus(code: CalendarErrorCode): number {
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
