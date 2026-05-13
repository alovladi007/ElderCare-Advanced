import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { Request, Response } from 'express';

/**
 * Logging Interceptor
 * Automatically logs all HTTP requests with response time
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const correlationId = headers['x-correlation-id'] || this.generateCorrelationId();

    // Add correlation ID to request for tracing
    (request as any).correlationId = correlationId;

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - now;
          const { statusCode } = response;

          this.logger.logRequest(method, url, statusCode, responseTime, {
            correlationId,
            ip,
            userAgent,
          });
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          const statusCode = error.status || 500;

          this.logger.error(
            `HTTP Error: ${method} ${url}`,
            error.stack,
            'HTTP',
            {
              correlationId,
              statusCode,
              responseTime,
              ip,
              userAgent,
              errorMessage: error.message,
            }
          );
        },
      })
    );
  }

  /**
   * Generate a unique correlation ID for request tracing
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
