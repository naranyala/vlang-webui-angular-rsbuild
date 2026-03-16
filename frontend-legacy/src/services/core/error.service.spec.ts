import { TestBed } from '@angular/core/testing';
import { ErrorService, AppError, ErrorSeverity } from './error.service';

describe('ErrorService', () => {
  let service: ErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ErrorService],
    });

    service = TestBed.inject(ErrorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should start with no errors', () => {
      expect(service.hasError()).toBe(false);
      expect(service.errorCount()).toBe(0);
      expect(service.lastError()).toBeNull();
    });
  });

  describe('report()', () => {
    it('should report an error', () => {
      const errorData: Partial<AppError> = {
        code: 'TEST_ERROR',
        message: 'Test error message',
        severity: 'error',
      };

      service.report(errorData);

      expect(service.hasError()).toBe(true);
      expect(service.errorCount()).toBe(1);
      expect(service.lastError()).toBeTruthy();
    });

    it('should set error properties with defaults', () => {
      service.report({ message: 'Test' });

      const error = service.lastError();
      expect(error).toBeTruthy();
      expect(error?.code).toBe('UNKNOWN');
      expect(error?.message).toBe('Test');
      expect(error?.severity).toBe('error');
      expect(error?.timestamp).toBeInstanceOf(Date);
    });

    it('should use provided error properties', () => {
      const errorData: Partial<AppError> = {
        code: 'CUSTOM_CODE',
        message: 'Custom message',
        details: 'Error details',
        severity: 'critical',
        context: { key: 'value' },
      };

      service.report(errorData);

      const error = service.lastError() as AppError;
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.message).toBe('Custom message');
      expect(error.details).toBe('Error details');
      expect(error.severity).toBe('critical');
      expect(error.context).toEqual({ key: 'value' });
    });

    it('should add errors to history', () => {
      service.report({ message: 'Error 1' });
      service.report({ message: 'Error 2' });
      service.report({ message: 'Error 3' });

      expect(service.errorCount()).toBe(3);
      expect(service.lastError()?.message).toBe('Error 3');
    });
  });

  describe('clear()', () => {
    it('should clear active error', () => {
      service.report({ message: 'Test error' });
      expect(service.hasError()).toBe(true);

      service.clear();

      expect(service.hasError()).toBe(false);
      expect(service.activeError()).toBeNull();
    });

    it('should not clear error history', () => {
      service.report({ message: 'Error 1' });
      service.report({ message: 'Error 2' });

      service.clear();

      expect(service.errorCount()).toBe(2);
      expect(service.hasError()).toBe(false);
    });
  });

  describe('clearAll()', () => {
    it('should clear all errors', () => {
      service.report({ message: 'Error 1' });
      service.report({ message: 'Error 2' });

      service.clearAll();

      expect(service.errorCount()).toBe(0);
      expect(service.hasError()).toBe(false);
      expect(service.lastError()).toBeNull();
    });
  });

  describe('getHistory()', () => {
    it('should return error history', () => {
      service.report({ message: 'Error 1', code: 'ERR1' });
      service.report({ message: 'Error 2', code: 'ERR2' });

      const history = service.getHistory();

      expect(history).toHaveLength(2);
      expect(history[0].code).toBe('ERR1');
      expect(history[1].code).toBe('ERR2');
    });

    it('should return a copy of history', () => {
      service.report({ message: 'Test' });

      const history1 = service.getHistory();
      history1.push({ code: 'FAKE', message: 'Fake', severity: 'error' as ErrorSeverity, timestamp: new Date() });

      const history2 = service.getHistory();
      expect(history2).toHaveLength(1);
    });
  });

  describe('validationError()', () => {
    it('should create validation error', () => {
      const error = service.validationError('Invalid email');

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid email');
      expect(error.severity).toBe('warning');
    });

    it('should include field in context', () => {
      const error = service.validationError('Required', 'email');

      expect(error.context).toEqual({ field: 'email' });
    });
  });

  describe('networkError()', () => {
    it('should create network error', () => {
      const error = service.networkError('Connection failed');

      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.message).toBe('Connection failed');
      expect(error.severity).toBe('error');
    });

    it('should include URL in context', () => {
      const error = service.networkError('Timeout', 'https://api.example.com');

      expect(error.context).toEqual({ url: 'https://api.example.com' });
    });
  });

  describe('internalError()', () => {
    it('should create internal error', () => {
      const error = service.internalError('Something went wrong');

      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.message).toBe('Something went wrong');
      expect(error.severity).toBe('critical');
    });

    it('should include details', () => {
      const error = service.internalError('Error', 'Detailed explanation');

      expect(error.details).toBe('Detailed explanation');
    });
  });

  describe('fromResult()', () => {
    it('should return value from successful result', () => {
      const result = { ok: true as const, value: 'test value' };

      const value = service.fromResult(result, 'Default');

      expect(value).toBe('test value');
    });

    it('should report error and return null for failed result', () => {
      const result = { ok: false as const, error: { message: 'Custom error' } };
      const reportSpy = jest.spyOn(service, 'report');

      const value = service.fromResult(result, 'Default error');

      expect(value).toBeNull();
      expect(reportSpy).toHaveBeenCalledWith({
        message: 'Custom error',
        severity: 'error',
      });
    });

    it('should use default message when error message is missing', () => {
      const result = { ok: false as const };
      const reportSpy = jest.spyOn(service, 'report');

      service.fromResult(result, 'Default error');

      expect(reportSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Default error' })
      );
    });
  });

  describe('error severity', () => {
    it('should handle all severity levels', () => {
      const severities: ErrorSeverity[] = ['info', 'warning', 'error', 'critical'];

      severities.forEach(severity => {
        service.report({ message: `${severity} test`, severity });
        expect(service.lastError()?.severity).toBe(severity);
        service.clear();
      });
    });
  });

  describe('error context', () => {
    it('should preserve context data', () => {
      const context = {
        userId: 123,
        action: 'delete',
        metadata: { key: 'value' },
      };

      service.report({
        message: 'Context test',
        context,
      });

      expect(service.lastError()?.context).toEqual(context);
    });
  });

  describe('timestamp', () => {
    it('should set timestamp when error is reported', () => {
      const before = Date.now();
      service.report({ message: 'Test' });
      const after = Date.now();

      const timestamp = service.lastError()?.timestamp.getTime();

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });
});
