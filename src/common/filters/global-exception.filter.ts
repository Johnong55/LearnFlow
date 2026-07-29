import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorBody {
  message?: string | string[];
  error?: string;
  code?: string;
  details?: unknown[];
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request & { requestId?: string }>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : undefined;
    const body: ErrorBody = typeof raw === 'object' && raw !== null ? raw : {};
    const rawMessage = body.message ?? (typeof raw === 'string' ? raw : undefined);
    const validationDetails = Array.isArray(rawMessage) ? rawMessage : (body.details ?? []);
    const message = Array.isArray(rawMessage)
      ? 'Request validation failed.'
      : (rawMessage ?? (status === 500 ? 'An unexpected error occurred.' : 'Request failed.'));
    const code = body.code ?? body.error?.toUpperCase().replaceAll(' ', '_') ?? `HTTP_${status}`;

    if (status >= 500) {
      this.logger.error({
        requestId: request.requestId,
        method: request.method,
        path: request.url,
        exception,
      });
    }
    response.status(status).json({
      success: false,
      error: { code, message, details: validationDetails },
      meta: { requestId: request.requestId ?? 'unknown', timestamp: new Date().toISOString() },
    });
  }
}
