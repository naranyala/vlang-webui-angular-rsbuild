import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { WinBoxService } from '../core/winbox.service';
import { ErrorService } from '../services/core/error.service';
import { LoggerService } from '../services/core/logger.service';
import { UserService } from '../services/app/user.service';
import { WebUIService } from '../services/app/webui.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let winboxMock: Partial<WinBoxService>;
  let errorService: ErrorService;
  let loggerService: LoggerService;
  let userService: UserService;
  let webuiService: WebUIService;

  beforeEach(() => {
    winboxMock = {
      isAvailable: jest.fn().mockReturnValue(true),
      create: jest.fn(),
      getConstructor: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AppComponent,
        { provide: WinBoxService, useValue: winboxMock },
        ErrorService,
        LoggerService,
        UserService,
        WebUIService,
      ],
    });

    component = TestBed.inject(AppComponent);
    errorService = TestBed.inject(ErrorService);
    loggerService = TestBed.inject(LoggerService);
    userService = TestBed.inject(UserService);
    webuiService = TestBed.inject(WebUIService);
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have empty window entries', () => {
      expect(component.windowEntries().length).toBe(0);
    });

    it('should have default active bottom tab', () => {
      expect(component.activeBottomTab()).toBe('overview');
    });

    it('should have panels collapsed by default', () => {
      expect(component.topCollapsed()).toBe(true);
      expect(component.bottomCollapsed()).toBe(true);
    });

    it('should have no windows initially', () => {
      expect(component.hasWindows()).toBe(false);
    });
  });

  describe('ngOnInit()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should close all windows on init', () => {
      const closeSpy = jest.spyOn(component, 'closeAllWindows');
      component.ngOnInit();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should open login window after delay', () => {
      const openSpy = jest.spyOn(component, 'openCard');
      component.ngOnInit();

      // Fast-forward time
      jest.advanceTimersByTime(500);

      expect(openSpy).toHaveBeenCalled();
    });
  });

  describe('openCard()', () => {
    let mockWinBox: any;

    beforeEach(() => {
      mockWinBox = {
        __windowId: '',
        __cardTitle: '',
        __cardId: 0,
        onclose: null,
        focus: jest.fn(),
        minimize: jest.fn(),
        restore: jest.fn(),
        close: jest.fn(),
      };

      (window as any).WinBox = jest.fn().mockImplementation(() => mockWinBox);
    });

    afterEach(() => {
      delete (window as any).WinBox;
    });

    it('should create WinBox window for card', () => {
      const card = {
        id: 1,
        title: 'Test Card',
        description: 'Test Description',
        icon: '📊',
        color: '#667eea',
        content: '<div>Test Content</div>',
      };

      component.openCard(card);

      expect(window.WinBox).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'card-1',
          title: '📊 Test Card',
          background: '#667eea',
        })
      );
    });

    it('should add window to entries', () => {
      const card = {
        id: 1,
        title: 'Test',
        description: 'Test',
        icon: '📊',
        color: '#667eea',
        content: '<div>Test</div>',
      };

      component.openCard(card);

      expect(component.windowEntries().length).toBe(1);
      expect(component.windowEntries()[0].title).toBe('Test');
    });

    it('should mark window as focused', () => {
      const card = {
        id: 1,
        title: 'Test',
        description: 'Test',
        icon: '📊',
        color: '#667eea',
        content: '<div>Test</div>',
      };

      component.openCard(card);

      expect(component.windowEntries()[0].focused).toBe(true);
    });

    it('should handle WinBox not available', () => {
      delete (window as any).WinBox;
      const reportSpy = jest.spyOn(errorService, 'report');

      const card = {
        id: 1,
        title: 'Test',
        description: 'Test',
        icon: '📊',
        color: '#667eea',
        content: '<div>Test</div>',
      };

      component.openCard(card);

      expect(reportSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'WinBox not available',
        })
      );
    });

    it('should handle errors gracefully', () => {
      (window as any).WinBox = jest.fn().mockImplementation(() => {
        throw new Error('WinBox error');
      });

      const reportSpy = jest.spyOn(errorService, 'report');

      const card = {
        id: 1,
        title: 'Test',
        description: 'Test',
        icon: '📊',
        color: '#667eea',
        content: '<div>Test</div>',
      };

      component.openCard(card);

      expect(reportSpy).toHaveBeenCalled();
    });

    it('should set up onclose handler', () => {
      const card = {
        id: 1,
        title: 'Test',
        description: 'Test',
        icon: '📊',
        color: '#667eea',
        content: '<div>Test</div>',
      };

      component.openCard(card);

      expect(mockWinBox.onclose).toBeDefined();
    });

    it('should remove window on close', () => {
      const card = {
        id: 1,
        title: 'Test',
        description: 'Test',
        icon: '📊',
        color: '#667eea',
        content: '<div>Test</div>',
      };

      component.openCard(card);
      expect(component.windowEntries().length).toBe(1);

      // Trigger close handler
      mockWinBox.onclose();

      expect(component.windowEntries().length).toBe(0);
    });
  });

  describe('closeAllWindows()', () => {
    let mockWinBox: any;

    beforeEach(() => {
      mockWinBox = {
        min: false,
        restore: jest.fn(),
        close: jest.fn(),
      };

      (component as any).existingBoxes = [mockWinBox, mockWinBox];
    });

    it('should close all windows', () => {
      component.closeAllWindows();

      expect(mockWinBox.close).toHaveBeenCalled();
    });

    it('should restore minimized windows before closing', () => {
      mockWinBox.min = true;
      component.closeAllWindows();

      expect(mockWinBox.restore).toHaveBeenCalled();
      expect(mockWinBox.close).toHaveBeenCalled();
    });

    it('should clear window entries', () => {
      component.windowEntries.update(entries => [
        ...entries,
        { id: '1', title: 'Test', minimized: false, focused: true },
      ]);

      component.closeAllWindows();

      expect(component.windowEntries().length).toBe(0);
    });

    it('should clear existing boxes', () => {
      component.closeAllWindows();

      expect((component as any).existingBoxes.length).toBe(0);
    });

    it('should handle errors gracefully', () => {
      mockWinBox.close = jest.fn().mockImplementation(() => {
        throw new Error('Close error');
      });

      expect(() => component.closeAllWindows()).not.toThrow();
    });
  });

  describe('activateWindow()', () => {
    let mockWinBox: any;

    beforeEach(() => {
      mockWinBox = {
        __windowId: 'test-id',
        min: false,
        focus: jest.fn(),
        restore: jest.fn(),
      };

      (component as any).existingBoxes = [mockWinBox];
    });

    it('should focus existing window', () => {
      component.activateWindow('test-id');

      expect(mockWinBox.focus).toHaveBeenCalled();
    });

    it('should restore minimized window', () => {
      mockWinBox.min = true;
      component.activateWindow('test-id');

      expect(mockWinBox.restore).toHaveBeenCalled();
    });

    it('should mark window as focused', () => {
      component.windowEntries.update(entries => [
        ...entries,
        { id: 'test-id', title: 'Test', minimized: true, focused: false },
      ]);

      component.activateWindow('test-id');

      expect(component.windowEntries()[0].focused).toBe(true);
      expect(component.windowEntries()[0].minimized).toBe(false);
    });

    it('should handle non-existent window', () => {
      expect(() => component.activateWindow('non-existent')).not.toThrow();
    });
  });

  describe('showMainMenu()', () => {
    beforeEach(() => {
      (component as any).existingBoxes = [
        { min: false, minimize: jest.fn() },
        { min: false, minimize: jest.fn() },
      ];
    });

    it('should minimize all windows', () => {
      component.showMainMenu();

      (component as any).existingBoxes.forEach((box: any) => {
        expect(box.minimize).toHaveBeenCalledWith(true);
      });
    });

    it('should mark all windows as minimized and unfocused', () => {
      component.windowEntries.update(entries => [
        ...entries,
        { id: '1', title: 'Test1', minimized: false, focused: true },
        { id: '2', title: 'Test2', minimized: false, focused: false },
      ]);

      component.showMainMenu();

      const entries = component.windowEntries();
      expect(entries.every(e => e.minimized)).toBe(true);
      expect(entries.every(e => e.focused)).toBe(false);
    });
  });

  describe('toggleTop()', () => {
    it('should toggle top panel collapsed state', () => {
      expect(component.topCollapsed()).toBe(true);

      component.toggleTop();

      expect(component.topCollapsed()).toBe(false);

      component.toggleTop();

      expect(component.topCollapsed()).toBe(true);
    });
  });

  describe('toggleBottom()', () => {
    it('should toggle bottom panel collapsed state', () => {
      expect(component.bottomCollapsed()).toBe(true);

      component.toggleBottom();

      expect(component.bottomCollapsed()).toBe(false);

      component.toggleBottom();

      expect(component.bottomCollapsed()).toBe(true);
    });
  });

  describe('selectBottomTab()', () => {
    it('should change active bottom tab', () => {
      expect(component.activeBottomTab()).toBe('overview');

      component.selectBottomTab('metrics');

      expect(component.activeBottomTab()).toBe('metrics');
    });

    it('should expand bottom panel if collapsed', () => {
      expect(component.bottomCollapsed()).toBe(true);

      component.selectBottomTab('metrics');

      expect(component.bottomCollapsed()).toBe(false);
    });
  });

  describe('hasFocusedWindow()', () => {
    it('should return false when no windows', () => {
      expect(component.hasFocusedWindow()).toBe(false);
    });

    it('should return true when has focused window', () => {
      component.windowEntries.update(entries => [
        ...entries,
        { id: '1', title: 'Test', minimized: false, focused: true },
      ]);

      expect(component.hasFocusedWindow()).toBe(true);
    });

    it('should return false when all windows unfocused', () => {
      component.windowEntries.update(entries => [
        ...entries,
        { id: '1', title: 'Test', minimized: false, focused: false },
      ]);

      expect(component.hasFocusedWindow()).toBe(false);
    });
  });

  describe('computed signals', () => {
    it('should compute connectionState from webuiService', () => {
      const state = component.connectionState();
      expect(state).toBeDefined();
    });

    it('should compute hasWindows from windowEntries', () => {
      expect(component.hasWindows()).toBe(false);

      component.windowEntries.update(entries => [
        ...entries,
        { id: '1', title: 'Test', minimized: false, focused: true },
      ]);

      expect(component.hasWindows()).toBe(true);
    });
  });
});
