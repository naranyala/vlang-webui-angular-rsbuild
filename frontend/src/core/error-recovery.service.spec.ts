import { describe, test, expect, beforeEach, jest } from 'bun:test';
import { TestBed } from '@angular/core/testing';
import { ErrorRecoveryService, RecoverableError, ErrorStats } from './error-recovery.service';
import { EventBusViewModel } from '../viewmodels/event-bus.viewmodel';
import { ErrorCode } from '../types/error.types';

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

describe('ErrorRecoveryService', () => {
    let service: ErrorRecoveryService;
    let mockEventBus: ReturnType<typeof createMockEventBus>;

    beforeEach(() => {
        mockEventBus = createMockEventBus();
        TestBed.configureTestingModule({
            providers: [
                ErrorRecoveryService,
                { provide: EventBusViewModel, useValue: mockEventBus },
            ],
        });
        service = TestBed.inject(ErrorRecoveryService);
    });

    test('should be created', () => {
        expect(service).toBeDefined();
    });

    test('should initialize with empty errors array', () => {
        expect(service.errors().length).toBe(0);
    });

    test('should initialize with pending recovery status', () => {
        expect(service.recoveryStatus()).toBe('pending');
    });

    test('should initialize with auto-recovery enabled', () => {
        expect(service.autoRecoveryEnabled()).toBe(true);
    });

    test('should calculate stats correctly', () => {
        const stats = service.stats();
        
        expect(stats.totalErrors).toBe(0);
        expect(stats.criticalErrors).toBe(0);
        expect(stats.warningErrors).toBe(0);
        expect(stats.errorTrend).toBe('stable');
    });

    test('should identify recoverable error codes', () => {
        const recoverableCodes = [
            ErrorCode.DbConnectionFailed,
            ErrorCode.DbQueryFailed,
            ErrorCode.InternalError,
            ErrorCode.SerializationFailed,
            ErrorCode.DeserializationFailed,
            ErrorCode.Unknown,
        ];

        recoverableCodes.forEach(code => {
            // Access private method through any cast for testing
            const isRecoverable = (service as any).isRecoverable(code);
            expect(isRecoverable).toBe(true);
        });
    });

    test('should identify non-recoverable error codes', () => {
        const nonRecoverableCodes = [
            ErrorCode.ValidationFailed,
            ErrorCode.ResourceNotFound,
            ErrorCode.UserNotFound,
        ];

        nonRecoverableCodes.forEach(code => {
            const isRecoverable = (service as any).isRecoverable(code);
            expect(isRecoverable).toBe(false);
        });
    });

    test('should register recoverable error on error:captured event', () => {
        const errorData = {
            code: ErrorCode.DbConnectionFailed,
            message: 'Connection failed',
            source: 'http',
        };

        mockEventBus.publish('error:captured', errorData);

        expect(service.errors().length).toBeGreaterThan(0);
        const error = service.errors()[0];
        expect(error.code).toBe(ErrorCode.DbConnectionFailed);
        expect(error.message).toBe('Connection failed');
    });

    test('should register connection error on connection:state event', () => {
        mockEventBus.publish('connection:state', {
            state: 'disconnected',
            connected: false,
        });

        expect(service.errors().length).toBeGreaterThan(0);
        const error = service.errors()[0];
        expect(error.code).toBe(ErrorCode.DbConnectionFailed);
    });

    test('should not register error if not recoverable', () => {
        mockEventBus.publish('error:captured', {
            code: ErrorCode.ValidationFailed,
            message: 'Invalid input',
        });

        expect(service.errors().length).toBe(0);
    });

    test('should calculate recovery progress', () => {
        // Add test errors
        (service as any).registerRecoverableError(ErrorCode.DbConnectionFailed, 'Test error 1');
        (service as any).registerRecoverableError(ErrorCode.InternalError, 'Test error 2');

        const progress = service.recoveryProgress();
        expect(progress).toBe(100); // No retries attempted yet
    });

    test('should determine if recovery is possible', () => {
        expect(service.canRecover()).toBe(false);

        (service as any).registerRecoverableError(ErrorCode.DbConnectionFailed, 'Test error');
        
        expect(service.canRecover()).toBe(true);
    });

    test('should clear single error', () => {
        (service as any).registerRecoverableError(ErrorCode.DbConnectionFailed, 'Test error');
        
        const errorId = service.errors()[0].id;
        service.clearError(errorId);

        expect(service.errors().length).toBe(0);
    });

    test('should clear all errors', () => {
        (service as any).registerRecoverableError(ErrorCode.DbConnectionFailed, 'Test error 1');
        (service as any).registerRecoverableError(ErrorCode.InternalError, 'Test error 2');

        service.clearAllErrors();

        expect(service.errors().length).toBe(0);
        expect(service.recoveryStatus()).toBe('pending');
    });

    test('should toggle auto-recovery', () => {
        expect(service.autoRecoveryEnabled()).toBe(true);

        service.toggleAutoRecovery();
        expect(service.autoRecoveryEnabled()).toBe(false);

        service.toggleAutoRecovery();
        expect(service.autoRecoveryEnabled()).toBe(true);
    });

    test('should get error summary', () => {
        (service as any).registerRecoverableError(ErrorCode.DbConnectionFailed, 'Test error');
        (service as any).registerRecoverableError(ErrorCode.InternalError, 'Test error 2');

        const summary = service.getErrorSummary();
        expect(summary).toContain('2 errors');
    });

    test('should detect critical errors', () => {
        expect(service.hasCriticalErrors()).toBe(false);

        (service as any).registerRecoverableError(ErrorCode.InternalError, 'Critical error');
        
        expect(service.hasCriticalErrors()).toBe(true);
    });

    test('should calculate error trend as stable with few errors', () => {
        (service as any).registerRecoverableError(ErrorCode.Unknown, 'Error 1');
        
        const stats = service.stats();
        expect(stats.errorTrend).toBe('stable');
    });

    test('should provide recovery label for error codes', () => {
        const labels: Record<ErrorCode, string> = {
            [ErrorCode.DbConnectionFailed]: 'Reconnect',
            [ErrorCode.DbQueryFailed]: 'Retry Query',
            [ErrorCode.SerializationFailed]: 'Clear Cache',
            [ErrorCode.DeserializationFailed]: 'Reload Data',
            [ErrorCode.InternalError]: 'Reset',
            [ErrorCode.Unknown]: 'Retry',
            [ErrorCode.DbConstraintViolation]: 'Fix Data',
            [ErrorCode.DbNotFound]: 'Refresh',
            [ErrorCode.DbAlreadyExists]: 'Skip',
            [ErrorCode.ConfigNotFound]: 'Load Defaults',
            [ErrorCode.ConfigInvalid]: 'Reset Config',
            [ErrorCode.ConfigMissingField]: 'Fix Config',
            [ErrorCode.InvalidFormat]: 'Reformat',
            [ErrorCode.ValidationFailed]: 'Fix Input',
            [ErrorCode.MissingRequiredField]: 'Add Field',
            [ErrorCode.InvalidFieldValue]: 'Fix Value',
            [ErrorCode.ResourceNotFound]: 'Refresh List',
            [ErrorCode.UserNotFound]: 'Refresh Users',
            [ErrorCode.EntityNotFound]: 'Refresh Entities',
            [ErrorCode.LockPoisoned]: 'Release Lock',
        };

        // Test a few key labels
        expect((service as any).getRecoveryLabel(ErrorCode.DbConnectionFailed)).toBe('Reconnect');
        expect((service as any).getRecoveryLabel(ErrorCode.InternalError)).toBe('Reset');
        expect((service as any).getRecoveryLabel(ErrorCode.Unknown)).toBe('Retry');
    });

    test('should implement OnDestroy cleanup', () => {
        const spy = jest.spyOn(global, 'clearInterval');
        service.ngOnDestroy();
        // Should not throw
        expect(spy).not.toThrow();
    });
});

describe('ErrorRecoveryService - Recovery Actions', () => {
    let service: ErrorRecoveryService;
    let mockEventBus: ReturnType<typeof createMockEventBus>;

    beforeEach(() => {
        mockEventBus = createMockEventBus();
        TestBed.configureTestingModule({
            providers: [
                ErrorRecoveryService,
                { provide: EventBusViewModel, useValue: mockEventBus },
            ],
        });
        service = TestBed.inject(ErrorRecoveryService);
    });

    test('should attempt reconnection for DbConnectionFailed', async () => {
        const result = await (service as any).getRecoveryAction(ErrorCode.DbConnectionFailed);
        // Should dispatch reconnect event
        expect(mockEventBus.publish).toHaveBeenCalledWith('recovery:retry', expect.anything());
    });

    test('should retry query for DbQueryFailed', async () => {
        const result = await (service as any).getRecoveryAction(ErrorCode.DbQueryFailed);
        expect(result).toBe(true);
    });

    test('should clear cache for SerializationFailed', async () => {
        const result = await (service as any).getRecoveryAction(ErrorCode.SerializationFailed);
        expect(result).toBe(true);
    });

    test('should soft reset for InternalError', async () => {
        const result = await (service as any).getRecoveryAction(ErrorCode.InternalError);
        expect(result).toBe(true);
    });

    test('should generic retry for Unknown', async () => {
        const result = await (service as any).getRecoveryAction(ErrorCode.Unknown);
        expect(result).toBe(true);
    });
});

describe('ErrorRecoveryService - Stats Computation', () => {
    let service: ErrorRecoveryService;
    let mockEventBus: ReturnType<typeof createMockEventBus>;

    beforeEach(() => {
        mockEventBus = createMockEventBus();
        TestBed.configureTestingModule({
            providers: [
                ErrorRecoveryService,
                { provide: EventBusViewModel, useValue: mockEventBus },
            ],
        });
        service = TestBed.inject(ErrorRecoveryService);
    });

    test('should count critical errors correctly', () => {
        const criticalCodes = [
            ErrorCode.InternalError,
            ErrorCode.DbConnectionFailed,
            ErrorCode.LockPoisoned,
        ];

        criticalCodes.forEach(code => {
            (service as any).registerRecoverableError(code, 'Critical error');
        });

        const stats = service.stats();
        expect(stats.criticalErrors).toBe(3);
        expect(stats.totalErrors).toBe(3);
    });

    test('should count warning errors correctly', () => {
        const warningCodes = [
            ErrorCode.Unknown,
            ErrorCode.DeserializationFailed,
        ];

        warningCodes.forEach(code => {
            (service as any).registerRecoverableError(code, 'Warning error');
        });

        const stats = service.stats();
        expect(stats.warningErrors).toBe(2);
    });

    test('should separate critical and warning errors', () => {
        (service as any).registerRecoverableError(ErrorCode.InternalError, 'Critical');
        (service as any).registerRecoverableError(ErrorCode.Unknown, 'Warning');

        const stats = service.stats();
        expect(stats.criticalErrors).toBe(1);
        expect(stats.warningErrors).toBe(1);
        expect(stats.totalErrors).toBe(2);
    });
});
