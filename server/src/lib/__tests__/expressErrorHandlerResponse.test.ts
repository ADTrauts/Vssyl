import { describe, expect, it } from 'vitest';
import { buildExpressErrorResponse } from '../expressErrorHandlerResponse';

describe('buildExpressErrorResponse', () => {
  it('uses generic message for 5xx in production', () => {
    const { status, body } = buildExpressErrorResponse(
      { message: 'SECRET_DB_DETAIL', status: 500 },
      true
    );
    expect(status).toBe(500);
    expect(body.message).toBe('Internal Server Error');
    expect(body.error).toBeUndefined();
  });

  it('passes through message for 4xx in production', () => {
    const { body } = buildExpressErrorResponse({ message: 'Not found', status: 404 }, true);
    expect(body.message).toBe('Not found');
  });

  it('includes stack in development for 5xx', () => {
    const { body } = buildExpressErrorResponse(
      { message: 'boom', status: 500, stack: 'Error: boom\n  at test.js:1' },
      false
    );
    expect(body.message).toBe('boom');
    expect(body.error).toContain('at test.js');
  });
});
