# UI Layout Documentation

## Overview

This document describes the nested WinBox.js layout system with macOS Finder-inspired design patterns.

**Last Updated**: 2026-03-16  
**Version**: 3.0 (Two-Column Layout)

---

## Architecture

### Component Hierarchy

```
AppComponent
└── WinBox Window (main-finder)
    └── FinderLayoutComponent
        ├── BreadcrumbBar
        │   ├── Breadcrumb navigation
        │   └── Preview toggle button
        ├── SplitPane (Content | Preview)
        │   ├── ContentPane
        │   │   ├── Pane header (folder name, item count)
        │   │   └── File list view
        │   └── PreviewPane
        │       ├── File preview
        │       └── File metadata
        └── StatusBar
```

---

## Current Layout: Two-Column Finder

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  🏠 Home /  Documents /  Project Files            [👁️]     │
├──────────────────────────────┬──────────────────────────────────┤
│                              │  👁️ Preview                     │
│   Project Files            ├──────────────────────────────────┤
│   Documents                │  Kind: PDF Document              │
│   Images                   │  Size: 2.0 MB                    │
│   Report.pdf              │  Modified: 2024-01-15            │
│   Budget.xlsx             │  Path: /Documents/...            │
│  ...                         │                                  │
├──────────────────────────────┴──────────────────────────────────┤
│  8 items • 125.5 MB                    Connected                │
└─────────────────────────────────────────────────────────────────┘
```

### Features

| Pane | Width | Resizable | Collapsible | Description |
|------|-------|-----------|-------------|-------------|
| Content | Flexible | Yes | No | File list view |
| Preview | 280px | Yes | Yes | File preview and metadata |

---

## Components

### 1. FinderLayoutComponent

**File**: `frontend/src/components/layout/finder-layout.component.ts`

Main layout component with breadcrumb navigation and two-column split pane.

**Inputs**: None (self-contained)

**Outputs**:
- `pathChanged`: Emitted when navigation path changes
- `itemSelected`: Emitted when file/folder is selected
- `itemOpened`: Emitted when file/folder is opened

**Features**:
- Breadcrumb navigation with clickable path segments
- Two-column layout (content + preview)
- Resizable splitter between panes
- Collapsible preview pane
- Status bar with item count and connection status

---

### 2. SplitPaneComponent

**File**: `frontend/src/components/layout/split-pane.component.ts`

Resizable split pane component supporting vertical and horizontal splits.

**Inputs**:
- `direction`: `'vertical'` | `'horizontal'`
- `panes`: Array of pane configurations

**Outputs**:
- `paneResized`: Emitted when pane is resized
- `paneCollapsed`: Emitted when pane is collapsed
- `paneExpanded`: Emitted when pane is expanded

**Features**:
- Drag-to-resize splitters
- Double-click splitter to collapse/expand
- Configurable min/max sizes
- Signal-based state management

---

### 3. BreadcrumbBar

**Template**: Inside `finder-layout.component.ts`

Breadcrumb navigation showing current path.

**Features**:
- Clickable breadcrumb items
- Home icon for root
- Folder icons for directories
- Active item highlighting
- Preview toggle button

---

## Usage Example

### Basic Usage

```typescript
import { Component } from '@angular/core';
import { FinderLayoutComponent } from './components/layout/finder-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FinderLayoutComponent],
  template: `
    <app-finder-layout
      (pathChanged)="onPathChanged($event)"
      (itemSelected)="onItemSelected($event)"
    />
  `,
})
export class AppComponent {
  onPathChanged(path: string) {
    console.log('Navigated to:', path);
  }

  onItemSelected(item: any) {
    console.log('Selected:', item.name);
  }
}
```

### With WinBox Window

```typescript
import { WinBoxService } from './core/winbox-nested.service';

constructor(private winboxService: WinBoxService) {}

createFinderWindow() {
  const finderWindow = this.winboxService.createFinderWindow({
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
    content: {
      id: 'content',
      title: 'Content',
      options: {
        background: '#ffffff',
      },
    },
    preview: {
      id: 'preview',
      title: 'Preview',
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
  });
}
```

---

## Styling

### Color Palette

```css
/* Breadcrumb Bar */
--breadcrumb-bg: linear-gradient(180deg, #f6f6f6 0%, #ebebeb 100%);
--breadcrumb-border: #d0d0d0;
--breadcrumb-hover: rgba(102, 126, 234, 0.15);
--breadcrumb-active: rgba(102, 126, 234, 0.2);

/* Content Pane */
--content-bg: #ffffff;
--content-border: #e0e0e0;
--file-row-hover: rgba(102, 126, 234, 0.1);
--file-row-selected: rgba(102, 126, 234, 0.2);

/* Preview Pane */
--preview-bg: linear-gradient(180deg, #f9f9f9 0%, #f0f0f0 100%);
--preview-border: #e0e0e0;

/* Status Bar */
--status-bg: linear-gradient(180deg, #f6f6f6 0%, #ebebeb 100%);
--status-border: #d0d0d0;
```

### Typography

```css
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
--font-size-breadcrumb: 13px;
--font-size-file-row: 13px;
--font-size-preview: 12px;
--font-size-status: 11px;
```

---

## Interaction Patterns

### Navigation

| Action | Result |
|--------|--------|
| Click breadcrumb | Navigate to that path level |
| Click file/folder | Select item |
| Double-click folder | Navigate into folder |
| Double-click file | Open file |

### Pane Management

| Action | Result |
|--------|--------|
| Drag splitter | Resize adjacent panes |
| Double-click splitter | Collapse/expand pane |
| Click preview toggle | Toggle preview pane |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` / `→` | Resize splitter (when focused) |
| `Shift + ←` / `→` | Resize splitter (large steps) |
| `Enter` / `Space` | Toggle pane collapse |
| `Cmd/Ctrl + ↑` | Go to parent folder |
| `Cmd/Ctrl + W` | Close preview pane |

---

## File List View

### Columns

| Column | Width | Description |
|--------|-------|-------------|
| Name | 2fr | File/folder name with icon |
| Date Modified | 1fr | Last modified date |
| Size | 100px | File size |
| Kind | 1fr | File type description |

### Demo Data

```typescript
[
  { id: '1', name: 'Project Files', type: 'folder', path: '/Documents/Project Files', icon: '' },
  { id: '2', name: 'Documents', type: 'folder', path: '/Documents/Documents', icon: '' },
  { id: '3', name: 'Report.pdf', type: 'file', size: 2048576, kind: 'PDF Document', modifiedAt: '2024-01-15', icon: '' },
  { id: '4', name: 'Budget.xlsx', type: 'file', size: 524288, kind: 'Excel Spreadsheet', modifiedAt: '2024-02-20', icon: '' },
]
```

---

## Preview Pane

### Metadata Display

| Field | Description |
|-------|-------------|
| Kind | File type (e.g., "PDF Document") |
| Size | File size in human-readable format |
| Modified | Last modified date |
| Path | Full file path |

### Preview States

1. **No Selection**: Shows "Select an item to preview" message
2. **File Selected**: Shows file icon and metadata
3. **Folder Selected**: Shows folder icon and basic info

---

## Responsive Behavior

| Screen Size | Layout |
|-------------|--------|
| > 1024px | Full two-column layout |
| 768-1024px | Preview pane collapsed by default |
| < 768px | Single column, preview overlay |

---

## Performance Considerations

1. **Virtual Scrolling**: For large file lists (future enhancement)
2. **Lazy Loading**: Load file thumbnails on demand
3. **Memoization**: Use computed signals for derived state
4. **Debouncing**: Splitter drag events could be debounced

---

## Future Enhancements

1. **Real File System**: Connect to backend file service
2. **Multi-column Navigation**: Navigate deeper with additional columns
3. **Drag & Drop**: File/folder drag and drop support
4. **Context Menus**: Right-click file operations
5. **Quick Look**: Spacebar preview (macOS-style)
6. **Search Integration**: Real-time search with backend
7. **Tags & Colors**: Full tagging system
8. **View Modes**: Add icons view, grid view

---

## Troubleshooting

### WinBox Not Showing

Ensure `winbox.min.js` is loaded in the build output:
```
frontend/dist/browser/browser/static/js/winbox.min.js
```

### Splitter Not Dragging

Check that parent container has:
```css
.finder-content {
  display: flex;
  overflow: hidden;
}
```

### Preview Pane Not Showing

Verify preview is not collapsed:
```typescript
togglePreview() {
  this.previewCollapsed.update(v => !v);
}
```

---

## Related Documentation

- [Backend Services](50-backend-services.md)
- [Frontend Services](54-frontend-services.md)
- [Build Pipeline](60-build-pipeline.md)

---

*Last updated: 2026-03-16*
*Version: 3.0*
