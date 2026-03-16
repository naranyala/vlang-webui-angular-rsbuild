import {
  Component,
  input,
  output,
  signal,
  computed,
  viewChild,
  ElementRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './sidebar.component';
import { ToolbarComponent } from './toolbar.component';
import { SplitterComponent } from './splitter.component';
import {
  SidebarItem,
  BreadcrumbItem,
  FileSystemItem,
  ViewOptions,
  DEFAULT_LAYOUT,
  HorizontalSplitLayout,
} from '../../models/layout.model';

@Component({
  selector: 'macos-file-explorer',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ToolbarComponent, SplitterComponent],
  template: `
    <div class="macos-file-explorer" [class.preview-visible]="showPreview()">
      <!-- Toolbar -->
      <macos-toolbar
        [breadcrumbs]="breadcrumbs()"
        [sidebarHidden]="sidebarCollapsed()"
        (windowAction)="onWindowAction($event)"
        (navigate)="onNavigate($event)"
        (toolbarAction)="onToolbarAction($event)"
        (search)="onSearch($event)"
      />

      <!-- Main Content Area with Vertical Splitters (Left | Middle | Right) -->
      <div class="explorer-body">
        <!-- Left Pane: Sidebar -->
        <div class="left-pane" [style.width.px]="sidebarWidth()">
          <macos-sidebar
            [collapsed]="sidebarCollapsed()"
            (itemSelected)="onSidebarItemSelected($event)"
          />
        </div>

        <!-- Vertical Splitter 1 (Sidebar | Middle) -->
        <macos-splitter
          orientation="vertical"
          [paneIndex]="0"
          (splitterDragged)="onLeftSplitterDragged($event)"
          (splitterDblClick)="toggleSidebar()"
        />

        <!-- Middle Pane: File Browser -->
        <div class="middle-pane" [style.width.px]="middleWidth()">
          <!-- Middle Header -->
          <div class="pane-header">
            <span class="pane-title">{{ currentFolderName() }}</span>
            <span class="pane-count">{{ currentItems().length }} items</span>
          </div>
          
          <!-- File List -->
          <div class="file-list-container">
            @for (item of currentItems(); track item.id) {
              <div
                class="file-row"
                [class.selected]="selectedItem()?.id === item.id"
                (click)="onFileItemSelected(item)"
                (dblclick)="onFileItemDoubleClicked(item)"
              >
                <span class="file-icon">{{ item.icon || (item.type === 'folder' ? '📁' : '📄') }}</span>
                <span class="file-name">{{ item.name }}</span>
                <span class="file-date">{{ item.modifiedAt || '-' }}</span>
                <span class="file-size">{{ formatSize(item.size) }}</span>
              </div>
            } @empty {
              <div class="empty-state">
                <span class="empty-icon">📂</span>
                <span class="empty-text">This folder is empty</span>
              </div>
            }
          </div>

          <!-- Status Bar -->
          @if (showStatusBar()) {
            <div class="status-bar">
              <span class="status-info">
                {{ currentItems().length }} item{{ currentItems().length !== 1 ? 's' : '' }}
                @if (totalSize() > 0) {
                  <span class="status-separator">•</span>
                  {{ formatSize(totalSize()) }}
                }
              </span>
            </div>
          }
        </div>

        <!-- Vertical Splitter 2 (Middle | Right) -->
        @if (showRightPane()) {
          <macos-splitter
            orientation="vertical"
            [paneIndex]="1"
            (splitterDragged)="onRightSplitterDragged($event)"
            (splitterDblClick)="toggleRightPane()"
          />

          <!-- Right Pane: Preview/Details -->
          <div class="right-pane" [style.width.px]="rightWidth()">
            <!-- Right Header -->
            <div class="pane-header">
              <span class="pane-title">Preview</span>
              <button class="pane-close" (click)="toggleRightPane()">✕</button>
            </div>
            
            <!-- Preview Content -->
            <div class="preview-content">
              @if (selectedItem()) {
                <div class="preview-icon">{{ selectedItem()!.icon || '📄' }}</div>
                <div class="preview-name">{{ selectedItem()!.name }}</div>
                <div class="preview-info">
                  <div class="info-row">
                    <span class="label">Kind:</span>
                    <span class="value">{{ selectedItem()!.kind || 'File' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Size:</span>
                    <span class="value">{{ formatSize(selectedItem()!.size) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Modified:</span>
                    <span class="value">{{ selectedItem()!.modifiedAt || 'Today' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Path:</span>
                    <span class="value">{{ selectedItem()!.path }}</span>
                  </div>
                </div>
              } @else {
                <div class="no-selection">
                  <span class="no-selection-icon">👆</span>
                  <span class="no-selection-text">Select an item to preview</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .macos-file-explorer {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #fff;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }

    .explorer-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* Left Pane - Sidebar */
    .left-pane {
      flex-shrink: 0;
      transition: width 0.2s ease;
      background: linear-gradient(180deg, #f6f6f6 0%, #ebebeb 100%);
      border-right: 1px solid #d0d0d0;
    }

    /* Middle Pane - File Browser */
    .middle-pane {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      background: #fff;
      border-right: 1px solid #e0e0e0;
      transition: width 0.2s ease;
    }

    .pane-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      background: linear-gradient(180deg, #ffffff 0%, #f6f6f6 100%);
      border-bottom: 1px solid #e0e0e0;
      flex-shrink: 0;
    }

    .pane-title {
      font-size: 13px;
      font-weight: 600;
      color: #333;
    }

    .pane-count {
      font-size: 11px;
      color: #999;
    }

    .pane-close {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: none;
      background: rgba(0, 0, 0, 0.05);
      cursor: pointer;
      color: #666;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }

    .pane-close:hover {
      background: rgba(0, 0, 0, 0.1);
    }

    .file-list-container {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .file-list-container::-webkit-scrollbar {
      width: 10px;
    }

    .file-list-container::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 5px;
    }

    .file-list-container::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 5px;
    }

    .file-list-container::-webkit-scrollbar-thumb:hover {
      background: #a1a1c1;
    }

    .file-row {
      display: grid;
      grid-template-columns: 32px 1fr 120px 80px;
      gap: 8px;
      align-items: center;
      padding: 8px 16px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background 0.15s;
      font-size: 13px;
    }

    .file-row:hover {
      background: rgba(102, 126, 234, 0.1);
    }

    .file-row.selected {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
      border-left: 3px solid #667eea;
    }

    .file-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .file-name {
      font-weight: 500;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-row.selected .file-name {
      color: #667eea;
      font-weight: 600;
    }

    .file-date, .file-size {
      font-size: 12px;
      color: #999;
      text-align: right;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: #999;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-text {
      font-size: 14px;
    }

    /* Right Pane - Preview */
    .right-pane {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      background: linear-gradient(180deg, #f9f9f9 0%, #f0f0f0 100%);
      transition: width 0.2s ease;
    }

    .preview-content {
      flex: 1;
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      overflow-y: auto;
    }

    .preview-icon {
      font-size: 96px;
      margin-top: 20px;
    }

    .preview-name {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      text-align: center;
      word-break: break-word;
      max-width: 100%;
    }

    .preview-info {
      width: 100%;
      padding: 16px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 8px;
      font-size: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-row .label {
      color: #666;
      font-weight: 500;
    }

    .info-row .value {
      color: #333;
      text-align: right;
      max-width: 60%;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .no-selection {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #bbb;
      text-align: center;
    }

    .no-selection-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-selection-text {
      font-size: 14px;
    }

    /* Status Bar */
    .status-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 16px;
      background: linear-gradient(180deg, #f6f6f6 0%, #ebebeb 100%);
      border-top: 1px solid #e0e0e0;
      font-size: 11px;
      color: #666;
      flex-shrink: 0;
    }

    .status-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-separator {
      color: #ccc;
    }
  `],
})
export class FileExplorerComponent implements OnInit, OnDestroy {
  initialPath = input<string>('/Documents');
  showStatusBar = input<boolean>(true);
  initialShowPreview = input<boolean>(true);

  readonly pathChanged = output<string>();
  readonly itemSelected = output<FileSystemItem>();
  readonly itemOpened = output<FileSystemItem>();
  readonly searchQuery = output<string>();

  // Layout state
  sidebarWidth = signal<number>(DEFAULT_LAYOUT.panes[0]?.size as number || 220);
  middleWidth = signal<number>(400);
  rightWidth = signal<number>(350);
  sidebarCollapsed = signal<boolean>(false);
  showPreview = signal<boolean>(false);
  showRightPane = signal<boolean>(true);

  // Navigation state
  currentPath = signal<string>('');
  breadcrumbs = signal<BreadcrumbItem[]>([]);
  history = signal<string[]>([]);
  historyIndex = signal<number>(-1);

  // View state
  currentViewMode = signal<string>('columns');
  sortBy = signal<string>('name');
  sortAscending = signal<boolean>(true);
  iconSize = signal<'small' | 'medium' | 'large'>('medium');

  // Selection state
  selectedItem = signal<FileSystemItem | null>(null);

  // File system data (demo data for now)
  private fileSystemData = signal<Map<string, FileSystemItem[]>>(new Map());

  currentItems = computed(() => {
    return this.fileSystemData().get(this.currentPath()) || this.getDemoItems();
  });

  currentFolderName = computed(() => {
    const path = this.currentPath();
    const parts = path.split('/').filter(p => p);
    return parts[parts.length - 1] || 'Home';
  });

  totalSize = computed(() => {
    const item = this.selectedItem();
    return item?.size || 0;
  });

  ngOnInit(): void {
    this.showPreview.set(this.initialShowPreview());
    this.showRightPane.set(this.initialShowPreview());
    this.navigateTo(this.initialPath());
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  navigateTo(path: string): void {
    this.currentPath.set(path);
    this.updateBreadcrumbs(path);
    this.history.update(h => [...h.slice(0, this.historyIndex() + 1), path]);
    this.historyIndex.update(i => i + 1);
    this.pathChanged.emit(path);
  }

  goBack(): void {
    if (this.historyIndex() > 0) {
      this.historyIndex.update(i => i - 1);
      const path = this.history()[this.historyIndex()];
      if (path) {
        this.currentPath.set(path);
        this.updateBreadcrumbs(path);
      }
    }
  }

  goForward(): void {
    if (this.historyIndex() < this.history().length - 1) {
      this.historyIndex.update(i => i + 1);
      const path = this.history()[this.historyIndex()];
      if (path) {
        this.currentPath.set(path);
        this.updateBreadcrumbs(path);
      }
    }
  }

  updateBreadcrumbs(path: string): void {
    const parts = path.split('/').filter(p => p);
    const crumbs: BreadcrumbItem[] = [{ label: 'Home', path: '/', icon: '🏠' }];
    
    let currentPath = '';
    for (const part of parts) {
      currentPath += '/' + part;
      crumbs.push({
        label: part,
        path: currentPath,
        icon: this.getFolderIcon(part),
      });
    }
    
    this.breadcrumbs.set(crumbs);
  }

  getFolderIcon(name: string): string {
    const icons: Record<string, string> = {
      'Documents': '📄',
      'Downloads': '⬇️',
      'Desktop': '🖥️',
      'Applications': '⌘',
      'Pictures': '🖼️',
      'Music': '🎵',
      'Videos': '🎬',
    };
    return icons[name] || '📁';
  }

  getDemoItems(): FileSystemItem[] {
    const items: FileSystemItem[] = [
      { id: '1', name: 'Project Files', type: 'folder', path: `${this.currentPath()}/Project Files`, icon: '📁' },
      { id: '2', name: 'Documents', type: 'folder', path: `${this.currentPath()}/Documents`, icon: '📁' },
      { id: '3', name: 'Images', type: 'folder', path: `${this.currentPath()}/Images`, icon: '📁' },
      { id: '4', name: 'Report.pdf', type: 'file', size: 2048576, kind: 'PDF Document', modifiedAt: '2024-01-15', path: `${this.currentPath()}/Report.pdf`, icon: '📄' },
      { id: '5', name: 'Budget.xlsx', type: 'file', size: 524288, kind: 'Excel Spreadsheet', modifiedAt: '2024-02-20', path: `${this.currentPath()}/Budget.xlsx`, icon: '📊' },
      { id: '6', name: 'Presentation.key', type: 'file', size: 15728640, kind: 'Keynote Presentation', modifiedAt: '2024-03-10', path: `${this.currentPath()}/Presentation.key`, icon: '📊' },
      { id: '7', name: 'Photo.jpg', type: 'file', size: 3145728, kind: 'JPEG Image', modifiedAt: '2024-04-05', path: `${this.currentPath()}/Photo.jpg`, icon: '🖼️' },
      { id: '8', name: 'Video.mp4', type: 'file', size: 104857600, kind: 'MPEG-4 Video', modifiedAt: '2024-05-12', path: `${this.currentPath()}/Video.mp4`, icon: '🎬' },
    ];
    return items;
  }

  onWindowAction(action: 'close' | 'minimize' | 'maximize'): void {
    // Handled by parent component via output
  }

  onNavigate(action: 'back' | 'forward' | string): void {
    if (action === 'back') {
      this.goBack();
    } else if (action === 'forward') {
      this.goForward();
    } else {
      this.navigateTo(action);
    }
  }

  onToolbarAction(action: string): void {
    if (action === 'sidebar') {
      this.toggleSidebar();
    } else if (action === 'preview') {
      this.toggleRightPane();
    } else if (action.startsWith('view:')) {
      const mode = action.split(':')[1];
      if (mode) {
        this.currentViewMode.set(mode);
      }
    } else if (action.startsWith('sort:')) {
      const sortAction = action.split(':')[1];
      if (sortAction === 'order') {
        this.sortAscending.update(v => !v);
      } else if (sortAction) {
        this.sortBy.set(sortAction);
      }
    }
  }

  onSearch(query: string): void {
    this.searchQuery.emit(query);
  }

  onSidebarItemSelected(item: SidebarItem): void {
    if (item.path) {
      this.navigateTo(item.path);
    }
  }

  onFileItemSelected(item: FileSystemItem): void {
    this.selectedItem.set(item);
    this.itemSelected.emit(item);
  }

  onFileItemDoubleClicked(item: FileSystemItem): void {
    if (item.type === 'folder') {
      this.navigateTo(item.path);
    }
    this.itemOpened.emit(item);
  }

  onLeftSplitterDragged(event: { index: number; delta: number }): void {
    const pane0 = DEFAULT_LAYOUT.panes[0];
    const minSize = pane0?.minSize || 160;
    const maxSize = pane0?.maxSize || 400;
    const newWidth = Math.max(
      minSize,
      Math.min(
        maxSize,
        this.sidebarWidth() + event.delta
      )
    );
    this.sidebarWidth.set(newWidth);
  }

  onRightSplitterDragged(event: { index: number; delta: number }): void {
    const newWidth = Math.max(
      200,
      Math.min(
        500,
        this.rightWidth() - event.delta
      )
    );
    this.rightWidth.set(newWidth);
  }

  toggleSidebar(): void {
    const wasCollapsed = this.sidebarCollapsed();
    this.sidebarCollapsed.set(!wasCollapsed);
    if (!wasCollapsed) {
      const pane0 = DEFAULT_LAYOUT.panes[0];
      this.sidebarWidth.set((pane0?.size as number) || 220);
    }
  }

  toggleRightPane(): void {
    this.showRightPane.update(v => !v);
  }

  togglePreview(): void {
    this.showPreview.update(v => !v);
  }

  formatSize(bytes?: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

// Placeholder components for different view modes
@Component({
  selector: 'file-icons-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="icons-view" [class]="'icon-size-' + iconSize()">
      @for (item of items(); track item.id) {
        <div
          class="file-item"
          [class.selected]="selectedItems().has(item.id)"
          (click)="itemSelected.emit(item)"
          (dblclick)="itemDoubleClicked.emit(item)"
        >
          <div class="file-icon">{{ item.icon || (item.type === 'folder' ? '📁' : '📄') }}</div>
          <div class="file-name">{{ item.name }}</div>
        </div>
      }
    </div>
  `,
  styles: [`
    .icons-view {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
      gap: 16px;
      padding: 24px;
    }

    .icon-size-small .file-icon { font-size: 32px; }
    .icon-size-medium .file-icon { font-size: 48px; }
    .icon-size-large .file-icon { font-size: 64px; }

    .file-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .file-item:hover {
      background: rgba(102, 126, 234, 0.1);
    }

    .file-item.selected {
      background: rgba(102, 126, 234, 0.2);
    }

    .file-icon {
      font-size: 48px;
    }

    .file-name {
      font-size: 12px;
      text-align: center;
      word-break: break-word;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  `],
})
export class FileIconsView {
  items = input<FileSystemItem[]>([]);
  iconSize = input<'small' | 'medium' | 'large'>('medium');
  selectedItems = input<Set<string>>(new Set());
  itemSelected = output<FileSystemItem>();
  itemDoubleClicked = output<FileSystemItem>();
}

@Component({
  selector: 'file-list-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="list-view">
      <div class="list-header">
        <div class="list-col name">Name</div>
        <div class="list-col date">Date Modified</div>
        <div class="list-col size">Size</div>
        <div class="list-col kind">Kind</div>
      </div>
      @for (item of sortedItems(); track item.id) {
        <div
          class="list-item"
          [class.selected]="selectedItems().has(item.id)"
          (click)="itemSelected.emit(item)"
          (dblclick)="itemDoubleClicked.emit(item)"
        >
          <div class="list-col name">
            <span class="item-icon">{{ item.icon || (item.type === 'folder' ? '📁' : '📄') }}</span>
            {{ item.name }}
          </div>
          <div class="list-col date">{{ item.modifiedAt || '-' }}</div>
          <div class="list-col size">{{ formatSize(item.size) }}</div>
          <div class="list-col kind">{{ item.kind || (item.type === 'folder' ? 'Folder' : 'File') }}</div>
        </div>
      }
    </div>
  `,
  styles: [`
    .list-view { width: 100%; }
    .list-header {
      display: grid;
      grid-template-columns: 2fr 1fr 100px 1fr;
      padding: 8px 16px;
      background: #f6f6f6;
      border-bottom: 1px solid #e0e0e0;
      font-size: 11px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
    }
    .list-item {
      display: grid;
      grid-template-columns: 2fr 1fr 100px 1fr;
      padding: 8px 16px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background 0.15s;
      font-size: 13px;
    }
    .list-item:hover { background: rgba(102, 126, 234, 0.1); }
    .list-item.selected { background: rgba(102, 126, 234, 0.2); }
    .list-col { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .list-col.name { display: flex; align-items: center; gap: 8px; }
    .item-icon { font-size: 16px; }
  `],
})
export class FileListView {
  items = input<FileSystemItem[]>([]);
  sortBy = input<string>('name');
  sortAscending = input<boolean>(true);
  selectedItems = input<Set<string>>(new Set());
  itemSelected = output<FileSystemItem>();
  itemDoubleClicked = output<FileSystemItem>();

  sortedItems = computed(() => {
    const items = [...this.items()];
    const sortBy = this.sortBy();
    const asc = this.sortAscending();
    items.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'size') comparison = (a.size || 0) - (b.size || 0);
      else if (sortBy === 'kind') comparison = (a.kind || '').localeCompare(b.kind || '');
      return asc ? comparison : -comparison;
    });
    return items;
  });

  formatSize(size?: number): string {
    if (!size) return '-';
    if (size === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
