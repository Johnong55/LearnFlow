import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import { catchError, finalize, throwError, type Observable } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = Date.now();
    const request = context.switchToHttp().getRequest<{
      method: string;
      originalUrl: string;
      requestId?: string;
      user?: { id: string };
    }>();
    let errorCode: string | undefined;
    return next.handle().pipe(
      catchError((error: unknown) => {
        errorCode = error instanceof Error ? error.name : 'UNKNOWN_ERROR';
        return throwError(() => error);
      }),
      finalize(() => {
        this.logger.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            requestId: request.requestId,
            userId: request.user?.id,
            method: request.method,
            path: request.originalUrl,
            durationMs: Date.now() - startedAt,
            errorCode,
          }),
        );
      }),
    );
  }
}
