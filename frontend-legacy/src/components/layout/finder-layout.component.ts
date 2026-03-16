import {
  Component,
  input,
  output,
  signal,
  computed,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SplitPaneComponent } from './split-pane.component';
import { WinBoxService, NestedWindowInstance } from '../../core/winbox-nested.service';
import { FinderLayoutConfig, DEFAULT_FINDER_LAYOUT, FileSystemItem } from '../../models';

@Component({
  selector: 'app-finder-layout',
  standalone: true,
  imports: [CommonModule, SplitPaneComponent],
  template: `
    <div class="finder-layout">
      <!-- Top Breadcrumb Bar -->
      <div class="breadcrumb-bar">
        <div class="breadcrumb-path">
          @for (crumb of breadcrumbs(); track crumb.path; let last = $last; let i = $index) {
            @if (i > 0) {
              <span class="breadcrumb-separator">/</span>
            }
            <button
              class="breadcrumb-item"
              [class.active]="last"
              (click)="onBreadcrumbClick(crumb.path)"
              [title]="crumb.label"
            >
              <span class="breadcrumb-icon">{{ crumb.icon }}</span>
              <span class="breadcrumb-label">{{ crumb.label }}</span>
            </button>
          }
        </div>
        <div class="breadcrumb-actions">
          <button class="action-button" (click)="togglePreview()" [title]="'Toggle Preview'">
            <span class="action-icon">{{ previewCollapsed() ? '👁️' : '🙈' }}</span>
          </button>
        </div>
      </div>

      <!-- Main Two-Column Split Pane Layout (Content | Preview) -->
      <div class="finder-content">
        <app-split-pane
          [direction]="'vertical'"
          [panes]="layoutPanes()"
          (paneResized)="onPaneResized($event)"
          (paneCollapsed)="onPaneCollapsed($event)"
          (paneExpanded)="onPaneExpanded($event)"
        >
          <!-- Content Pane -->
          <div class="pane content-pane" data-pane-index="0">
            <div class="pane-header">
              <span class="pane-title">{{ currentFolderName() }}</span>
              <span class="pane-count">{{ currentItems().length }} items</span>
            </div>
            <div class="pane-body content-body">
              <div class="list-view">
                <div class="list-header">
                  <div class="list-col name">Name</div>
                  <div class="list-col date">Date Modified</div>
                  <div class="list-col size">Size</div>
                  <div class="list-col kind">Kind</div>
                </div>
                @for (item of currentItems(); track item.id) {
                  <div
                    class="list-item"
                    [class.selected]="selectedItem()?.id === item.id"
                    (click)="selectItem(item)"
                    (dblclick)="openItem(item)"
                  >
                    <div class="list-col name">
                      <span class="item-icon">{{ item.icon || (item.type === 'folder' ? '📁' : '📄') }}</span>
                      {{ item.name }}
                    </div>
                    <div class="list-col date">{{ item.modifiedAt || '-' }}</div>
                    <div class="list-col size">{{ formatSize(item.size) }}</div>
                    <div class="list-col kind">{{ item.kind || (item.type === 'folder' ? 'Folder' : 'File') }}</div>
                  </div>
                } @empty {
                  <div class="empty-list">
                    <span class="empty-icon">📂</span>
                    <span class="empty-text">This folder is empty</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Preview Pane -->
          <div class="pane preview-pane" data-pane-index="1">
            <div class="pane-header">
              <span class="pane-title">👁️ Preview</span>
              <button class="pane-close" (click)="togglePreview()" title="Close Preview">✕</button>
            </div>
            <div class="pane-body preview-body">
              @if (selectedItem()) {
                <div class="preview-content">
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
                      <span class="value path-value">{{ selectedItem()!.path }}</span>
                    </div>
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
        </app-split-pane>
      </div>

      <!-- Status Bar -->
      <div class="finder-statusbar">
        <div class="status-left">
          <span class="status-indicator" [class.connected]="connectionState().connected"></span>
          <span class="status-text">{{ connectionState().connected ? 'Connected' : 'Disconnected' }}</span>
        </div>
        <div class="status-right">
          <span class="status-info">
            {{ currentItems().length }} item{{ currentItems().length !== 1 ? 's' : '' }}
            @if (totalSize() > 0) {
              <span class="status-separator">•</span>
              {{ formatSize(totalSize()) }}
            }
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .finder-layout {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }

    /* Breadcrumb Bar */
    .breadcrumb-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 40px;
      padding: 0 16px;
      background: linear-gradient(180deg, #f6f6f6 0%, #ebebeb 100%);
      border-bottom: 1px solid #d0d0d0;
      flex-shrink: 0;
    }

    .breadcrumb-path {
      display: flex;
      align-items: center;
      gap: 4px;
      overflow: hidden;
    }

    .breadcrumb-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      background: transparent;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      color: #333;
      transition: all 0.15s;
      white-space: nowrap;
    }

    .breadcrumb-item:hover {
      background: rgba(102, 126, 234, 0.15);
    }

    .breadcrumb-item.active {
      background: rgba(102, 126, 234, 0.2);
      color: #667eea;
      font-weight: 600;
    }

    .breadcrumb-separator {
      color: #999;
      font-size: 12px;
      padding: 0 2px;
    }

    .breadcrumb-icon {
      font-size: 14px;
    }

    .breadcrumb-label {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .breadcrumb-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-button {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.05);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      transition: all 0.15s;
    }

    .action-button:hover {
      background: rgba(102, 126, 234, 0.15);
      transform: scale(1.05);
    }

    /* Content Area */
    .finder-content {
      flex: 1;
      overflow: hidden;
    }

    .pane {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .pane-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.03);
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      font-size: 12px;
      font-weight: 600;
      color: #666;
      flex-shrink: 0;
    }

    .pane-title {
      display: flex;
      align-items: center;
      gap: 6px;
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

    .pane-body {
      flex: 1;
      overflow: auto;
    }

    /* Content Views */
    .content-body {
      background: #fff;
    }

    .list-view {
      width: 100%;
    }

    .list-header {
      display: grid;
      grid-template-columns: 2fr 1fr 100px 1fr;
      padding: 8px 16px;
      background: #f6f6f6;
      border-bottom: 1px solid #e0e0e0;
      font-size: 11px;
      font-weight: 600;
      color: #666;
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

    .list-item:hover {
      background: rgba(102, 126, 234, 0.1);
    }

    .list-item.selected {
      background: rgba(102, 126, 234, 0.2);
    }

    .list-col {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .list-col.name {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .item-icon {
      font-size: 16px;
    }

    .empty-state,
    .empty-list {
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

    /* Preview Pane */
    .preview-body {
      background: linear-gradient(180deg, #f9f9f9 0%, #f0f0f0 100%);
    }

    .preview-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 20px;
      gap: 20px;
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

    .value.path-value {
      font-size: 11px;
      font-family: monospace;
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
    .finder-statusbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 28px;
      padding: 0 12px;
      background: linear-gradient(180deg, #f6f6f6 0%, #ebebeb 100%);
      border-top: 1px solid #d0d0d0;
      font-size: 11px;
      color: #666;
      flex-shrink: 0;
    }

    .status-left,
    .status-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #999;
      transition: all 0.3s;
    }

    .status-indicator.connected {
      background: #4ade80;
      box-shadow: 0 0 6px rgba(74, 222, 128, 0.5);
    }

    .status-separator {
      color: #ccc;
    }
  `],
})
export class FinderLayoutComponent implements OnInit, OnDestroy {
  private readonly winboxService = inject(WinBoxService);

  config = input<FinderLayoutConfig>(DEFAULT_FINDER_LAYOUT);

  readonly pathChanged = output<string>();
  readonly itemSelected = output<FileSystemItem>();
  readonly itemOpened = output<FileSystemItem>();

  // State signals
  readonly currentPath = signal<string>('/Documents');
  readonly selectedItem = signal<FileSystemItem | null>(null);
  readonly previewCollapsed = signal<boolean>(false);

  // Navigation history
  private readonly history = signal<string[]>([]);
  private readonly historyIndex = signal<number>(-1);

  // Connection state (from WebUI service or mock)
  readonly connectionState = signal<{ connected: boolean; port?: number }>({ connected: true });

  // Computed
  readonly currentFolderName = computed(() => {
    const path = this.currentPath();
    const parts = path.split('/').filter(p => p);
    return parts[parts.length - 1] || 'Home';
  });

  readonly breadcrumbs = computed(() => {
    const path = this.currentPath();
    const parts = path.split('/').filter(p => p);
    const crumbs: Array<{ label: string; path: string; icon: string }> = [
      { label: 'Home', path: '/', icon: '🏠' },
    ];

    let currentPath = '';
    for (const part of parts) {
      currentPath += '/' + part;
      crumbs.push({
        label: part,
        path: currentPath,
        icon: this.getFolderIcon(part),
      });
    }

    return crumbs;
  });

  readonly currentItems = computed(() => this.getDemoItems(this.currentPath()));

  readonly totalSize = computed(() => {
    const items = this.currentItems();
    return items.reduce((sum, item) => sum + (item.size || 0), 0);
  });

  readonly layoutPanes = computed(() => [
    {
      id: 'content',
      size: 1, // flexible
      minSize: 300,
    },
    {
      id: 'preview',
      size: 280,
      minSize: 200,
      maxSize: 500,
      collapsed: this.previewCollapsed(),
    },
  ]);

  ngOnInit(): void {
    this.navigateTo(this.currentPath());
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  navigateTo(path: string): void {
    this.currentPath.set(path);
    this.history.update(h => [...h.slice(0, this.historyIndex() + 1), path]);
    this.historyIndex.update(i => i + 1);
    this.pathChanged.emit(path);
  }

  onBreadcrumbClick(path: string): void {
    this.navigateTo(path);
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

  selectItem(item: FileSystemItem): void {
    this.selectedItem.set(item);
    this.itemSelected.emit(item);
  }

  openItem(item: FileSystemItem): void {
    if (item.type === 'folder') {
      this.navigateTo(item.path);
    }
    this.itemOpened.emit(item);
  }

  togglePreview(): void {
    this.previewCollapsed.update(v => !v);
  }

  onPaneResized(event: { paneIndex: number; size: number }): void {
    // Handle pane resize if needed
  }

  onPaneCollapsed(index: number): void {
    // Index 1 is preview pane in two-column layout
    if (index === 1) {
      this.previewCollapsed.set(true);
    }
  }

  onPaneExpanded(index: number): void {
    // Index 1 is preview pane in two-column layout
    if (index === 1) {
      this.previewCollapsed.set(false);
    }
  }

  getDemoItems(path: string): FileSystemItem[] {
    const items: FileSystemItem[] = [
      { id: '1', name: 'Project Files', type: 'folder', path: `${path}/Project Files`, icon: '📁', kind: 'Folder' },
      { id: '2', name: 'Documents', type: 'folder', path: `${path}/Documents`, icon: '📁', kind: 'Folder' },
      { id: '3', name: 'Images', type: 'folder', path: `${path}/Images`, icon: '📁', kind: 'Folder' },
      { id: '4', name: 'Report.pdf', type: 'file', size: 2048576, kind: 'PDF Document', modifiedAt: '2024-01-15', path: `${path}/Report.pdf`, icon: '📄' },
      { id: '5', name: 'Budget.xlsx', type: 'file', size: 524288, kind: 'Excel Spreadsheet', modifiedAt: '2024-02-20', path: `${path}/Budget.xlsx`, icon: '📊' },
      { id: '6', name: 'Presentation.key', type: 'file', size: 15728640, kind: 'Keynote Presentation', modifiedAt: '2024-03-10', path: `${path}/Presentation.key`, icon: '📊' },
      { id: '7', name: 'Photo.jpg', type: 'file', size: 3145728, kind: 'JPEG Image', modifiedAt: '2024-04-05', path: `${path}/Photo.jpg`, icon: '🖼️' },
      { id: '8', name: 'Video.mp4', type: 'file', size: 104857600, kind: 'MPEG-4 Video', modifiedAt: '2024-05-12', path: `${path}/Video.mp4`, icon: '🎬' },
    ];
    return items;
  }

  formatSize(bytes?: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
