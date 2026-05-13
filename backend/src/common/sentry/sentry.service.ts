import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { LoggerService } from '../logging/logger.service';

@Injectable()
export class SentryService implements OnModuleInit {
  private isInitialized = false;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {}

  onModuleInit() {
    this.initialize();
  }

  /**
   * Initialize Sentry
   */
  private initialize() {
    const dsn = this.configService.get<string>('SENTRY_DSN');
    const environment = this.configService.get<string>('NODE_ENV') || 'development';

    // Only initialize if DSN is configured
    if (!dsn) {
      this.logger.warn(
        'SENTRY_DSN not configured - error tracking disabled',
        'SentryService',
      );
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment,

        // Performance monitoring
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
        profilesSampleRate: environment === 'production' ? 0.1 : 1.0,

        // Integrations
        integrations: [
          new ProfilingIntegration(),
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Express({ app: true }),
        ],

        // Release tracking
        release: this.configService.get<string>('APP_VERSION') || 'unknown',

        // Error filtering
        beforeSend(event, hint) {
          // Filter out specific errors
          const error = hint.originalException as Error;

          // Don't send HTTP 404 errors
          if (error?.message?.includes('404')) {
            return null;
          }

          // Don't send validation errors (they're expected)
          if (error?.name === 'BadRequestException') {
            return null;
          }

          return event;
        },

        // Ignore specific errors
        ignoreErrors: [
          'BadRequestException',
          'UnauthorizedException',
          'NotFoundException',
          'ForbiddenException',
          'ConflictException',
        ],
      });

      this.isInitialized = true;
      this.logger.log('Sentry initialized successfully', 'SentryService', {
        environment,
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      });
    } catch (error) {
      this.logger.error('Failed to initialize Sentry', 'SentryService', {
        error: error.message,
      });
    }
  }

  /**
   * Capture exception with context
   */
  captureException(
    error: Error,
    context?: {
      user?: { id: string; email?: string };
      tags?: Record<string, string>;
      extra?: Record<string, any>;
    },
  ) {
    if (!this.isInitialized) {
      return;
    }

    Sentry.withScope((scope) => {
      // Add user context
      if (context?.user) {
        scope.setUser({
          id: context.user.id,
          email: context.user.email,
        });
      }

      // Add tags
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      // Add extra data
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      Sentry.captureException(error);
    });
  }

  /**
   * Capture message (for non-error events)
   */
  captureMessage(
    message: string,
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
    context?: {
      tags?: Record<string, string>;
      extra?: Record<string, any>;
    },
  ) {
    if (!this.isInitialized) {
      return;
    }

    Sentry.withScope((scope) => {
      scope.setLevel(level);

      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      Sentry.captureMessage(message);
    });
  }

  /**
   * Start a performance transaction
   */
  startTransaction(name: string, op: string) {
    if (!this.isInitialized) {
      return null;
    }

    return Sentry.startTransaction({
      name,
      op,
    });
  }

  /**
   * Add breadcrumb (for debugging context)
   */
  addBreadcrumb(
    message: string,
    category: string,
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
    data?: Record<string, any>,
  ) {
    if (!this.isInitialized) {
      return;
    }

    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Set user context globally
   */
  setUser(user: { id: string; email?: string; username?: string }) {
    if (!this.isInitialized) {
      return;
    }

    Sentry.setUser(user);
  }

  /**
   * Clear user context
   */
  clearUser() {
    if (!this.isInitialized) {
      return;
    }

    Sentry.setUser(null);
  }

  /**
   * Flush events (useful before shutdown)
   */
  async flush(timeout = 2000): Promise<boolean> {
    if (!this.isInitialized) {
      return true;
    }

    return Sentry.close(timeout);
  }
}
