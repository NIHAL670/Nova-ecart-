/**
 * Standardised API error. Optionally carries HTTP status + validation field
 * details so the global handler can render a consistent JSON error shape.
 */
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: Record<string, unknown>;

  constructor(statusCode: number, message: string, details?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  /** Not found (404) helper. */
  static notFound(resource: string): ApiError {
    return new ApiError(404, `${resource} not found`);
  }

  /** Unauthorized (401) helper. */
  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  /** Forbidden (403) helper. */
  static forbidden(message = 'You do not have permission to perform this action'): ApiError {
    return new ApiError(403, message);
  }

  /** Validation (400) helper with field-level details. */
  static badRequest(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(400, message, details);
  }
}