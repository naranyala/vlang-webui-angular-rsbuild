import { Injectable, signal, computed } from '@angular/core';
import { LoggerService } from '../services/core/logger.service';

export interface WinBoxOptions {
  id?: string;
  title?: string;
  background?: string;
  border?: number;
  radius?: number;
  width?: string | number;
  height?: string | number;
  x?: string | number;
  y?: string | number;
  max?: boolean;
  html?: string;
  url?: string;
  mount?: HTMLElement;
  controls?: {
    minimize?: boolean;
    maximize?: boolean;
    close?: boolean;
  };
  onfocus?: () => void;
  onblur?: () => void;
  onminimize?: () => void;
  onmaximize?: () => void;
  onrestore?: () => void;
  onclose?: () => boolean | void;
  onresize?: (width: number, height: number) => void;
  onmove?: (x: number, y: number) => void;
}

export interface WinBoxInstance {
  id: string;
  title: string;
  body: HTMLElement;
  window: HTMLElement;
  focus: (value?: boolean) => WinBoxInstance;
  blur: (value?: boolean) => WinBoxInstance;
  minimize: (value?: boolean) => WinBoxInstance;
  maximize: (value?: boolean) => WinBoxInstance;
  restore: () => WinBoxInstance;
  fullscreen: (value?: boolean) => WinBoxInstance;
  close: (force?: boolean) => boolean;
  move: (x?: number | string, y?: number | string, skipEvent?: boolean) => WinBoxInstance;
  resize: (
    width?: number | string,
    height?: number | string,
    skipEvent?: boolean
  ) => WinBoxInstance;
  setTitle: (title: string) => WinBoxInstance;
  setIcon: (iconUrl: string) => WinBoxInstance;
  setBackground: (color: string) => WinBoxInstance;
  setUrl: (url: string, onLoad?: () => void) => WinBoxInstance;
  mount: (element: HTMLElement) => WinBoxInstance;
  unmount: (returnToParent?: boolean) => WinBoxInstance;
  addClass: (className: string) => WinBoxInstance;
  removeClass: (className: string) => WinBoxInstance;
  toggleClass: (className: string) => WinBoxInstance;
  addControl: (control: {
    class?: string;
    image?: string;
    click?: (e: Event, win: WinBoxInstance) => void;
    index?: number;
  }) => WinBoxInstance;
  removeControl: (controlClass: string) => WinBoxInstance;
  hide: (value?: boolean) => WinBoxInstance;
  show: (value?: boolean) => WinBoxInstance;
  min: boolean;
  max: boolean;
  full: boolean;
  focused: boolean;
  hidden: boolean;
  // Event handlers
  onfocus?: () => void;
  onblur?: () => void;
  onminimize?: () => void;
  onmaximize?: () => void;
  onrestore?: () => void;
  onclose?: () => boolean | void;
  onresize?: (width: number, height: number) => void;
  onmove?: (x: number, y: number) => void;
  // Custom properties added by our application
  __windowId?: string;
  __cardTitle?: string;
  __cardId?: number;
  __isMaximized?: boolean;
  __parentId?: string;
  __childWindows?: string[];
}

export interface NestedWindowConfig {
  id: string;
  title: string;
  icon?: string;
  content: string | HTMLElement;
  parentId?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  size?: { width?: string | number; height?: string | number };
}

@Injectable({
  providedIn: 'root',
})
export class WinBoxService {
  private readonly logger: ReturnType<LoggerService['getLogger']>;
  private winboxConstructor: any = null;

  // Signal-based state for nested windows
  private readonly windows = signal<Map<string, WinBoxInstance>>(new Map());
  private readonly windowHierarchy = signal<Map<string, string[]>>(new Map()); // parentId -> childIds

  readonly windowCount = computed(() => this.windows().size);
  readonly windowIds = computed(() => Array.from(this.windows().keys()));

  constructor(loggerService: LoggerService) {
    this.logger = loggerService.getLogger('WinBoxService');
    if (typeof window !== 'undefined' && (window as any).WinBox) {
      this.winboxConstructor = (window as any).WinBox;
      this.logger.debug('WinBox found on window object');
    } else {
      this.logger.warn('WinBox not found on window - it should be loaded from static/js/winbox.min.js');
    }
  }

  /**
   * Create a new WinBox window
   */
  create(options: WinBoxOptions): WinBoxInstance | null {
    if (!this.winboxConstructor && typeof window !== 'undefined') {
      this.winboxConstructor = (window as any).WinBox;
    }

    if (!this.winboxConstructor) {
      this.logger.error('WinBox constructor not available. Make sure winbox.min.js is loaded.');
      return null;
    }

    try {
      const box = new this.winboxConstructor(options);
      this.logger.debug('WinBox created', { id: options.id, title: options.title });
      return box;
    } catch (error) {
      this.logger.error('Failed to create WinBox', { error, options });
      return null;
    }
  }

  /**
   * Create a nested window inside a parent WinBox
   */
  createNested(parentWindow: WinBoxInstance, config: NestedWindowConfig): WinBoxInstance | null {
    const parentBody = parentWindow.body;
    if (!parentBody) {
      this.logger.error('Parent window has no body element');
      return null;
    }

    // Create container for nested content
    const container = document.createElement('div');
    container.className = 'nested-window-container';
    container.style.cssText = `
      position: absolute;
      top: 40px;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: auto;
      background: #fff;
    `;

    if (typeof config.content === 'string') {
      container.innerHTML = config.content;
    } else {
      container.appendChild(config.content);
    }

    parentBody.appendChild(container);

    // Track hierarchy
    this.windows.update(map => {
      const newMap = new Map(map);
      newMap.set(config.id, parentWindow);
      return newMap;
    });

    this.windowHierarchy.update(map => {
      const newMap = new Map(map);
      const parentId = parentWindow.__windowId || 'root';
      const children = newMap.get(parentId) || [];
      newMap.set(parentId, [...children, config.id]);
      return newMap;
    });

    return parentWindow;
  }

  /**
   * Get child windows of a parent
   */
  getChildWindows(parentId: string): string[] {
    return this.windowHierarchy().get(parentId) || [];
  }

  /**
   * Get parent window of a child
   */
  getParentWindow(childId: string): WinBoxInstance | null {
    const windows = this.windows();
    for (const [id, window] of windows.entries()) {
      const children = this.windowHierarchy().get(id) || [];
      if (children.includes(childId)) {
        return window;
      }
    }
    return null;
  }

  /**
   * Close a window and its children
   */
  closeWithChildren(windowId: string): boolean {
    const box = Array.from(this.windows().values()).find(w => w.__windowId === windowId);
    if (!box) return false;

    // Close children first
    const children = this.windowHierarchy().get(windowId) || [];
    for (const childId of children) {
      this.closeWithChildren(childId);
    }

    // Close this window
    box.close(true);

    // Update state
    this.windows.update(map => {
      const newMap = new Map(map);
      newMap.delete(windowId);
      return newMap;
    });

    this.windowHierarchy.update(map => {
      const newMap = new Map(map);
      newMap.delete(windowId);
      return newMap;
    });

    return true;
  }

  /**
   * Get the WinBox constructor (for advanced usage)
   */
  getConstructor(): any {
    return this.winboxConstructor;
  }

  /**
   * Check if WinBox is available
   */
  isAvailable(): boolean {
    if (!this.winboxConstructor && typeof window !== 'undefined') {
      this.winboxConstructor = (window as any).WinBox;
    }
    return !!this.winboxConstructor;
  }
}
