/**
 * Nested WinBox Layout Models
 * macOS Finder-inspired nested window management
 */

export interface NestedWindowConfig {
  id: string;
  title: string;
  icon?: string;
  /** Initial position as percentage (0-100) or pixels */
  x?: string | number;
  y?: string | number;
  /** Initial size */
  width?: string | number;
  height?: string | number;
  /** Parent window ID for nesting */
  parentId?: string;
  /** Position relative to parent: 'top', 'bottom', 'left', 'right', 'overlay' */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'overlay';
  /** Split configuration for nested windows */
  split?: SplitConfig;
  /** Content to render inside */
  content?: string | HTMLElement;
  /** Window options */
  options?: WindowOptions;
}

export interface SplitConfig {
  /** Split direction: 'horizontal' (left|right) or 'vertical' (top|bottom) */
  direction: 'horizontal' | 'vertical';
  /** Initial split position as percentage (0-100) */
  position: number;
  /** Minimum size for first pane */
  minSize1?: number;
  /** Minimum size for second pane */
  minSize2?: number;
  /** Maximum size for first pane */
  maxSize1?: number;
  /** Maximum size for second pane */
  maxSize2?: number;
}

export interface WindowOptions {
  background?: string;
  border?: number;
  radius?: number;
  controls?: {
    minimize?: boolean;
    maximize?: boolean;
    close?: boolean;
  };
  resizable?: boolean;
  movable?: boolean;
  maximizable?: boolean;
  minimizable?: boolean;
  closable?: boolean;
}

export interface NestedWindowInstance {
  config: NestedWindowConfig;
  element: HTMLElement;
  children: NestedWindowInstance[];
  parent: NestedWindowInstance | null;
  /** WinBox instance if this is a root window */
  winbox?: any;
  /** Split state */
  splitState?: SplitState;
}

export interface SplitState {
  /** Current split position as percentage */
  position: number;
  /** Whether splitter is being dragged */
  isDragging: boolean;
  /** Splitter element */
  element?: HTMLElement;
  /** First pane element */
  pane1?: HTMLElement;
  /** Second pane element */
  pane2?: HTMLElement;
}

export interface FinderLayoutConfig {
  /** Main window configuration */
  mainWindow: Omit<NestedWindowConfig, 'parentId'>;
  /** Left sidebar configuration */
  sidebar?: NestedWindowPaneConfig;
  /** Middle content area configuration */
  content?: NestedWindowPaneConfig;
  /** Right preview panel configuration */
  preview?: NestedWindowPaneConfig;
  /** Bottom status bar configuration */
  statusBar?: NestedWindowPaneConfig;
}

export interface NestedWindowPaneConfig {
  id: string;
  title: string;
  icon?: string;
  width?: string | number;
  height?: string | number;
  options?: WindowOptions;
}

export const DEFAULT_FINDER_LAYOUT: FinderLayoutConfig = {
  mainWindow: {
    id: 'main-finder',
    title: 'Finder',
    icon: '😊',
    width: '90%',
    height: '85%',
    x: '5%',
    y: '5%',
    options: {
      background: '#ffffff',
      border: 0,
      radius: 10,
      controls: {
        minimize: true,
        maximize: true,
        close: true,
      },
    },
  },
  sidebar: {
    id: 'sidebar',
    title: 'Sidebar',
    icon: '📑',
    width: 220,
    options: {
      background: '#f6f6f6',
    },
  },
  content: {
    id: 'content',
    title: 'Content',
    icon: '📁',
    options: {
      background: '#ffffff',
    },
  },
  preview: {
    id: 'preview',
    title: 'Preview',
    icon: '👁️',
    width: 300,
    options: {
      background: '#f9f9f9',
    },
  },
  statusBar: {
    id: 'statusbar',
    title: 'Status',
    options: {
      background: '#f0f0f0',
    },
  },
};

export const MULTI_WINDOW_LAYOUT: FinderLayoutConfig = {
  mainWindow: {
    id: 'multi-finder',
    title: 'Multi-Pane Finder',
    icon: '🗂️',
    width: '95%',
    height: '90%',
    x: '2.5%',
    y: '3%',
    options: {
      background: '#ffffff',
      border: 0,
      radius: 10,
      controls: {
        minimize: true,
        maximize: true,
        close: true,
      },
    },
  },
  sidebar: {
    id: 'sidebar',
    title: 'Sidebar',
    icon: '📑',
    width: 200,
    options: {
      background: 'linear-gradient(180deg, #f6f6f6 0%, #ebebeb 100%)',
    },
  },
  content: {
    id: 'content',
    title: 'Main Content',
    icon: '📂',
    options: {
      background: '#ffffff',
    },
  },
  preview: {
    id: 'preview',
    title: 'Preview',
    icon: '👁️',
    width: 280,
    options: {
      background: 'linear-gradient(180deg, #f9f9f9 0%, #f0f0f0 100%)',
    },
  },
  statusBar: {
    id: 'statusbar',
    title: 'Status',
    options: {
      background: 'linear-gradient(180deg, #f6f6f6 0%, #ebebeb 100%)',
    },
  },
};
