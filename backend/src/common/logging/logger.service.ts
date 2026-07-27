import { Injectable, Inject, LoggerService as NestLoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

/**
 * Custom Logger Service using Winston
 * Provides structured logging with correlation IDs
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Log a message at the 'log' level
   */
  log(message: string, context?: string, metadata?: Record<string, any>) {
    this.logger.info(message, { context, ...metadata });
  }

  /**
   * Log a message at the 'error' level
   */
  error(message: string, trace?: string, context?: string, metadata?: Record<string, any>) {
    this.logger.error(message, { context, trace, ...metadata });
  }

  /**
   * Log a message at the 'warn' level
   */
  warn(message: string, context?: string, metadata?: Record<string, any>) {
    this.logger.warn(message, { context, ...metadata });
  }

  /**
   * Log a message at the 'debug' level
   */
  debug(message: string, context?: string, metadata?: Record<string, any>) {
    this.logger.debug(message, { context, ...metadata });
  }

  /**
   * Log a message at the 'verbose' level
   */
  verbose(message: string, context?: string, metadata?: Record<string, any>) {
    this.logger.verbose(message, { context, ...metadata });
  }

  /**
   * Log HTTP request
   */
  logRequest(method: string, url: string, statusCode: number, responseTime: number, metadata?: Record<string, any>) {
    this.logger.info('HTTP Request', {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      ...metadata,
    });
  }

  /**
   * Log database query
   */
  logQuery(query: string, duration: number, metadata?: Record<string, any>) {
    this.logger.debug('Database Query', {
      query: query.substring(0, 200), // Truncate long queries
      duration: `${duration}ms`,
      ...metadata,
    });
  }

  /**
   * Log authentication event
   */
  logAuth(event: string, userId?: string, success?: boolean, metadata?: Record<string, any>) {
    this.logger.info(`Auth: ${event}`, {
      userId,
      success,
      ...metadata,
    });
  }

  /**
   * Log business event
   */
  logEvent(eventName: string, entityType: string, entityId: string, metadata?: Record<string, any>) {
    this.logger.info(`Event: ${eventName}`, {
      entityType,
      entityId,
      ...metadata,
    });
  }

  /**
   * Log security event
   */
  logSecurity(event: string, severity: 'low' | 'medium' | 'high' | 'critical', metadata?: Record<string, any>) {
    this.logger.warn(`Security: ${event}`, {
      severity,
      ...metadata,
    });
  }

  /**
   * Log a caught error together with its stack and surrounding context.
   *
   * Callers pass the Error object itself rather than a pre-formatted string,
   * so the stack survives into the log record.
   */
  logError(message: string, error: unknown, metadata?: Record<string, any>) {
    const err = error instanceof Error ? error : undefined;
    this.logger.error(message, {
      error: err ? err.message : String(error),
      stack: err?.stack,
      ...metadata,
    });
  }
}
