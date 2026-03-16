import { Injectable, signal, computed } from '@angular/core';
import { LoggerService } from '../services/core/logger.service';
import { FinderLayoutConfig, DEFAULT_FINDER_LAYOUT, NestedWindowConfig, WindowOptions } from '../models';

export interface NestedWindowInstance {
  id: string;
  element: HTMLElement;
  parent: NestedWindowInstance | null;
  children: NestedWindowInstance[];
  winbox?: any;
  config: NestedWindowConfig;
}

export interface WinBoxOptions extends WindowOptions {
  id?: string;
  title?: string;
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

export interface SplitPaneState {
  id: string;
  size: number; // in pixels
  collapsed: boolean;
  element?: HTMLElement;
}

export interface SplitterState {
  id: string;
  isDragging: boolean;
  element?: HTMLElement;
}

@Injectable({
  providedIn: 'root',
})
export class WinBoxService {
  private readonly logger: ReturnType<LoggerService['getLogger']>;
  private winboxConstructor: any = null;

  // Signal-based state for nested windows
  private readonly windows = signal<Map<string, NestedWindowInstance>>(new Map());
  private readonly rootWindows = signal<NestedWindowInstance[]>([]);

  // Split pane state
  private readonly splitPanes = signal<Map<string, SplitPaneState>>(new Map());
  private readonly splitters = signal<Map<string, SplitterState>>(new Map());

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
   * Create a new root WinBox window with nested Finder-style layout
   */
  createFinderWindow(config: FinderLayoutConfig = DEFAULT_FINDER_LAYOUT): NestedWindowInstance | null {
    const rootWindow = this.createRootWindow(config.mainWindow);
    if (!rootWindow) {
      return null;
    }

    // Create the finder layout structure inside the root window
    this.createFinderLayout(rootWindow, config);

    return rootWindow;
  }

  /**
   * Create a root WinBox window
   */
  createRootWindow(windowConfig: Omit<NestedWindowConfig, 'parentId'>): NestedWindowInstance | null {
    if (!this.winboxConstructor && typeof window !== 'undefined') {
      this.winboxConstructor = (window as any).WinBox;
    }

    if (!this.winboxConstructor) {
      this.logger.error('WinBox constructor not available');
      return null;
    }

    try {
      const options: WinBoxOptions = {
        id: windowConfig.id,
        title: windowConfig.icon ? `${windowConfig.icon} ${windowConfig.title}` : windowConfig.title,
        background: windowConfig.options?.background,
        border: windowConfig.options?.border ?? 0,
        radius: windowConfig.options?.radius ?? 10,
        width: windowConfig.width ?? '90%',
        height: windowConfig.height ?? '85%',
        x: windowConfig.x ?? '5%',
        y: windowConfig.y ?? '5%',
        controls: windowConfig.options?.controls,
        onclose: () => {
          this.closeWithChildren(windowConfig.id);
          return true;
        },
      };

      const box = new this.winboxConstructor(options);
      
      // Create nested window instance
      const nestedWindow: NestedWindowInstance = {
        id: windowConfig.id,
        element: box.body,
        parent: null,
        children: [],
        winbox: box,
        config: windowConfig,
      };

      // Track window
      this.windows.update(map => {
        const newMap = new Map(map);
        newMap.set(windowConfig.id, nestedWindow);
        return newMap;
      });

      this.rootWindows.update(windows => [...windows, nestedWindow]);

      this.logger.info(`Root window created: ${windowConfig.id}`);
      return nestedWindow;
    } catch (error) {
      this.logger.error('Failed to create root window', { error });
      return null;
    }
  }

  /**
   * Create Finder-style layout inside a window
   */
  private createFinderLayout(
    rootWindow: NestedWindowInstance,
    config: FinderLayoutConfig
  ): void {
    const rootBody = rootWindow.element;
    if (!rootBody) return;

    // Create main container with flex layout
    const container = document.createElement('div');
    container.className = 'finder-layout-container';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      overflow: hidden;
    `;

    // Create horizontal layout: sidebar | content | preview
    const horizontalContainer = document.createElement('div');
    horizontalContainer.className = 'finder-horizontal-container';
    horizontalContainer.style.cssText = `
      display: flex;
      flex: 1;
      overflow: hidden;
    `;

    // Create sidebar pane
    let sidebarElement: HTMLElement | undefined;
    if (config.sidebar) {
      sidebarElement = this.createPaneElement(
        config.sidebar,
        rootWindow,
        'sidebar-pane'
      );
      horizontalContainer.appendChild(sidebarElement);
    }

    // Create sidebar splitter
    if (config.sidebar && config.content) {
      const sidebarSplitter = this.createSplitter(
        'sidebar-splitter',
        'vertical',
        rootWindow
      );
      horizontalContainer.appendChild(sidebarSplitter);
    }

    // Create content pane
    let contentElement: HTMLElement | undefined;
    if (config.content) {
      contentElement = this.createPaneElement(
        config.content,
        rootWindow,
        'content-pane'
      );
      horizontalContainer.appendChild(contentElement);
    }

    // Create preview splitter
    if (config.content && config.preview) {
      const previewSplitter = this.createSplitter(
        'preview-splitter',
        'vertical',
        rootWindow
      );
      horizontalContainer.appendChild(previewSplitter);
    }

    // Create preview pane
    let previewElement: HTMLElement | undefined;
    if (config.preview) {
      previewElement = this.createPaneElement(
        config.preview,
        rootWindow,
        'preview-pane'
      );
      horizontalContainer.appendChild(previewElement);
    }

    container.appendChild(horizontalContainer);

    // Create status bar
    if (config.statusBar) {
      const statusBarElement = this.createPaneElement(
        config.statusBar,
        rootWindow,
        'status-bar-pane'
      );
      statusBarElement.style.cssText = `
        flex-shrink: 0;
        height: 28px;
        border-top: 1px solid #e0e0e0;
      `;
      container.appendChild(statusBarElement);
    }

    rootBody.appendChild(container);
    rootBody.style.padding = '0';
    rootBody.style.overflow = 'hidden';

    // Initialize split pane state
    this.initializeSplitPaneState(config);
  }

  /**
   * Create a pane element
   */
  private createPaneElement(
    paneConfig: Omit<NestedWindowConfig, 'parentId' | 'position'>,
    parent: NestedWindowInstance,
    className: string
  ): HTMLElement {
    const pane = document.createElement('div');
    pane.className = `finder-pane ${className}`;
    pane.id = paneConfig.id;
    pane.style.cssText = `
      flex-shrink: 0;
      overflow: hidden;
      background: ${paneConfig.options?.background || '#ffffff'};
    `;

    // Set initial width if specified
    if (paneConfig.width && typeof paneConfig.width === 'number') {
      pane.style.width = `${paneConfig.width}px`;
    }

    // Create pane header
    const header = document.createElement('div');
    header.className = 'pane-header';
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.03);
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      font-size: 12px;
      font-weight: 600;
      color: #666;
    `;

    const title = document.createElement('span');
    title.textContent = paneConfig.icon ? `${paneConfig.icon} ${paneConfig.title}` : paneConfig.title;
    header.appendChild(title);

    pane.appendChild(header);

    // Create pane content area
    const contentArea = document.createElement('div');
    contentArea.className = 'pane-content';
    contentArea.style.cssText = `
      flex: 1;
      overflow: auto;
    `;

    if (paneConfig.content) {
      if (typeof paneConfig.content === 'string') {
        contentArea.innerHTML = paneConfig.content;
      } else {
        contentArea.appendChild(paneConfig.content);
      }
    }

    pane.appendChild(contentArea);

    // Track child
    const childWindow: NestedWindowInstance = {
      id: paneConfig.id,
      element: contentArea,
      parent,
      children: [],
      config: paneConfig as NestedWindowConfig,
    };

    parent.children.push(childWindow);
    this.windows.update(map => {
      const newMap = new Map(map);
      newMap.set(paneConfig.id, childWindow);
      return newMap;
    });

    return pane;
  }

  /**
   * Create a splitter element
   */
  private createSplitter(
    id: string,
    orientation: 'vertical' | 'horizontal',
    parent: NestedWindowInstance
  ): HTMLElement {
    const splitter = document.createElement('div');
    splitter.className = `finder-splitter finder-splitter-${orientation}`;
    splitter.id = id;

    if (orientation === 'vertical') {
      splitter.style.cssText = `
        width: 1px;
        cursor: col-resize;
        background: #e0e0e0;
        flex-shrink: 0;
        transition: background 0.2s;
      `;
      splitter.onmouseenter = () => {
        splitter.style.background = '#667eea';
      };
      splitter.onmouseleave = () => {
        if (!this.splitters().get(id)?.isDragging) {
          splitter.style.background = '#e0e0e0';
        }
      };
    } else {
      splitter.style.cssText = `
        height: 1px;
        cursor: row-resize;
        background: #e0e0e0;
        flex-shrink: 0;
      `;
    }

    // Track splitter state
    const splitterState: SplitterState = {
      id,
      isDragging: false,
      element: splitter,
    };

    this.splitters.update(map => {
      const newMap = new Map(map);
      newMap.set(id, splitterState);
      return newMap;
    });

    return splitter;
  }

  /**
   * Initialize split pane state
   */
  private initializeSplitPaneState(config: FinderLayoutConfig): void {
    const panes: [string, number | undefined][] = [
      ['sidebar', config.sidebar?.width as number | undefined],
      ['content', undefined],
      ['preview', config.preview?.width as number | undefined],
    ];

    for (const [id, width] of panes) {
      if (width) {
        const paneState: SplitPaneState = {
          id,
          size: width,
          collapsed: false,
        };
        this.splitPanes.update(map => {
          const newMap = new Map(map);
          newMap.set(id, paneState);
          return newMap;
        });
      }
    }
  }

  /**
   * Handle splitter drag
   */
  startSplitterDrag(
    splitterId: string,
    leftPaneId: string,
    rightPaneId: string,
    event: MouseEvent
  ): void {
    const splitterState = this.splitters().get(splitterId);
    if (!splitterState) return;

    splitterState.isDragging = true;

    const leftPaneState = this.splitPanes().get(leftPaneId);
    const rightPaneState = this.splitPanes().get(rightPaneId);

    const startX = event.clientX;
    const leftPaneElement = document.getElementById(leftPaneId);
    const rightPaneElement = document.getElementById(rightPaneId);

    const onMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;

      if (leftPaneElement && leftPaneState) {
        const newWidth = Math.max(
          leftPaneState.size,
          Math.min(400, leftPaneState.size + deltaX)
        );
        leftPaneElement.style.width = `${newWidth}px`;
        leftPaneState.size = newWidth;
      }

      if (rightPaneElement && rightPaneState) {
        const newWidth = Math.max(
          rightPaneState.size,
          Math.min(500, rightPaneState.size - deltaX)
        );
        rightPaneElement.style.width = `${newWidth}px`;
        rightPaneState.size = newWidth;
      }

      this.splitPanes.update(map => {
        const newMap = new Map(map);
        if (leftPaneState) newMap.set(leftPaneId, leftPaneState);
        if (rightPaneState) newMap.set(rightPaneId, rightPaneState);
        return newMap;
      });
    };

    const onMouseUp = () => {
      splitterState.isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * Create a nested window inside a parent
   */
  createNested(
    parentWindow: NestedWindowInstance,
    config: NestedWindowConfig
  ): NestedWindowInstance | null {
    const parentElement = parentWindow.element;
    if (!parentElement) {
      this.logger.error('Parent window has no element');
      return null;
    }

    // Create container based on position
    const container = document.createElement('div');
    container.id = config.id;

    const position = config.position || 'overlay';

    if (position === 'left' || position === 'right') {
      container.className = 'nested-pane-horizontal';
      container.style.cssText = `
        flex-shrink: 0;
        width: ${config.width || 250}px;
        background: ${config.options?.background || '#ffffff'};
      `;
    } else if (position === 'top' || position === 'bottom') {
      container.className = 'nested-pane-vertical';
      container.style.cssText = `
        flex-shrink: 0;
        height: ${config.height || 200}px;
        background: ${config.options?.background || '#ffffff'};
      `;
    } else {
      // Overlay position
      container.className = 'nested-pane-overlay';
      container.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: ${config.options?.background || '#ffffff'};
        overflow: auto;
      `;
    }

    if (config.content) {
      if (typeof config.content === 'string') {
        container.innerHTML = config.content;
      } else {
        container.appendChild(config.content);
      }
    }

    parentElement.appendChild(container);

    // Track nested window
    const nestedWindow: NestedWindowInstance = {
      id: config.id,
      element: container,
      parent: parentWindow,
      children: [],
      config,
    };

    parentWindow.children.push(nestedWindow);

    this.windows.update(map => {
      const newMap = new Map(map);
      newMap.set(config.id, nestedWindow);
      return newMap;
    });

    this.logger.info(`Nested window created: ${config.id} inside ${parentWindow.id}`);
    return nestedWindow;
  }

  /**
   * Get child windows of a parent
   */
  getChildWindows(parentId: string): NestedWindowInstance[] {
    const parent = this.windows().get(parentId);
    return parent?.children || [];
  }

  /**
   * Get parent window of a child
   */
  getParentWindow(childId: string): NestedWindowInstance | null {
    const child = this.windows().get(childId);
    return child?.parent || null;
  }

  /**
   * Close a window and its children
   */
  closeWithChildren(windowId: string): boolean {
    const window = this.windows().get(windowId);
    if (!window) return false;

    // Close children first
    for (const child of [...window.children]) {
      this.closeWithChildren(child.id);
    }

    // Remove from parent
    if (window.parent) {
      window.parent.children = window.parent.children.filter(c => c.id !== windowId);
      window.element.remove();
    }

    // Close WinBox if this is a root window
    if (window.winbox) {
      window.winbox.close(true);
    }

    // Update state
    this.windows.update(map => {
      const newMap = new Map(map);
      newMap.delete(windowId);
      return newMap;
    });

    this.rootWindows.update(windows => windows.filter(w => w.id !== windowId));

    this.logger.info(`Window closed: ${windowId}`);
    return true;
  }

  /**
   * Get a window by ID
   */
  getWindow(windowId: string): NestedWindowInstance | undefined {
    return this.windows().get(windowId);
  }

  /**
   * Get all root windows
   */
  getRootWindows(): NestedWindowInstance[] {
    return this.rootWindows();
  }

  /**
   * Toggle pane visibility
   */
  togglePane(paneId: string): void {
    const paneState = this.splitPanes().get(paneId);
    if (!paneState) return;

    const paneElement = document.getElementById(paneId);
    if (!paneElement) return;

    paneState.collapsed = !paneState.collapsed;

    if (paneState.collapsed) {
      paneElement.style.display = 'none';
    } else {
      paneElement.style.display = '';
      paneElement.style.width = `${paneState.size}px`;
    }

    this.splitPanes.update(map => {
      const newMap = new Map(map);
      newMap.set(paneId, paneState);
      return newMap;
    });
  }

  /**
   * Get the WinBox constructor
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
