/**
 * Application-level error with an HTTP status code and a machine-readable error code.
 *
 * The `code` property allows clients to programmatically identify error types
 * (e.g. "INSUFFICIENT_FUNDS", "USER_NOT_FOUND") without parsing the message.
 *
 * `Object.setPrototypeOf` is required when extending built-in Error in TypeScript
 * with ES2015+ target; without it, `instanceof` checks may fail.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
