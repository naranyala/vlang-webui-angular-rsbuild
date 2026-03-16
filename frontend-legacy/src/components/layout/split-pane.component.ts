import {
  Component,
  input,
  output,
  signal,
  OnInit,
  OnDestroy,
  ElementRef,
  Renderer2,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SplitPaneEvent {
  paneIndex: number;
  size: number;
}

@Component({
  selector: 'app-split-pane',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="split-pane-container" [class.vertical]="direction() === 'vertical'" [class.horizontal]="direction() === 'horizontal'">
      @for (pane of panes(); track pane.id; let i = $index) {
        <div
          class="split-pane"
          [id]="pane.id"
          [style.width.px]="direction() === 'vertical' ? paneSize(i) : null"
          [style.height.px]="direction() === 'horizontal' ? paneSize(i) : null"
          [class.collapsed]="pane.collapsed"
        >
          <ng-content [select]="paneContentSelector(i)" />
        </div>
        
        @if (i < panes().length - 1 && showSplitter(i)) {
          <div
            class="splitter"
            [class.vertical]="direction() === 'vertical'"
            [class.horizontal]="direction() === 'horizontal'"
            [class.dragging]="isDragging(i)"
            (mousedown)="startDrag($event, i)"
            (dblclick)="onSplitterDblClick(i)"
          >
            <div class="splitter-handle"></div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .split-pane-container {
      display: flex;
      width: 100%;
      height: 100%;
    }

    .split-pane-container.vertical {
      flex-direction: row;
    }

    .split-pane-container.horizontal {
      flex-direction: column;
    }

    .split-pane {
      flex-shrink: 0;
      overflow: auto;
      background: #fff;
      transition: width 0.1s ease-out, height 0.1s ease-out;
    }

    .split-pane.collapsed {
      width: 0 !important;
      height: 0 !important;
      overflow: hidden;
    }

    .splitter {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      z-index: 10;
      transition: background 0.2s;
    }

    .splitter.vertical {
      width: 5px;
      cursor: col-resize;
      margin: 0 -2px;
    }

    .splitter.horizontal {
      height: 5px;
      cursor: row-resize;
      margin: -2px 0;
    }

    .splitter:hover,
    .splitter.dragging {
      background: rgba(102, 126, 234, 0.1);
    }

    .splitter.dragging {
      background: rgba(102, 126, 234, 0.2);
    }

    .splitter-handle {
      background: #e0e0e0;
      border-radius: 2px;
      transition: background 0.2s;
    }

    .splitter.vertical .splitter-handle {
      width: 1px;
      height: 100%;
    }

    .splitter.horizontal .splitter-handle {
      width: 100%;
      height: 1px;
    }

    .splitter:hover .splitter-handle,
    .splitter.dragging .splitter-handle {
      background: #667eea;
    }
  `],
})
export class SplitPaneComponent implements OnInit, OnDestroy {
  private readonly renderer = inject(Renderer2);

  direction = input<'vertical' | 'horizontal'>('vertical');
  panes = input<{ id: string; size: number; minSize?: number; maxSize?: number; collapsed?: boolean }[]>([]);
  
  readonly paneResized = output<SplitPaneEvent>();
  readonly paneCollapsed = output<number>();
  readonly paneExpanded = output<number>();

  private currentDragIndex = -1;
  private dragStartPos = 0;
  private dragStartSize = 0;
  private cleanupMouseMove?: () => void;
  private cleanupMouseUp?: () => void;

  readonly paneSizes = signal<number[]>([]);
  readonly draggingIndex = signal<number>(-1);

  ngOnInit(): void {
    this.paneSizes.set(this.panes().map(p => p.size));
  }

  ngOnDestroy(): void {
    this.cleanupMouseMove?.();
    this.cleanupMouseUp?.();
  }

  paneSize(index: number): number {
    const sizes = this.paneSizes();
    return sizes[index] ?? this.panes()[index]?.size ?? 0;
  }

  showSplitter(index: number): boolean {
    const panes = this.panes();
    if (index >= panes.length - 1) return false;
    
    const currentPane = panes[index];
    const nextPane = panes[index + 1];
    
    if (!currentPane || !nextPane) return true;
    
    return !(currentPane.collapsed && nextPane.collapsed);
  }

  isDragging(index: number): boolean {
    return this.draggingIndex() === index;
  }

  paneContentSelector(index: number): string {
    return `[data-pane-index="${index}"]`;
  }

  startDrag(event: MouseEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();

    this.currentDragIndex = index;
    this.dragStartPos = this.direction() === 'vertical' ? event.clientX : event.clientY;
    this.dragStartSize = this.paneSizes()[index] ?? 0;
    this.draggingIndex.set(index);

    const onMouseMove = (e: MouseEvent) => this.onDrag(e);
    const onMouseUp = () => this.endDrag();

    this.cleanupMouseMove = this.renderer.listen('document', 'mousemove', onMouseMove);
    this.cleanupMouseUp = this.renderer.listen('document', 'mouseup', onMouseUp);
  }

  private onDrag(event: MouseEvent): void {
    if (this.currentDragIndex < 0) return;

    const currentPos = this.direction() === 'vertical' ? event.clientX : event.clientY;
    const delta = currentPos - this.dragStartPos;
    
    const panes = this.panes();
    const currentPane = panes[this.currentDragIndex];
    
    if (!currentPane) return;

    const minSize = currentPane.minSize ?? 100;
    const maxSize = currentPane.maxSize ?? 600;
    
    let newSize = this.dragStartSize + delta;
    newSize = Math.max(minSize, Math.min(maxSize, newSize));

    const newSizes = [...this.paneSizes()];
    newSizes[this.currentDragIndex] = newSize;
    this.paneSizes.set(newSizes);

    this.paneResized.emit({
      paneIndex: this.currentDragIndex,
      size: newSize,
    });
  }

  private endDrag(): void {
    this.currentDragIndex = -1;
    this.dragStartPos = 0;
    this.dragStartSize = 0;
    this.draggingIndex.set(-1);
    
    this.cleanupMouseMove?.();
    this.cleanupMouseUp?.();
  }

  onSplitterDblClick(index: number): void {
    const panes = this.panes();
    const pane = panes[index];
    
    if (!pane) return;

    const newCollapsed = !pane.collapsed;
    
    if (newCollapsed) {
      this.paneCollapsed.emit(index);
    } else {
      this.paneExpanded.emit(index);
    }

    // Update sizes
    const newSizes = [...this.paneSizes()];
    if (newCollapsed) {
      newSizes[index] = 0;
    } else {
      newSizes[index] = pane.size;
    }
    this.paneSizes.set(newSizes);
  }
}
