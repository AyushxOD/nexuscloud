import { logger, type LogContext } from './logger.js';

export class CloudOptimizerError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isRetryable: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    isRetryable: boolean = false,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CloudOptimizerError';
    this.code = code;
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class AWSServiceError extends CloudOptimizerError {
  constructor(
    message: string,
    service: string,
    operation: string,
    error: unknown,
    isRetryable: boolean = false
  ) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    super(
      `[${service}] ${operation} failed: ${errorMessage}`,
      `${service.toUpperCase()}_ERROR`,
      503,
      isRetryable,
      { service, operation, originalError: errorMessage }
    );
  }
}

export class ValidationError extends CloudOptimizerError {
  constructor(message: string, field?: string) {
    super(
      `Validation failed: ${message}`,
      'VALIDATION_ERROR',
      400,
      false,
      { field }
    );
  }
}

export const handleError = (error: unknown, context?: LogContext): CloudOptimizerError => {
  if (error instanceof CloudOptimizerError) {
    logger.error(error.message, error, context);
    return error;
  }

  if (error instanceof Error) {
    const cloudError = new CloudOptimizerError(
      error.message,
      'INTERNAL_ERROR',
      500,
      false,
      context as Record<string, unknown>
    );
    logger.error('Unhandled error', error, context);
    return cloudError;
  }

  const unknownError = new CloudOptimizerError(
    'An unknown error occurred',
    'UNKNOWN_ERROR',
    500,
    false,
    context as Record<string, unknown>
  );
  logger.error('Unknown error type', error, context);
  return unknownError;
};

export const isRetryableError = (error: CloudOptimizerError): boolean => {
  const retryableCodes = [
    'THROTTLING_ERROR',
    'RATE_LIMIT_EXCEEDED',
    'SERVICE_UNAVAILABLE',
    'TIMEOUT',
  ];
  return error.isRetryable || retryableCodes.includes(error.code);
};