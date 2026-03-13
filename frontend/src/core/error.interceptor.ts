import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable, Injector as NgInjector } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, retryWhen, scan, delay, switchMap } from 'rxjs/operators';
import { ErrorCode, ErrorValue, logError } from '../types/error.types';
import { GlobalErrorService } from './global-error.service';
import { getLogger } from '../viewmodels/logger';

interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
};

// Retryable status codes
const RETRYABLE_STATUS_CODES = [0, 408, 425, 429, 500, 502, 503, 504];

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private readonly logger = getLogger('error-interceptor');

  constructor(private ngInjector: NgInjector) {}

  intercept<T>(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<T>> {
    const startTime = Date.now();
    const errorService = this.ngInjector.get(GlobalErrorService);

    return next.handle(request).pipe(
      retryWhen((errors) =>
        errors.pipe(
          scan((errorCount, error: HttpErrorResponse) => {
            if (!this.isRetryable(error)) {
              throw error;
            }
            if (errorCount >= DEFAULT_RETRY_CONFIG.maxRetries) {
              throw error;
            }
            return errorCount + 1;
          }, 0),
          switchMap((attempt) => {
            const delayTime =
              DEFAULT_RETRY_CONFIG.delayMs *
              Math.pow(DEFAULT_RETRY_CONFIG.backoffMultiplier, attempt - 1);

            this.logger.warn(`Request retry attempt ${attempt}/${DEFAULT_RETRY_CONFIG.maxRetries}`, {
              url: request.url,
              method: request.method,
              delay: delayTime,
            });

            return throwError(() => new Error(`Retry attempt ${attempt}`));
          }),
          delay(DEFAULT_RETRY_CONFIG.delayMs)
        )
      ),
      catchError((error: HttpErrorResponse) => {
        const elapsed = Date.now() - startTime;
        return this.handleError(error, request, elapsed, errorService);
      })
    );
  }

  private isRetryable(error: HttpErrorResponse): boolean {
    return RETRYABLE_STATUS_CODES.includes(error.status);
  }

  private handleError<T>(
    error: HttpErrorResponse,
    request: HttpRequest<unknown>,
    elapsed: number,
    errorService: GlobalErrorService
  ): Observable<never> {
    const errorValue = this.mapHttpError(error, request, elapsed);

    // Log the error
    logError(errorValue, `HTTP ${error.status} - ${request.method} ${request.url}`);
    this.logger.error('HTTP Error', {
      status: error.status,
      url: request.url,
      method: request.method,
      elapsed,
      error: errorValue,
    });

    // Report to global error service
    if (errorService) {
      errorService.report(errorValue, {
        source: 'http',
        title: this.getErrorTitle(error.status),
      });
    }

    // Dispatch custom event for connection monitoring
    if (error.status === 0 || error.status >= 500) {
      window.dispatchEvent(
        new CustomEvent('webui:error', {
          detail: {
            type: 'http',
            status: error.status,
            url: request.url,
            message: errorValue.message,
          },
        })
      );
    }

    return throwError(() => error);
  }

  private mapHttpError(
    error: HttpErrorResponse,
    request: HttpRequest<unknown>,
    elapsed: number
  ): ErrorValue {
    const errorValue: ErrorValue = {
      code: this.mapStatusToErrorCode(error.status),
      message: this.getUserMessage(error),
      details: error.message,
      context: {
        status: String(error.status),
        url: request.url,
        method: request.method,
        elapsed: `${elapsed}ms`,
      },
    };

    // Extract additional error details from response
    if (error.error) {
      if (typeof error.error === 'object') {
        // API error response
        if (error.error.code) {
          errorValue.code = error.error.code as ErrorCode;
        }
        if (error.error.message) {
          errorValue.message = error.error.message;
        }
        if (error.error.details) {
          errorValue.details = error.error.details;
        }
        if (error.error.field) {
          errorValue.field = error.error.field;
        }
        if (error.error.context) {
          errorValue.context = { ...errorValue.context, ...error.error.context };
        }
      } else if (typeof error.error === 'string') {
        // Plain text error
        errorValue.details = error.error;
      }
    }

    // Add timeout context
    if (error.status === 0) {
      errorValue.context = {
        ...errorValue.context,
        possibleCause: 'Network error, CORS issue, or server unavailable',
      };
    }

    return errorValue;
  }

  private mapStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case 0:
        return ErrorCode.DbConnectionFailed;
      case 400:
        return ErrorCode.ValidationFailed;
      case 401:
      case 403:
        return ErrorCode.InternalError;
      case 404:
        return ErrorCode.ResourceNotFound;
      case 409:
        return ErrorCode.DbAlreadyExists;
      case 408:
      case 504:
        return ErrorCode.InternalError;
      case 429:
        return ErrorCode.InternalError;
      case 500:
        return ErrorCode.InternalError;
      case 502:
      case 503:
        return ErrorCode.DbConnectionFailed;
      default:
        return ErrorCode.Unknown;
    }
  }

  private getUserMessage(error: HttpErrorResponse): string {
    const status = error.status;

    // Check for custom message from server
    if (error.error?.message) {
      return error.error.message;
    }

    switch (status) {
      case 0:
        return 'Unable to connect to the server. Please check your network connection.';
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication required. Please log in.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 408:
        return 'The request timed out. Please try again.';
      case 409:
        return 'A conflict occurred. The resource may already exist.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'An internal server error occurred. Please try again later.';
      case 502:
        return 'The server received an invalid response. Please try again.';
      case 503:
        return 'The server is temporarily unavailable. Please try again later.';
      case 504:
        return 'The server took too long to respond. Please try again.';
      default:
        return `An error occurred (Status: ${status}). Please try again.`;
    }
  }

  private getErrorTitle(status: number): string {
    switch (status) {
      case 0:
        return 'Connection Error';
      case 400:
        return 'Bad Request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return 'Not Found';
      case 500:
        return 'Server Error';
      case 502:
        return 'Bad Gateway';
      case 503:
        return 'Service Unavailable';
      case 504:
        return 'Gateway Timeout';
      default:
        return 'HTTP Error';
    }
  }
}
