export type PlaceErrorCode =
  | 'not_found'
  | 'place_not_found'
  | 'listing_not_found'
  | 'meeting_not_found'
  | 'forbidden'
  | 'invalid'
  | 'invalid_scope'
  | 'unauthorized'
  | 'conflict';

export class PlaceServiceError extends Error {
  constructor(
    message: string,
    readonly code: PlaceErrorCode,
    readonly status: number = 400
  ) {
    super(message);
    this.name = 'PlaceServiceError';
  }
}

export function placeErrorStatus(code: PlaceErrorCode): number {
  switch (code) {
    case 'not_found':
    case 'place_not_found':
    case 'listing_not_found':
    case 'meeting_not_found':
      return 404;
    case 'forbidden':
    case 'unauthorized':
      return code === 'unauthorized' ? 401 : 403;
    case 'conflict':
      return 409;
    case 'invalid_scope':
    case 'invalid':
    default:
      return 400;
  }
}

export function respondPlaceServiceError(
  res: { status: (code: number) => { json: (body: unknown) => void } },
  error: unknown
): boolean {
  if (error instanceof PlaceServiceError) {
    res.status(error.status).json({ success: false, error: error.message });
    return true;
  }
  return false;
}
