import { Request, Response, NextFunction, RequestHandler } from 'express';

/** Wrap async route handlers for Express error propagation. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Express handler arity varies
export function asyncHandler(fn: (...args: any[]) => Promise<any>): RequestHandler {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
