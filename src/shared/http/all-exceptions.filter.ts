import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/** Body every error response shares (HU-04). */
export interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

/**
 * Domain errors that reach this filter unmapped are classified by their
 * class name, which follows the `<Thing>NotFoundError` /
 * `<Thing>AlreadyExistsError` convention used across modules.
 */
const DOMAIN_ERROR_STATUS: [RegExp, HttpStatus][] = [
  [/NotFoundError$/, HttpStatus.NOT_FOUND],
  [
    /(AlreadyExists|AlreadyAssigned|AlreadyConverted)Error$/,
    HttpStatus.CONFLICT,
  ],
  [/^(Invalid|Empty)\w*Error$/, HttpStatus.BAD_REQUEST],
];

/**
 * Global filter that gives every error the same JSON shape. Controllers keep
 * mapping their own domain errors; this is the safety net for anything they
 * don't, and it hides the details of unexpected errors behind a 500.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    const { statusCode, message } = this.resolve(exception);
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponseBody = {
      statusCode,
      error: HttpStatus[statusCode] ?? 'Error',
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };
    response.status(statusCode).json(body);
  }

  private resolve(exception: unknown): {
    statusCode: number;
    message: string | string[];
  } {
    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      const message =
        typeof payload === 'object' && payload !== null && 'message' in payload
          ? (payload as { message: string | string[] }).message
          : exception.message;
      return { statusCode: exception.getStatus(), message };
    }

    if (exception instanceof Error) {
      const match = DOMAIN_ERROR_STATUS.find(([pattern]) =>
        pattern.test(exception.name),
      );
      if (match) {
        return { statusCode: match[1], message: exception.message };
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
