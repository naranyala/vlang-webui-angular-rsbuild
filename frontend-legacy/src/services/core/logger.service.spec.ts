import { TestBed } from '@angular/core/testing';
import { LoggerService, Logger } from './logger.service';
import { ErrorService } from './error.service';

describe('LoggerService', () => {
  let service: LoggerService;
  let errorService: ErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggerService, ErrorService],
    });

    service = TestBed.inject(LoggerService);
    errorService = TestBed.inject(ErrorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getLogger()', () => {
    it('should create logger with context', () => {
      const logger = service.getLogger('TestContext');

      expect(logger).toBeDefined();
      expect(logger instanceof Logger).toBe(true);
    });

    it('should create logger with custom options', () => {
      const logger = service.getLogger('TestContext', {
        showTimestamp: false,
        showLevel: false,
        minLevel: 'warn',
      });

      expect(logger).toBeDefined();
    });
  });

  describe('Logger instance', () => {
    let logger: Logger;

    beforeEach(() => {
      logger = service.getLogger('TestLogger');
    });

    it('should log debug messages', () => {
      expect(() => logger.debug('Debug message')).not.toThrow();
    });

    it('should log info messages', () => {
      expect(() => logger.info('Info message')).not.toThrow();
    });

    it('should log warn messages', () => {
      expect(() => logger.warn('Warn message')).not.toThrow();
    });

    it('should log error messages', () => {
      expect(() => logger.error('Error message')).not.toThrow();
    });

    it('should log with data', () => {
      const data = { key: 'value', count: 42 };

      expect(() => logger.info('Message with data', data)).not.toThrow();
    });
  });

  describe('log levels', () => {
    it('should respect minLevel setting', () => {
      const logger = service.getLogger('MinLevelTest', { minLevel: 'warn' });

      // These should be filtered out
      logger.debug('Debug');
      logger.info('Info');

      const history = service.getHistory();
      const debugLogs = history.filter(h => h.message.includes('Debug'));
      const infoLogs = history.filter(h => h.message.includes('Info'));

      expect(debugLogs).toHaveLength(0);
      expect(infoLogs).toHaveLength(0);
    });

    it('should log all levels when minLevel is debug', () => {
      const logger = service.getLogger('AllLevels', { minLevel: 'debug' });

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      const history = service.getHistory();

      expect(history.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('log history', () => {
    it('should store logs in history', () => {
      const logger = service.getLogger('HistoryTest');

      logger.info('Message 1');
      logger.info('Message 2');
      logger.info('Message 3');

      const history = service.getHistory();

      expect(history.length).toBeGreaterThanOrEqual(3);
    });

    it('should include timestamp in history', () => {
      const logger = service.getLogger('TimestampTest');
      const before = Date.now();

      logger.info('Test');

      const history = service.getHistory();
      const lastLog = history[history.length - 1];

      expect(lastLog.timestamp.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('should include level in history', () => {
      const logger = service.getLogger('LevelTest');

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      const history = service.getHistory();

      const levels = history.map(h => h.level);
      expect(levels).toContain('debug');
      expect(levels).toContain('info');
      expect(levels).toContain('warn');
      expect(levels).toContain('error');
    });

    it('should limit history to 1000 entries', () => {
      const logger = service.getLogger('LimitTest');

      // Log 1005 messages
      for (let i = 0; i < 1005; i++) {
        logger.info(`Message ${i}`);
      }

      const history = service.getHistory();
      expect(history.length).toBeLessThanOrEqual(1000);
    });

    it('should clear history', () => {
      const logger = service.getLogger('ClearTest');

      logger.info('Message 1');
      logger.info('Message 2');

      service.clearHistory();

      expect(service.getHistory()).toHaveLength(0);
    });
  });

  describe('error logging', () => {
    it('should report errors to ErrorService', () => {
      const logger = service.getLogger('ErrorTest');
      const reportSpy = jest.spyOn(errorService, 'report');

      logger.error('Error message');

      expect(reportSpy).toHaveBeenCalled();
      const reportedError = reportSpy.mock.calls[0][0];
      expect(reportedError.message).toContain('Error message');
      expect(reportedError.severity).toBe('error');
    });

    it('should include context in error report', () => {
      const logger = service.getLogger('ContextTest');
      const reportSpy = jest.spyOn(errorService, 'report');

      const context = { userId: 123, action: 'test' };
      logger.error('Error with context', context);

      expect(reportSpy).toHaveBeenCalled();
    });
  });

  describe('log formatting', () => {
    it('should include context in log message', () => {
      const logger = service.getLogger('MyContext');

      logger.info('Test message');

      const history = service.getHistory();
      const lastLog = history[history.length - 1];

      expect(lastLog.message).toContain('[MyContext]');
    });

    it('should include level in log message', () => {
      const logger = service.getLogger('LevelFormat', { showLevel: true });

      logger.info('Test');

      const history = service.getHistory();
      const lastLog = history[history.length - 1];

      expect(lastLog.message).toContain('[INFO]');
    });

    it('should include timestamp when enabled', () => {
      const logger = service.getLogger('TimeFormat', { showTimestamp: true });

      logger.info('Test');

      const history = service.getHistory();
      const lastLog = history[history.length - 1];

      // Timestamp should be in ISO format
      expect(lastLog.message).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('multiple loggers', () => {
    it('should maintain separate contexts', () => {
      const logger1 = service.getLogger('Context1');
      const logger2 = service.getLogger('Context2');

      logger1.info('Message from context 1');
      logger2.info('Message from context 2');

      const history = service.getHistory();

      const context1Logs = history.filter(h => h.message.includes('Context1'));
      const context2Logs = history.filter(h => h.message.includes('Context2'));

      expect(context1Logs).toHaveLength(1);
      expect(context2Logs).toHaveLength(1);
    });

    it('should share history across loggers', () => {
      const logger1 = service.getLogger('Shared1');
      const logger2 = service.getLogger('Shared2');

      logger1.info('Message 1');
      logger2.info('Message 2');

      const history = service.getHistory();

      expect(history.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('console output', () => {
    beforeEach(() => {
      jest.spyOn(console, 'debug').mockImplementation();
      jest.spyOn(console, 'info').mockImplementation();
      jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call console.debug for debug logs', () => {
      const logger = service.getLogger('ConsoleTest');
      logger.debug('Debug');

      expect(console.debug).toHaveBeenCalled();
    });

    it('should call console.info for info logs', () => {
      const logger = service.getLogger('ConsoleTest');
      logger.info('Info');

      expect(console.info).toHaveBeenCalled();
    });

    it('should call console.warn for warn logs', () => {
      const logger = service.getLogger('ConsoleTest');
      logger.warn('Warn');

      expect(console.warn).toHaveBeenCalled();
    });

    it('should call console.error for error logs', () => {
      const logger = service.getLogger('ConsoleTest');
      logger.error('Error');

      expect(console.error).toHaveBeenCalled();
    });
  });
});
