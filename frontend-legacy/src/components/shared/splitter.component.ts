import {
  Component,
  input,
  output,
  signal,
  computed,
  ElementRef,
  OnInit,
  OnDestroy,
  viewChild,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SplitPane } from '../../models/layout.model';

@Component({
  selector: 'macos-splitter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="splitter"
      [class.horizontal]="orientation() === 'horizontal'"
      [class.vertical]="orientation() === 'vertical'"
      (mousedown)="startDrag($event)"
      (touchstart)="startDrag($event)"
      role="separator"
      [attr.aria-orientation]="orientation()"
      tabindex="0"
      (keydown)="onKeyDown($event)"
    >
      <div class="splitter-handle">
        @if (orientation() === 'horizontal') {
          <div class="splitter-grip-horizontal"></div>
        } @else {
          <div class="splitter-grip-vertical"></div>
        }
      </div>
    </div>
  `,
  styles: [`
    .splitter {
      position: relative;
      background: transparent;
      transition: background 0.15s ease;
      z-index: 10;
    }

    .splitter:hover,
    .splitter:focus {
      background: rgba(102, 126, 234, 0.1);
    }

    .splitter:focus {
      outline: none;
      background: rgba(102, 126, 234, 0.15);
    }

    .splitter.active {
      background: rgba(102, 126, 234, 0.2);
    }

    .splitter.horizontal {
      width: 12px;
      cursor: col-resize;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .splitter.vertical {
      height: 12px;
      cursor: row-resize;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .splitter-handle {
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    .splitter:hover .splitter-handle,
    .splitter:focus .splitter-handle {
      opacity: 1;
    }

    .splitter.active .splitter-handle {
      opacity: 1;
    }

    .splitter-grip-horizontal {
      width: 4px;
      height: 24px;
      background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.4), transparent);
      border-radius: 2px;
    }

    .splitter-grip-vertical {
      width: 24px;
      height: 4px;
      background: linear-gradient(180deg, transparent, rgba(102, 126, 234, 0.4), transparent);
      border-radius: 2px;
    }

    /* macOS-style splitter */
    .splitter.macos-style.horizontal .splitter-grip-horizontal {
      width: 3px;
      height: 32px;
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(0, 0, 0, 0.1) 20%, 
        rgba(0, 0, 0, 0.15) 50%, 
        rgba(0, 0, 0, 0.1) 80%, 
        transparent 100%);
      box-shadow: 0 0 1px rgba(0, 0, 0, 0.1);
    }

    .splitter.macos-style.vertical .splitter-grip-vertical {
      width: 32px;
      height: 3px;
      background: linear-gradient(180deg, 
        transparent 0%, 
        rgba(0, 0, 0, 0.1) 20%, 
        rgba(0, 0, 0, 0.15) 50%, 
        rgba(0, 0, 0, 0.1) 80%, 
        transparent 100%);
      box-shadow: 0 0 1px rgba(0, 0, 0, 0.1);
    }
  `],
})
export class SplitterComponent implements OnInit, OnDestroy {
  orientation = input<'horizontal' | 'vertical'>('horizontal');
  paneIndex = input(0);
  macosStyle = input(true);

  readonly splitterDragged = output<{ index: number; delta: number }>();
  readonly splitterDblClick = output<{ index: number }>();

  private isDragging = false;
  private startPos = 0;
  private startSize = 0;

  ngOnInit(): void {
    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('mouseup', this.stopDrag);
    document.addEventListener('touchmove', this.onDrag, { passive: false });
    document.addEventListener('touchend', this.stopDrag);
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
    document.removeEventListener('touchmove', this.onDrag);
    document.removeEventListener('touchend', this.stopDrag);
  }

  startDrag(event: MouseEvent | TouchEvent): void {
    if (event instanceof MouseEvent && event.button !== 0) return;
    
    this.isDragging = true;
    this.startPos = event instanceof MouseEvent ? event.clientX : (event.touches[0]?.clientX || 0);
    
    const splitterEl = (event.target as HTMLElement).closest('.splitter');
    if (splitterEl) {
      const paneEl = splitterEl.previousElementSibling as HTMLElement;
      if (paneEl) {
        this.startSize = this.orientation() === 'horizontal' ? paneEl.offsetWidth : paneEl.offsetHeight;
      }
    }

    splitterEl?.classList.add('active');
    
    if (event instanceof TouchEvent) {
      event.preventDefault();
    }
  }

  onDrag = (event: MouseEvent | TouchEvent): void => {
    if (!this.isDragging) return;

    const currentPos = event instanceof MouseEvent ? event.clientX : (event.touches[0]?.clientX || 0);
    const delta = currentPos - this.startPos;

    this.splitterDragged.emit({
      index: this.paneIndex(),
      delta: this.orientation() === 'horizontal' ? delta : -delta,
    });

    if (event instanceof TouchEvent) {
      event.preventDefault();
    }
  };

  stopDrag = (): void => {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    
    document.querySelectorAll('.splitter.active').forEach(el => {
      el.classList.remove('active');
    });
  };

  onKeyDown(event: KeyboardEvent): void {
    const step = event.shiftKey ? 50 : 10;
    let delta = 0;

    if (this.orientation() === 'horizontal') {
      if (event.key === 'ArrowLeft') delta = -step;
      if (event.key === 'ArrowRight') delta = step;
    } else {
      if (event.key === 'ArrowUp') delta = -step;
      if (event.key === 'ArrowDown') delta = step;
    }

    if (delta !== 0) {
      event.preventDefault();
      this.splitterDragged.emit({ index: this.paneIndex(), delta });
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.splitterDblClick.emit({ index: this.paneIndex() });
    }
  }
}
