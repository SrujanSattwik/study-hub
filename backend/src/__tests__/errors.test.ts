/**
 * Error class and error middleware unit tests.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from '../utils/errors';

describe('AppError subclasses', () => {
  it('BadRequestError has statusCode 400', () => {
    const err = new BadRequestError('bad input');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('bad input');
    expect(err instanceof AppError).toBe(true);
    expect(err.isOperational).toBe(true);
  });

  it('UnauthorizedError has statusCode 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
  });

  it('ForbiddenError has statusCode 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
  });

  it('NotFoundError has statusCode 404', () => {
    const err = new NotFoundError('not here');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('not here');
  });

  it('ConflictError has statusCode 409', () => {
    const err = new ConflictError('duplicate');
    expect(err.statusCode).toBe(409);
  });

  it('preserves instanceof check through prototype chain', () => {
    const err = new NotFoundError();
    expect(err instanceof NotFoundError).toBe(true);
    expect(err instanceof AppError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });
});
