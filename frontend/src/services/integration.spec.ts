import { TestBed } from '@angular/core/testing';
import { ErrorService, LoggerService, WebUIService, UserService } from '../services';

describe('Service Integration Tests', () => {
  let errorService: ErrorService;
  let loggerService: LoggerService;
  let webuiService: WebUIService;
  let userService: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ErrorService,
        LoggerService,
        WebUIService,
        UserService,
      ],
    });

    errorService = TestBed.inject(ErrorService);
    loggerService = TestBed.inject(LoggerService);
    webuiService = TestBed.inject(WebUIService);
    userService = TestBed.inject(UserService);
  });

  it('should inject all services', () => {
    expect(errorService).toBeTruthy();
    expect(loggerService).toBeTruthy();
    expect(webuiService).toBeTruthy();
    expect(userService).toBeTruthy();
  });

  describe('ErrorService + LoggerService Integration', () => {
    it('should log errors when reported', () => {
      const reportSpy = jest.spyOn(errorService, 'report');
      
      errorService.report({
        message: 'Test error',
        severity: 'error',
      });

      expect(reportSpy).toHaveBeenCalled();
      expect(errorService.hasError()).toBe(true);
    });

    it('should maintain error history', () => {
      errorService.report({ message: 'Error 1', severity: 'error' });
      errorService.report({ message: 'Error 2', severity: 'error' });
      errorService.report({ message: 'Error 3', severity: 'error' });

      const history = errorService.getHistory();
      expect(history).toHaveLength(3);
      expect(history[0].message).toBe('Error 1');
      expect(history[2].message).toBe('Error 3');
    });

    it('should clear errors properly', () => {
      errorService.report({ message: 'Test', severity: 'error' });
      expect(errorService.hasError()).toBe(true);

      errorService.clear();
      expect(errorService.hasError()).toBe(false);
      expect(errorService.getHistory()).toHaveLength(1); // History preserved

      errorService.clearAll();
      expect(errorService.getHistory()).toHaveLength(0);
    });
  });

  describe('LoggerService + ErrorService Integration', () => {
    it('should report errors when logging at error level', () => {
      const reportSpy = jest.spyOn(errorService, 'report');
      const logger = loggerService.getLogger('TestLogger');

      logger.error('Test error message');

      expect(reportSpy).toHaveBeenCalled();
    });

    it('should not report non-error logs', () => {
      const reportSpy = jest.spyOn(errorService, 'report');
      const logger = loggerService.getLogger('TestLogger');

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');

      expect(reportSpy).not.toHaveBeenCalled();
    });
  });

  describe('WebUIService Connection State', () => {
    it('should start disconnected', () => {
      const state = webuiService.connectionState();
      expect(state.connected).toBe(false);
      expect(state.port).toBeNull();
    });

    it('should update connection state on webui:port event', () => {
      const portEvent = new CustomEvent('webui:port', { detail: { port: 55555 } });
      window.dispatchEvent(portEvent);

      const state = webuiService.connectionState();
      expect(state.connected).toBe(true);
      expect(state.port).toBe(55555);
    });

    it('should handle disconnect event', () => {
      // First connect
      window.dispatchEvent(new CustomEvent('webui:port', { detail: { port: 55555 } }));
      expect(webuiService.connectionState().connected).toBe(true);

      // Then disconnect
      window.dispatchEvent(new CustomEvent('webui:disconnect'));
      expect(webuiService.connectionState().connected).toBe(false);
    });

    it('should reset connection state', () => {
      window.dispatchEvent(new CustomEvent('webui:port', { detail: { port: 55555 } }));
      expect(webuiService.connectionState().connected).toBe(true);

      webuiService.resetConnection();
      expect(webuiService.connectionState().connected).toBe(false);
      expect(webuiService.connectionState().port).toBeNull();
    });
  });

  describe('UserService + WebUIService Integration', () => {
    it('should handle backend call failures gracefully', async () => {
      // Simulate backend not available
      const originalFn = (window as any).getUsers;
      delete (window as any).getUsers;

      try {
        await expect(userService.getAll()).rejects.toThrow();
      } finally {
        // Restore
        (window as any).getUsers = originalFn;
      }
    });
  });

  describe('Multiple Concurrent Backend Calls', () => {
    it('should handle multiple simultaneous calls', async () => {
      const mockResponse = { data: [] };
      
      // Setup mock handlers
      (window as any).testCall1 = jest.fn();
      (window as any).testCall2 = jest.fn();
      (window as any).testCall3 = jest.fn();

      // Schedule responses
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('testCall1_response', { detail: { response: mockResponse } }));
        window.dispatchEvent(new CustomEvent('testCall2_response', { detail: { response: mockResponse } }));
        window.dispatchEvent(new CustomEvent('testCall3_response', { detail: { response: mockResponse } }));
      }, 10);

      // Make concurrent calls
      const promises = [
        webuiService.call('testCall1'),
        webuiService.call('testCall2'),
        webuiService.call('testCall3'),
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);

      // Cleanup
      delete (window as any).testCall1;
      delete (window as any).testCall2;
      delete (window as any).testCall3;
    });
  });

  describe('Error Propagation Through Services', () => {
    it('should propagate errors from WebUIService to ErrorService', async () => {
      const reportSpy = jest.spyOn(errorService, 'report');
      
      (window as any).failingCall = jest.fn();

      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('failingCall_response', {
            detail: { response: { error: { message: 'Backend error' } } },
          })
        );
      }, 10);

      try {
        await webuiService.call('failingCall');
      } catch {
        // Expected
      }

      expect(reportSpy).toHaveBeenCalled();

      delete (window as any).failingCall;
    });
  });

  describe('Service State Management', () => {
    it('should maintain independent state', () => {
      // ErrorService state
      errorService.report({ message: 'Test', severity: 'error' });
      expect(errorService.hasError()).toBe(true);

      // LoggerService state
      const logger = loggerService.getLogger('StateTest');
      logger.info('Test message');
      expect(loggerService.getHistory()).toHaveLength(1);

      // WebUIService state
      expect(webuiService.connectionState().connected).toBe(false);

      // UserService state (should be independent)
      expect(userService).toBeDefined();
    });
  });

  describe('Async Operation Handling', () => {
    it('should handle async service operations', async () => {
      const logger = loggerService.getLogger('AsyncTest');
      
      logger.info('Starting async operation');
      await new Promise(resolve => setTimeout(resolve, 10));
      logger.info('Async operation complete');

      const history = loggerService.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].message).toContain('Starting');
      expect(history[1].message).toContain('complete');
    });

    it('should handle errors in async operations', async () => {
      const reportSpy = jest.spyOn(errorService, 'report');
      const logger = loggerService.getLogger('AsyncErrorTest');

      try {
        logger.info('Starting operation');
        await new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Async error')), 10)
        );
      } catch {
        logger.error('Operation failed');
      }

      expect(reportSpy).toHaveBeenCalled();
    });
  });
});
