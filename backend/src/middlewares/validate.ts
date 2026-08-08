/**
 * Zod request validation middleware.
 *
 * Usage:
 *   router.post('/register', validate({ body: registerSchema }), handler);
 *
 * The schemas are keyed by the request part they validate ('body' | 'query' | 'params').
 * Failures are collected across all provided parts so the client gets every
 * field error in one response.
 */
import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

type RequestPart = 'body' | 'query' | 'params';

export function validate(schemas: Partial<Record<RequestPart, ZodTypeAny>>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      for (const part of ['body', 'query', 'params'] as RequestPart[]) {
        const schema = schemas[part];
        if (!schema) continue;
        (req as any)[part] = schema.parse((req as any)[part]);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.reduce<Record<string, string>>((acc, issue) => {
          acc[issue.path.join('.')] = issue.message;
          return acc;
        }, {});
        next(ApiError.badRequest('Validation failed', details));
        return;
      }
      next(err);
    }
  };
}