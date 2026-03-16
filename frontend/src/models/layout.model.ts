/**
 * macOS File Explorer-inspired Layout Models
 */

export interface SplitPane {
  id: string;
  size: number; // Percentage (0-100) or pixels
  minSize?: number;
  maxSize?: number;
  collapsible?: boolean;
  collapsed?: boolean;
}

export interface HorizontalSplitLayout {
  id: string;
  panes: SplitPane[];
  splitterPositions: number[]; // Percentage positions
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  type: 'folder' | 'file' | 'separator' | 'device';
  path?: string;
  children?: SidebarItem[];
  expanded?: boolean;
  selected?: boolean;
  badge?: number;
}

export interface ToolbarAction {
  id: string;
  icon: string;
  label: string;
  tooltip?: string;
  disabled?: boolean;
  type: 'button' | 'dropdown' | 'search' | 'spacer';
  actions?: ToolbarAction[];
}

export interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: string;
}

export interface ViewOptions {
  viewMode: 'icons' | 'list' | 'columns' | 'coverflow';
  sortBy: 'name' | 'date' | 'size' | 'kind';
  sortAscending: boolean;
  showStatusBar: boolean;
  showPathBar: boolean;
  showPreview: boolean;
  iconSize: 'small' | 'medium' | 'large';
}

export interface FileSystemItem {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'disk' | 'volume';
  size?: number;
  modifiedAt?: string;
  kind?: string;
  path: string;
  icon?: string;
  children?: FileSystemItem[];
  isLoading?: boolean;
}

// Predefined sidebar structure (macOS-style)
export const SIDEBAR_SECTIONS: SidebarItem[] = [
  {
    id: 'favorites',
    label: 'Favorites',
    icon: '★',
    type: 'folder',
    expanded: true,
    children: [
      { id: 'applications', label: 'Applications', icon: '⌘', type: 'folder', path: '/Applications' },
      { id: 'desktop', label: 'Desktop', icon: '🖥️', type: 'folder', path: '/Desktop' },
      { id: 'documents', label: 'Documents', icon: '📄', type: 'folder', path: '/Documents' },
      { id: 'downloads', label: 'Downloads', icon: '⬇️', type: 'folder', path: '/Downloads' },
    ],
  },
  {
    id: 'separator-1',
    label: '',
    icon: '',
    type: 'separator',
  },
  {
    id: 'cloud',
    label: 'Cloud',
    icon: '☁️',
    type: 'folder',
    expanded: false,
    children: [
      { id: 'icloud', label: 'iCloud Drive', icon: '☁️', type: 'folder', path: '/iCloud' },
    ],
  },
  {
    id: 'separator-2',
    label: '',
    icon: '',
    type: 'separator',
  },
  {
    id: 'locations',
    label: 'Locations',
    icon: '📍',
    type: 'folder',
    expanded: false,
    children: [
      { id: 'airdrop', label: 'AirDrop', icon: '📡', type: 'device', path: 'airdrop://' },
      { id: 'network', label: 'Network', icon: '🌐', type: 'device', path: 'network://' },
    ],
  },
  {
    id: 'separator-3',
    label: '',
    icon: '',
    type: 'separator',
  },
  {
    id: 'tags',
    label: 'Tags',
    icon: '🏷️',
    type: 'folder',
    expanded: false,
    children: [
      { id: 'tag-red', label: 'Red', icon: '🔴', type: 'folder', path: 'tag:red' },
      { id: 'tag-orange', label: 'Orange', icon: '🟠', type: 'folder', path: 'tag:orange' },
      { id: 'tag-yellow', label: 'Yellow', icon: '🟡', type: 'folder', path: 'tag:yellow' },
      { id: 'tag-green', label: 'Green', icon: '🟢', type: 'folder', path: 'tag:green' },
      { id: 'tag-blue', label: 'Blue', icon: '🔵', type: 'folder', path: 'tag:blue' },
      { id: 'tag-purple', label: 'Purple', icon: '🟣', type: 'folder', path: 'tag:purple' },
    ],
  },
];

// Toolbar actions (macOS-style)
export const DEFAULT_TOOLBAR_ACTIONS: ToolbarAction[] = [
  { id: 'back', icon: '◀', label: 'Back', tooltip: 'Go Back', type: 'button' },
  { id: 'forward', icon: '▶', label: 'Forward', tooltip: 'Go Forward', disabled: true, type: 'button' },
  { id: 'view', icon: '⊞', label: 'View', tooltip: 'View Options', type: 'dropdown' },
  { id: 'spacer-1', label: '', icon: '', type: 'spacer' },
  { id: 'search', icon: '🔍', label: 'Search', type: 'search' },
  { id: 'spacer-2', label: '', icon: '', type: 'spacer' },
  { id: 'sidebar', icon: '◧', label: 'Sidebar', tooltip: 'Toggle Sidebar', type: 'button' },
  { id: 'preview', icon: '👁️', label: 'Preview', tooltip: 'Toggle Preview', type: 'button' },
];

// Default layout configuration
export const DEFAULT_LAYOUT: HorizontalSplitLayout = {
  id: 'main-layout',
  panes: [
    { id: 'sidebar', size: 220, minSize: 160, maxSize: 400, collapsible: true },
    { id: 'content', size: 1, minSize: 300 }, // 1 means flexible
    { id: 'preview', size: 300, minSize: 200, maxSize: 500, collapsible: true, collapsed: true },
  ],
  splitterPositions: [220, -300], // Second is negative (from right)
};
