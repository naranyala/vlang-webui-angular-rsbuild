import {
  Component,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarAction, BreadcrumbItem, DEFAULT_TOOLBAR_ACTIONS, ViewOptions } from '../../models/layout.model';

@Component({
  selector: 'macos-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="macos-toolbar">
      <!-- Window Controls (traffic lights) -->
      <div class="window-controls">
        <button class="window-control close" (click)="windowAction.emit('close')" title="Close">
          <span class="control-icon">✕</span>
        </button>
        <button class="window-control minimize" (click)="windowAction.emit('minimize')" title="Minimize">
          <span class="control-icon">−</span>
        </button>
        <button class="window-control maximize" (click)="windowAction.emit('maximize')" title="Zoom">
          <span class="control-icon">+</span>
        </button>
      </div>

      <!-- Navigation Controls -->
      <div class="toolbar-navigation">
        <button
          class="nav-button"
          [disabled]="!canGoBack()"
          (click)="navigate.emit('back')"
          title="Go Back"
          aria-label="Go Back"
        >
          <span class="nav-icon">◀</span>
        </button>
        <button
          class="nav-button"
          [disabled]="!canGoForward()"
          (click)="navigate.emit('forward')"
          title="Go Forward"
          aria-label="Go Forward"
        >
          <span class="nav-icon">▶</span>
        </button>
      </div>

      <!-- Breadcrumb Path -->
      <div class="breadcrumb-container">
        <nav class="breadcrumb" aria-label="File path">
          @for (item of breadcrumbs(); track item.path; let last = $last) {
            @if (!last) {
              <button
                class="breadcrumb-item"
                (click)="navigateToPath(item.path)"
              >
                @if (item.icon) {
                  <span class="breadcrumb-icon">{{ item.icon }}</span>
                }
                <span class="breadcrumb-label">{{ item.label }}</span>
              </button>
              <span class="breadcrumb-separator" aria-hidden="true">/</span>
            } @else {
              <span class="breadcrumb-item current">
                @if (item.icon) {
                  <span class="breadcrumb-icon">{{ item.icon }}</span>
                }
                <span class="breadcrumb-label">{{ item.label }}</span>
              </span>
            }
          }
        </nav>
      </div>

      <!-- Toolbar Actions -->
      <div class="toolbar-actions">
        @for (action of actions(); track action.id) {
          @if (action.type === 'spacer') {
            <div class="toolbar-spacer"></div>
          } @else if (action.type === 'search') {
            <div class="search-container">
              <span class="search-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                class="search-input"
                [placeholder]="action.label"
                [value]="searchQuery()"
                (input)="onSearch($event)"
                (keydown.escape)="clearSearch()"
              />
              @if (hasActiveSearch()) {
                <button
                  class="search-clear"
                  (click)="clearSearch()"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              }
            </div>
          } @else if (action.type === 'dropdown') {
            <div class="dropdown-container">
              <button
                class="toolbar-button dropdown"
                (click)="toggleViewMenu()"
                [class.active]="showViewMenu()"
                [title]="action.tooltip || action.label"
              >
                <span class="button-icon">{{ action.icon }}</span>
                <span class="button-label">{{ action.label }}</span>
                <span class="dropdown-arrow" aria-hidden="true">▼</span>
              </button>
              
              @if (showViewMenu()) {
                <div class="dropdown-menu" (clickOutside)="closeViewMenu()">
                  <div class="dropdown-section">
                    <div class="dropdown-header">View As</div>
                    @for (view of viewOptions; track view.id) {
                      <button
                        class="dropdown-item"
                        [class.selected]="currentViewMode() === view.id"
                        (click)="setViewMode(view.id)"
                      >
                        <span class="item-icon">{{ view.icon }}</span>
                        <span class="item-label">{{ view.label }}</span>
                        @if (currentViewMode() === view.id) {
                          <span class="checkmark">✓</span>
                        }
                      </button>
                    }
                  </div>
                  <div class="dropdown-divider"></div>
                  <div class="dropdown-section">
                    <div class="dropdown-header">Sort By</div>
                    @for (sort of sortOptions; track sort.id) {
                      <button
                        class="dropdown-item"
                        [class.selected]="currentSortBy() === sort.id"
                        (click)="setSortBy(sort.id)"
                      >
                        <span class="item-label">{{ sort.label }}</span>
                        @if (currentSortBy() === sort.id) {
                          <span class="checkmark">{{ currentSortAscending() ? '↑' : '↓' }}</span>
                        }
                      </button>
                    }
                  </div>
                  <div class="dropdown-divider"></div>
                  <div class="dropdown-section">
                    <button
                      class="dropdown-item"
                      (click)="toggleSortOrder()"
                    >
                      <span class="item-label">Toggle Sort Order</span>
                      <span class="item-shortcut">{{ currentSortAscending() ? '⌘↓' : '⌘↑' }}</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          } @else {
            <button
              class="toolbar-button"
              [class.active]="action.id === 'sidebar' && !sidebarHidden()"
              [disabled]="action.disabled"
              (click)="toolbarAction.emit(action.id)"
              [title]="action.tooltip || action.label"
            >
              <span class="button-icon">{{ action.icon }}</span>
              @if (showLabels()) {
                <span class="button-label">{{ action.label }}</span>
              }
            </button>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .macos-toolbar {
      display: flex;
      align-items: center;
      height: 52px;
      padding: 0 12px;
      background: linear-gradient(180deg, #ffffff 0%, #f6f6f6 100%);
      border-bottom: 1px solid #e0e0e0;
      gap: 12px;
      flex-shrink: 0;
    }

    /* Window Controls (Traffic Lights) */
    .window-controls {
      display: flex;
      gap: 8px;
      padding-right: 8px;
    }

    .window-control {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.15s;
    }

    .window-control .control-icon {
      font-size: 7px;
      opacity: 0;
      color: rgba(0, 0, 0, 0.5);
    }

    .window-control:hover .control-icon {
      opacity: 1;
    }

    .window-control.close {
      background: #ff5f57;
      border: 1px solid #e0443e;
    }

    .window-control.minimize {
      background: #ffbd2e;
      border: 1px solid #dea123;
    }

    .window-control.maximize {
      background: #28c940;
      border: 1px solid #1aab29;
    }

    /* Navigation */
    .toolbar-navigation {
      display: flex;
      gap: 4px;
    }

    .nav-button {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
      color: #667eea;
    }

    .nav-button:hover:not(:disabled) {
      background: rgba(102, 126, 234, 0.1);
    }

    .nav-button:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .nav-icon {
      font-size: 12px;
    }

    /* Breadcrumb */
    .breadcrumb-container {
      flex: 1;
      overflow: hidden;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 4px;
      height: 32px;
      padding: 0 12px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 8px;
      overflow: hidden;
    }

    .breadcrumb-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      background: transparent;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s;
      font-size: 13px;
      color: #333;
    }

    .breadcrumb-item:hover {
      background: rgba(0, 0, 0, 0.08);
    }

    .breadcrumb-item.current {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      font-weight: 500;
    }

    .breadcrumb-icon {
      font-size: 14px;
    }

    .breadcrumb-label {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .breadcrumb-separator {
      color: #999;
      font-size: 12px;
    }

    /* Toolbar Actions */
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .toolbar-spacer {
      flex: 1;
    }

    .toolbar-button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      background: transparent;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
      color: #333;
      font-size: 12px;
    }

    .toolbar-button:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.08);
    }

    .toolbar-button.active {
      background: rgba(102, 126, 234, 0.15);
      color: #667eea;
    }

    .toolbar-button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .button-icon {
      font-size: 14px;
    }

    /* Search */
    .search-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 10px;
      font-size: 13px;
      opacity: 0.5;
      pointer-events: none;
    }

    .search-input {
      width: 180px;
      padding: 6px 32px 6px 30px;
      font-size: 13px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      outline: none;
      background: #fff;
      transition: all 0.2s;
    }

    .search-input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .search-input::placeholder {
      color: #999;
    }

    .search-clear {
      position: absolute;
      right: 6px;
      width: 20px;
      height: 20px;
      background: rgba(0, 0, 0, 0.05);
      border: none;
      border-radius: 50%;
      color: #666;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }

    .search-clear:hover {
      background: rgba(0, 0, 0, 0.1);
    }

    /* Dropdown */
    .dropdown-container {
      position: relative;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      min-width: 200px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      padding: 8px;
      z-index: 1000;
      animation: dropdownSlideIn 0.15s ease;
    }

    @keyframes dropdownSlideIn {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .dropdown-section {
      padding: 4px 0;
    }

    .dropdown-header {
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 600;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      width: 100%;
      padding: 8px 12px;
      background: transparent;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
      text-align: left;
      font-size: 13px;
      color: #333;
    }

    .dropdown-item:hover {
      background: rgba(102, 126, 234, 0.1);
    }

    .dropdown-item.selected {
      background: rgba(102, 126, 234, 0.15);
      color: #667eea;
      font-weight: 500;
    }

    .dropdown-divider {
      height: 1px;
      background: #e0e0e0;
      margin: 4px 0;
    }

    .item-icon {
      font-size: 14px;
      width: 20px;
    }

    .checkmark {
      font-size: 12px;
      color: #667eea;
    }

    .item-shortcut {
      font-size: 11px;
      color: #999;
    }
  `],
})
export class ToolbarComponent {
  breadcrumbs = input<BreadcrumbItem[]>([
    { label: 'Home', path: '/', icon: '🏠' },
    { label: 'Documents', path: '/Documents', icon: '📄' },
  ]);
  actions = input<ToolbarAction[]>(DEFAULT_TOOLBAR_ACTIONS);
  sidebarHidden = input<boolean>(false);
  showLabels = input<boolean>(true);

  readonly windowAction = output<'close' | 'minimize' | 'maximize'>();
  readonly navigate = output<'back' | 'forward' | string>();
  readonly toolbarAction = output<string>();
  readonly search = output<string>();

  searchQuery = signal<string>('');
  showViewMenu = signal<boolean>(false);
  currentViewMode = signal<string>('icons');
  currentSortBy = signal<string>('name');
  currentSortAscending = signal<boolean>(true);

  canGoBack = signal<boolean>(false);
  canGoForward = signal<boolean>(false);

  viewOptions = [
    { id: 'icons', label: 'as Icons', icon: '▦' },
    { id: 'list', label: 'as List', icon: '☰' },
    { id: 'columns', label: 'as Columns', icon: '⊞' },
    { id: 'coverflow', label: 'as Cover Flow', icon: '◫' },
  ];

  sortOptions = [
    { id: 'name', label: 'Name' },
    { id: 'date', label: 'Date Modified' },
    { id: 'size', label: 'Size' },
    { id: 'kind', label: 'Kind' },
  ];

  hasActiveSearch = computed(() => this.searchQuery().length > 0);

  toggleViewMenu(): void {
    this.showViewMenu.update(v => !v);
  }

  closeViewMenu(): void {
    this.showViewMenu.set(false);
  }

  setViewMode(mode: string): void {
    this.currentViewMode.set(mode);
    this.showViewMenu.set(false);
    this.toolbarAction.emit(`view:${mode}`);
  }

  setSortBy(sortBy: string): void {
    this.currentSortBy.set(sortBy);
    this.showViewMenu.set(false);
    this.toolbarAction.emit(`sort:${sortBy}`);
  }

  toggleSortOrder(): void {
    this.currentSortAscending.update(v => !v);
    this.toolbarAction.emit('sort:order');
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.search.emit(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.search.emit('');
  }

  navigateToPath(path: string): void {
    this.navigate.emit(path);
  }
}
