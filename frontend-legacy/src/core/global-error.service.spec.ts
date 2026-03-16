import { describe, test, expect, beforeEach, jest } from 'bun:test';
import { GlobalErrorService, RootErrorState } from './global-error.service';
import { ErrorCode, ErrorValue } from '../types/error.types';
import { EventBusViewModel } from '../viewmodels/event-bus.viewmodel';

// Mock EventBusViewModel
function createMockEventBus() {
    const subscribers = new Map<string, Set<(payload: unknown) => void>>();
    
    return {
        publish: jest.fn((event: string, payload: unknown) => {
            const handlers = subscribers.get(event);
            handlers?.forEach(h => h(payload));
        }),
        subscribe: jest.fn((event: string, handler: (payload: unknown) => void) => {
            if (!subscribers.has(event)) {
                subscribers.set(event, new Set());
            }
            subscribers.get(event)!.add(handler);
            return () => subscribers.get(event)?.delete(handler);
        }),
        unsubscribe: jest.fn(),
    } as unknown as EventBusViewModel<Record<string, unknown>>;
}

describe('GlobalErrorService', () => {
    let service: GlobalErrorService;
    let mockEventBus: ReturnType<typeof createMockEventBus>;

    beforeEach(() => {
        mockEventBus = createMockEventBus();
        (window as any).__FRONTEND_EVENT_BUS__ = mockEventBus;
        
        service = new GlobalErrorService();
    });

    test('should be created', () => {
        expect(service).toBeDefined();
    });

    test('should initialize with no active error', () => {
        expect(service.activeError()).toBeNull();
    });

    test('should have no error initially', () => {
        expect(service.hasError()).toBe(false);
    });

    test('should report error and set active error', () => {
        const errorValue: ErrorValue = {
            code: ErrorCode.InternalError,
            message: 'Test error message',
        };

        const result = service.report(errorValue, {
            source: 'test',
            title: 'Test Error',
        });

        expect(result).toBeDefined();
        expect(result.id).toBeGreaterThan(0);
        expect(service.activeError()).toBeDefined();
        expect(service.activeError()?.error.code).toBe(ErrorCode.InternalError);
        expect(service.activeError()?.error.message).toBe('Test error message');
    });

    test('should increment error sequence', () => {
        service.report({ code: ErrorCode.Unknown, message: 'Error 1' });
        service.report({ code: ErrorCode.Unknown, message: 'Error 2' });
        service.report({ code: ErrorCode.Unknown, message: 'Error 3' });

        expect(service.activeError()?.id).toBe(3);
    });

    test('should dismiss error', () => {
        service.report({ code: ErrorCode.Unknown, message: 'Test error' });
        expect(service.hasError()).toBe(true);

        service.dismiss();
        expect(service.hasError()).toBe(false);
        expect(service.activeError()).toBeNull();
    });

    test('should handle successful Result', () => {
        const result = { ok: true as const, value: 'success' };
        const value = service.handleResult(result);

        expect(value).toBe('success');
    });

    test('should handle failed Result', () => {
        const result = {
            ok: false as const,
            error: { code: ErrorCode.Unknown, message: 'Failed' } as ErrorValue,
        };

        const value = service.handleResult(result);
        expect(value).toBeNull();
        expect(service.hasError()).toBe(true);
    });

    test('should handle Result with custom error handler', () => {
        const result = {
            ok: false as const,
            error: 'Custom error',
        };

        const onError = jest.fn((e: string) => ({
            code: ErrorCode.InternalError,
            message: e,
        }));

        const handled = service.handleResultWith(result, onError);

        expect(onError).toHaveBeenCalledWith('Custom error');
        expect(handled.ok).toBe(false);
    });

    test('should convert Error exception to ErrorValue', () => {
        const error = new Error('Test exception');
        const errorValue = service.fromException(error);

        expect(errorValue.code).toBe(ErrorCode.InternalError);
        expect(errorValue.message).toBe('Test exception');
        expect(errorValue.details).toContain('Error: Test exception');
    });

    test('should convert string exception to ErrorValue', () => {
        const errorValue = service.fromException('String error');

        expect(errorValue.code).toBe(ErrorCode.Unknown);
        expect(errorValue.message).toBe('String error');
    });

    test('should convert unknown exception to ErrorValue', () => {
        const errorValue = service.fromException({ key: 'value' });

        expect(errorValue.code).toBe(ErrorCode.Unknown);
        expect(errorValue.message).toBe('An unknown error occurred');
    });

    test('should create validation error', () => {
        const result = service.validationError('email', 'Invalid email format');

        expect(result.error.code).toBe(ErrorCode.ValidationFailed);
        expect(result.error.field).toBe('email');
        expect(result.error.message).toBe('Invalid email format');
    });

    test('should create not found error', () => {
        const result = service.notFoundError('User', 123);

        expect(result.error.code).toBe(ErrorCode.ResourceNotFound);
        expect(result.error.message).toContain('User not found: 123');
        expect(result.error.context?.resource).toBe('User');
    });

    test('should get current error code', () => {
        service.report({ code: ErrorCode.DbConnectionFailed, message: 'Connection failed' });

        const code = service.getCurrentErrorCode();
        expect(code).toBe(ErrorCode.DbConnectionFailed);
    });

    test('should return null for current error code when no error', () => {
        const code = service.getCurrentErrorCode();
        expect(code).toBeNull();
    });

    test('should check if current error matches specific code', () => {
        service.report({ code: ErrorCode.DbConnectionFailed, message: 'Connection failed' });

        expect(service.isErrorCode(ErrorCode.DbConnectionFailed)).toBe(true);
        expect(service.isErrorCode(ErrorCode.InternalError)).toBe(false);
    });

    test('should publish error event', () => {
        service.report({ code: ErrorCode.Unknown, message: 'Test' }, {
            source: 'test',
            title: 'Test',
        });

        expect(mockEventBus.publish).toHaveBeenCalledWith(
            'error:captured',
            expect.objectContaining({
                code: ErrorCode.Unknown,
                message: 'Test',
            })
        );
    });

    test('should generate default title for error codes', () => {
        const testCases = [
            { code: ErrorCode.ValidationFailed, expected: 'Validation Error' },
            { code: ErrorCode.ResourceNotFound, expected: 'Not Found' },
            { code: ErrorCode.UserNotFound, expected: 'Not Found' },
            { code: ErrorCode.EntityNotFound, expected: 'Not Found' },
            { code: ErrorCode.DbAlreadyExists, expected: 'Already Exists' },
            { code: ErrorCode.InternalError, expected: 'System Error' },
            { code: ErrorCode.LockPoisoned, expected: 'System Error' },
            { code: ErrorCode.Unknown, expected: 'Error' },
        ];

        testCases.forEach(({ code, expected }) => {
            service.report({ code, message: 'Test' });
            expect(service.activeError()?.title).toBe(expected);
            service.dismiss();
        });
    });

    test('should use custom title if provided', () => {
        service.report(
            { code: ErrorCode.Unknown, message: 'Test' },
            { source: 'test', title: 'Custom Title' }
        );

        expect(service.activeError()?.title).toBe('Custom Title');
    });

    test('should log error internally', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

        service.report({ code: ErrorCode.Unknown, message: 'Test error' });

        expect(consoleError).toHaveBeenCalled();
        consoleError.mockRestore();
    });

    test('should handle multiple error reports', () => {
        service.report({ code: ErrorCode.Unknown, message: 'Error 1' });
        const firstId = service.activeError()?.id;

        service.report({ code: ErrorCode.InternalError, message: 'Error 2' });
        const secondId = service.activeError()?.id;

        expect(secondId).toBeGreaterThan(firstId ?? 0);
    });

    test('should create error state with timestamp', () => {
        service.report({ code: ErrorCode.Unknown, message: 'Test' });

        const error = service.activeError();
        expect(error?.timestamp).toBeDefined();
        expect(new Date(error?.timestamp ?? '').getTime()).not.toBeNaN();
    });

    test('should set source to unknown if not provided', () => {
        service.report({ code: ErrorCode.Unknown, message: 'Test' });

        expect(service.activeError()?.source).toBe('unknown');
    });

    test('should use provided source', () => {
        service.report({ code: ErrorCode.Unknown, message: 'Test' }, {
            source: 'http',
        });

        expect(service.activeError()?.source).toBe('http');
    });
});

describe('GlobalErrorService - Error Context', () => {
    let service: GlobalErrorService;

    beforeEach(() => {
        service = new GlobalErrorService();
    });

    test('should handle error with context', () => {
        const errorValue: ErrorValue = {
            code: ErrorCode.InternalError,
            message: 'Error with context',
            context: {
                operation: 'fetch',
                url: '/api/data',
            },
        };

        service.report(errorValue);

        const activeError = service.activeError();
        expect(activeError?.error.context?.operation).toBe('fetch');
        expect(activeError?.error.context?.url).toBe('/api/data');
    });

    test('should handle error with field', () => {
        const errorValue: ErrorValue = {
            code: ErrorCode.ValidationFailed,
            message: 'Invalid value',
            field: 'email',
        };

        service.report(errorValue);

        expect(service.activeError()?.error.field).toBe('email');
    });

    test('should handle error with cause', () => {
        const errorValue: ErrorValue = {
            code: ErrorCode.InternalError,
            message: 'Operation failed',
            cause: 'Underlying service unavailable',
        };

        service.report(errorValue);

        expect(service.activeError()?.error.cause).toBe('Underlying service unavailable');
    });

    test('should handle error with details', () => {
        const errorValue: ErrorValue = {
            code: ErrorCode.InternalError,
            message: 'Operation failed',
            details: 'Stack trace here',
        };

        service.report(errorValue);

        expect(service.activeError()?.error.details).toBe('Stack trace here');
    });
});
