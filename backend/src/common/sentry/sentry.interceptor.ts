import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { SentryService } from './sentry.service';
import { LoggerService } from '../logging/logger.service';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  constructor(
    private sentryService: SentryService,
    private logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const method = request.method;
    const url = request.url;
    const user = request.user; // From JWT auth

    // Start performance transaction
    const transaction = this.sentryService.startTransaction(
      `${method} ${url}`,
      'http.server',
    );

    // Add breadcrumb for this request
    this.sentryService.addBreadcrumb(
      `${method} ${url}`,
      'http',
      'info',
      {
        method,
        url,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      },
    );

    // Set user context if available
    if (user) {
      this.sentryService.setUser({
        id: user.userId,
        email: user.email,
        username: user.username,
      });
    }

    return next.handle().pipe(
      tap(() => {
        // Finish transaction on success
        if (transaction) {
          transaction.setHttpStatus(200);
          transaction.finish();
        }
      }),
      catchError((error) => {
        // Capture error in Sentry
        if (this.shouldCaptureError(error)) {
          this.sentryService.captureException(error, {
            user: user ? { id: user.userId, email: user.email } : undefined,
            tags: {
              method,
              url,
              statusCode: error.status?.toString() || '500',
            },
            extra: {
              requestBody: this.sanitizeRequestBody(request.body),
              query: request.query,
              params: request.params,
              headers: this.sanitizeHeaders(request.headers),
            },
          });

          // Log error
          this.logger.error('HTTP Exception', context.getClass().name, {
            method,
            url,
            statusCode: error.status || 500,
            message: error.message,
            userId: user?.userId,
          });
        }

        // Finish transaction with error
        if (transaction) {
          transaction.setHttpStatus(error.status || 500);
          transaction.finish();
        }

        return throwError(() => error);
      }),
    );
  }

  /**
   * Determine if error should be sent to Sentry
   */
  private shouldCaptureError(error: any): boolean {
    // Don't capture expected HTTP exceptions (400-499)
    if (error instanceof HttpException) {
      const status = error.getStatus();
      // Only capture server errors (500+) and critical client errors
      return status >= 500 || status === 429; // Rate limit errors
    }

    // Capture all other errors (unexpected exceptions)
    return true;
  }

  /**
   * Sanitize request body (remove sensitive data)
   */
  private sanitizeRequestBody(body: any): any {
    if (!body) return {};

    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'creditCard',
      'ssn',
      'authorization',
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize headers (remove sensitive data)
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-iot-token'];

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
