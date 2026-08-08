/**
 * Consistent success envelope: { success, message, data, meta }.
 * `meta` carries pagination / counts for list endpoints.
 */
export class ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;

  constructor(data: T, message = 'Success', meta?: Record<string, unknown>) {
    this.success = true;
    this.message = message;
    this.data = data;
    if (meta) this.meta = meta;
  }
}

/** Shorthand used by controllers: `res.send(ApiResponse.ok(payload))`. */
export function ok<T>(data: T, message = 'Success', meta?: Record<string, unknown>): ApiResponse<T> {
  return new ApiResponse(data, message, meta);
}

/** Empty success (204-style) with a friendly message. */
export function noContent(message = 'Operation completed'): ApiResponse<null> {
  return new ApiResponse(null, message);
}