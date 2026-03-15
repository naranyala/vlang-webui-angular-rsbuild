import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { WebUIService } from './webui.service';
import { ErrorService } from '../core/error.service';
import { LoggerService } from '../core/logger.service';

describe('WebUIService', () => {
  let service: WebUIService;
  let errorService: ErrorService;
  let loggerService: LoggerService;
  let mockNgZone: Partial<NgZone>;

  beforeEach(() => {
    mockNgZone = {
      run: jest.fn((fn: any) => fn()),
    };

    TestBed.configureTestingModule({
      providers: [
        WebUIService,
        ErrorService,
        LoggerService,
        { provide: NgZone, useValue: mockNgZone },
      ],
    });

    service = TestBed.inject(WebUIService);
    errorService = TestBed.inject(ErrorService);
    loggerService = TestBed.inject(LoggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should start disconnected', () => {
      expect(service.connected()).toBe(false);
      expect(service.port()).toBeNull();
    });

    it('should have correct connection state', () => {
      const state = service.connectionState();
      expect(state.connected).toBe(false);
      expect(state.port).toBeNull();
    });
  });

  describe('connection events', () => {
    it('should update state on webui:port event', () => {
      const portEvent = new CustomEvent('webui:port', { detail: { port: 55555 } });
      window.dispatchEvent(portEvent);

      expect(service.connected()).toBe(true);
      expect(service.port()).toBe(55555);
    });

    it('should update state on webui:disconnect event', () => {
      // First connect
      window.dispatchEvent(new CustomEvent('webui:port', { detail: { port: 55555 } }));
      expect(service.connected()).toBe(true);

      // Then disconnect
      window.dispatchEvent(new CustomEvent('webui:disconnect'));
      expect(service.connected()).toBe(false);
    });
  });

  describe('call()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully call backend function', async () => {
      const mockResponse = { data: { id: 1, name: 'Test' } };
      const mockFn = jest.fn();

      // Mock backend function
      (window as any).testFunction = mockFn;

      // Schedule response
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('testFunction_response', { detail: { response: mockResponse } })
        );
      }, 10);

      const result = await service.call('testFunction');

      expect(mockFn).toHaveBeenCalledWith();
      expect(result).toEqual({ id: 1, name: 'Test' });

      delete (window as any).testFunction;
    });

    it('should pass arguments to backend function', async () => {
      const mockFn = jest.fn();
      (window as any).testFunctionWithArgs = mockFn;

      const args = ['arg1', 42, { key: 'value' }];

      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('testFunctionWithArgs_response', { detail: { response: { data: 'ok' } } })
        );
      }, 10);

      await service.call('testFunctionWithArgs', args);

      expect(mockFn).toHaveBeenCalledWith(...args);

      delete (window as any).testFunctionWithArgs;
    });

    it('should handle timeout', async () => {
      const mockFn = jest.fn();
      (window as any).slowFunction = mockFn;

      mockFn.mockImplementation(() => {
        // No response sent - will timeout
      });

      await expect(service.call('slowFunction', [], { timeout: 100 }))
        .rejects
        .toThrow('Backend call timeout');

      delete (window as any).slowFunction;
    });

    it('should handle backend function not found', async () => {
      await expect(service.call('nonExistentFunction'))
        .rejects
        .toThrow('Backend function not found');
    });

    it('should handle backend error response', async () => {
      const mockFn = jest.fn();
      (window as any).errorFunction = mockFn;

      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('errorFunction_response', {
            detail: { response: { error: { message: 'Backend error' } } },
          })
        );
      }, 10);

      await expect(service.call('errorFunction'))
        .rejects
        .toThrow('Backend call failed');

      delete (window as any).errorFunction;
    });

    it('should handle typed response', async () => {
      interface TestData {
        id: number;
        name: string;
      }

      const mockResponse = { data: { id: 1, name: 'Test' } as TestData };
      (window as any).typedFunction = jest.fn();

      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('typedFunction_response', { detail: { response: mockResponse } })
        );
      }, 10);

      const result = await service.call<TestData>('typedFunction');

      expect(result.id).toBe(1);
      expect(result.name).toBe('Test');

      delete (window as any).typedFunction;
    });
  });

  describe('callAll()', () => {
    it('should call multiple functions in parallel', async () => {
      (window as any).func1 = jest.fn();
      (window as any).func2 = jest.fn();

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('func1_response', { detail: { response: { data: 'result1' } } }));
        window.dispatchEvent(new CustomEvent('func2_response', { detail: { response: { data: 'result2' } } }));
      }, 10);

      const results = await service.callAll({
        func1: { name: 'func1' },
        func2: { name: 'func2' },
      });

      expect(results[0]).toBe('result1');
      expect(results[1]).toBe('result2');

      delete (window as any).func1;
      delete (window as any).func2;
    });
  });

  describe('resetConnection()', () => {
    it('should reset connection state', () => {
      // First connect
      window.dispatchEvent(new CustomEvent('webui:port', { detail: { port: 55555 } }));
      expect(service.connected()).toBe(true);
      expect(service.port()).toBe(55555);

      // Reset
      service.resetConnection();

      expect(service.connected()).toBe(false);
      expect(service.port()).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should report errors to ErrorService', async () => {
      const mockFn = jest.fn();
      (window as any).errorFunction = mockFn;

      const errorSpy = jest.spyOn(errorService, 'report');

      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('errorFunction_response', {
            detail: { response: { error: { message: 'Test error' } } },
          })
        );
      }, 10);

      try {
        await service.call('errorFunction');
      } catch {
        // Expected
      }

      expect(errorSpy).toHaveBeenCalled();

      delete (window as any).errorFunction;
    });
  });
});
