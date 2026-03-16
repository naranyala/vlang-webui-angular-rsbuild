import {
  Component,
  input,
  output,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarItem, SIDEBAR_SECTIONS } from '../../models/layout.model';

@Component({
  selector: 'macos-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="macos-sidebar" [class.collapsed]="collapsed()">
      @if (!collapsed()) {
        <div class="sidebar-header">
          <span class="sidebar-title">{{ title() }}</span>
        </div>
        
        <div class="sidebar-content">
          @for (section of sidebarItems(); track section.id) {
            @if (section.type === 'separator') {
              <div class="sidebar-separator"></div>
            } @else {
              <div class="sidebar-section">
                @if (section.children && section.children.length > 0) {
                  <button
                    class="sidebar-section-header"
                    (click)="toggleSection(section.id)"
                    [class.expanded]="isSectionExpanded(section.id)"
                  >
                    <span class="section-icon">{{ section.icon }}</span>
                    <span class="section-label">{{ section.label }}</span>
                    <span class="section-chevron" aria-hidden="true">
                      {{ isSectionExpanded(section.id) ? '▼' : '▶' }}
                    </span>
                  </button>
                  
                  @if (isSectionExpanded(section.id)) {
                    <div class="sidebar-section-content">
                      @for (item of section.children; track item.id) {
                        <button
                          class="sidebar-item"
                          [class.selected]="selectedItem() === item.id"
                          [class.has-badge]="item.badge && item.badge > 0"
                          (click)="selectItem(item)"
                          role="treeitem"
                          [attr.aria-selected]="selectedItem() === item.id"
                        >
                          <span class="item-icon">{{ item.icon }}</span>
                          <span class="item-label">{{ item.label }}</span>
                          @if (item.badge && item.badge > 0) {
                            <span class="item-badge">{{ item.badge }}</span>
                          }
                        </button>
                      }
                    </div>
                  }
                } @else {
                  <button
                    class="sidebar-item"
                    [class.selected]="selectedItem() === section.id"
                    (click)="selectItem(section)"
                  >
                    <span class="item-icon">{{ section.icon }}</span>
                    <span class="item-label">{{ section.label }}</span>
                  </button>
                }
              </div>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .macos-sidebar {
      width: 100%;
      height: 100%;
      background: linear-gradient(180deg, #f6f6f6 0%, #ebebeb 100%);
      border-right: 1px solid #d0d0d0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: width 0.2s ease;
    }

    .macos-sidebar.collapsed {
      width: 0;
      border-right: none;
    }

    .sidebar-header {
      padding: 12px 16px;
      background: linear-gradient(180deg, #ffffff 0%, #f6f6f6 100%);
      border-bottom: 1px solid #e0e0e0;
      flex-shrink: 0;
    }

    .sidebar-title {
      font-size: 13px;
      font-weight: 600;
      color: #1a1a2e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 8px 0;
    }

    .sidebar-content::-webkit-scrollbar {
      width: 6px;
    }

    .sidebar-content::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidebar-content::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 3px;
    }

    .sidebar-content::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.2);
    }

    .sidebar-separator {
      height: 1px;
      background: #e0e0e0;
      margin: 8px 16px;
    }

    .sidebar-section {
      margin-bottom: 4px;
    }

    .sidebar-section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      padding: 6px 16px;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: background 0.15s ease;
      text-align: left;
    }

    .sidebar-section-header:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .sidebar-section-header.expanded {
      background: rgba(102, 126, 234, 0.1);
    }

    .section-icon {
      font-size: 14px;
      width: 20px;
      text-align: center;
    }

    .section-label {
      flex: 1;
      font-size: 12px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .section-chevron {
      font-size: 8px;
      color: #999;
      transition: transform 0.2s ease;
    }

    .sidebar-section-header.expanded .section-chevron {
      transform: rotate(90deg);
    }

    .sidebar-section-content {
      padding-left: 12px;
    }

    .sidebar-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 16px 8px 28px;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
      position: relative;
    }

    .sidebar-item:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .sidebar-item.selected {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }

    .sidebar-item.selected::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 60%;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 0 2px 2px 0;
    }

    .sidebar-item.has-badge {
      padding-right: 12px;
    }

    .item-icon {
      font-size: 16px;
      width: 20px;
      text-align: center;
      flex-shrink: 0;
    }

    .sidebar-item.selected .item-icon {
      filter: brightness(0) invert(1);
    }

    .item-label {
      flex: 1;
      font-size: 13px;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sidebar-item.selected .item-label {
      color: #fff;
    }

    .item-badge {
      background: #ef4444;
      color: #fff;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 18px;
      text-align: center;
    }

    .sidebar-item.selected .item-badge {
      background: rgba(255, 255, 255, 0.3);
    }
  `],
})
export class SidebarComponent implements OnInit {
  title = input<string>('Sidebar');
  collapsed = input<boolean>(false);
  items = input<SidebarItem[]>(SIDEBAR_SECTIONS);

  readonly itemSelected = output<SidebarItem>();

  selectedItem = signal<string>('documents');
  expandedSections = signal<Set<string>>(new Set(['favorites']));

  sidebarItems = computed(() => this.items());

  ngOnInit(): void {
    // Initialize expanded sections from input
    const initiallyExpanded = new Set<string>();
    this.items().forEach(item => {
      if (item.expanded) {
        initiallyExpanded.add(item.id);
      }
    });
    this.expandedSections.set(initiallyExpanded);
  }

  isSectionExpanded(sectionId: string): boolean {
    return this.expandedSections().has(sectionId);
  }

  toggleSection(sectionId: string): void {
    const expanded = new Set(this.expandedSections());
    if (expanded.has(sectionId)) {
      expanded.delete(sectionId);
    } else {
      expanded.add(sectionId);
    }
    this.expandedSections.set(expanded);
  }

  selectItem(item: SidebarItem): void {
    if (item.type === 'separator') return;
    
    this.selectedItem.set(item.id);
    this.itemSelected.emit(item);
  }
}
