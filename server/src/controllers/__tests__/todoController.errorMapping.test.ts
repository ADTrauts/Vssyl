import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { getTasks } from '../todoController';
import * as todoVisibilityService from '../../services/todoVisibilityService';
import { TodoServiceError } from '../../services/todo/todoErrors';

function mockRes(): Response & { statusCode: number; jsonBody: unknown } {
  const res = {
    statusCode: 200,
    jsonBody: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.jsonBody = payload;
      return this;
    },
  };
  return res as Response & { statusCode: number; jsonBody: unknown };
}

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    user: { id: 'user-1' },
    query: {},
    ...overrides,
  } as Request;
}

describe('todoController TodoServiceError mapping', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maps TodoServiceError to HTTP status for getTasks', async () => {
    vi.spyOn(todoVisibilityService, 'listAccessibleTasks').mockRejectedValue(
      new TodoServiceError('Dashboard not found', 'not_found', 404)
    );

    const res = mockRes();
    await getTasks(mockReq(), res);

    expect(res.statusCode).toBe(404);
    expect(res.jsonBody).toEqual({ error: 'Dashboard not found' });
  });
});
