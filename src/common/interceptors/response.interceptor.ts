import { CallHandler, ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import { map, type Observable } from 'rxjs';

interface ApiResponse<T> {
  success: true;
  data: T;
  meta: { requestId: string; timestamp: string };
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<{ requestId?: string }>();
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        meta: { requestId: request.requestId ?? 'unknown', timestamp: new Date().toISOString() },
      })),
    );
  }
}
