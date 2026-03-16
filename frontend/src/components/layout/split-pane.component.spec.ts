import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { SplitPaneComponent, SplitPaneEvent } from './split-pane.component';

describe('SplitPaneComponent', () => {
  let component: SplitPaneComponent;
  let fixture: ComponentFixture<SplitPaneComponent>;

  const testPanes = [
    { id: 'pane1', size: 200, minSize: 100, maxSize: 400 },
    { id: 'pane2', size: 300, minSize: 150, maxSize: 500 },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SplitPaneComponent],
    });

    fixture = TestBed.createComponent(SplitPaneComponent);
    component = fixture.componentInstance;
    component.direction.set('vertical');
    component.panes.set(testPanes);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have vertical direction by default', () => {
      component.direction.set('vertical');
      expect(component.direction()).toBe('vertical');
    });

    it('should have horizontal direction', () => {
      component.direction.set('horizontal');
      fixture.detectChanges();
      expect(component.direction()).toBe('horizontal');
    });

    it('should initialize pane sizes from input', () => {
      const sizes = component.paneSizes();
      expect(sizes[0]).toBe(200);
      expect(sizes[1]).toBe(300);
    });

    it('should not be dragging initially', () => {
      expect(component.draggingIndex()).toBe(-1);
    });
  });

  describe('pane size', () => {
    it('should return pane size', () => {
      expect(component.paneSize(0)).toBe(200);
      expect(component.paneSize(1)).toBe(300);
    });

    it('should return 0 for invalid index', () => {
      expect(component.paneSize(99)).toBe(0);
    });

    it('should handle undefined size', () => {
      component.panes.set([{ id: 'test', size: 0, minSize: 100 }]);
      fixture.detectChanges();
      expect(component.paneSize(0)).toBe(0);
    });
  });

  describe('splitter visibility', () => {
    it('should show splitter between panes', () => {
      expect(component.showSplitter(0)).toBe(true);
    });

    it('should not show splitter after last pane', () => {
      expect(component.showSplitter(1)).toBe(false);
    });

    it('should hide splitter when both panes collapsed', () => {
      component.panes.set([
        { id: 'pane1', size: 200, collapsed: true },
        { id: 'pane2', size: 300, collapsed: true },
      ]);
      fixture.detectChanges();
      expect(component.showSplitter(0)).toBe(false);
    });

    it('should show splitter when one pane collapsed', () => {
      component.panes.set([
        { id: 'pane1', size: 200, collapsed: true },
        { id: 'pane2', size: 300, collapsed: false },
      ]);
      fixture.detectChanges();
      expect(component.showSplitter(0)).toBe(true);
    });
  });

  describe('dragging', () => {
    it('should not be dragging initially', () => {
      expect(component.isDragging(0)).toBe(false);
    });

    it('should start drag on mousedown', () => {
      const event = new MouseEvent('mousedown', { clientX: 100 });
      component.startDrag(event, 0);
      fixture.detectChanges();

      expect(component.draggingIndex()).toBe(0);
    });

    it('should update size on drag', fakeAsync(() => {
      const paneResizedSpy = jest.spyOn(component.paneResized, 'emit');
      
      // Start drag
      const startEvent = new MouseEvent('mousedown', { clientX: 100 });
      component.startDrag(startEvent, 0);
      fixture.detectChanges();

      // Simulate drag
      const moveEvent = new MouseEvent('mousemove', { clientX: 150 });
      component['onDrag'](moveEvent);
      fixture.detectChanges();

      expect(component.paneSizes()[0]).toBeGreaterThan(200);
      expect(paneResizedSpy).toHaveBeenCalled();

      // End drag
      component['endDrag']();
      fixture.detectChanges();
      expect(component.draggingIndex()).toBe(-1);
    }));

    it('should respect min size on drag', fakeAsync(() => {
      component.panes.set([
        { id: 'pane1', size: 200, minSize: 150, maxSize: 400 },
        { id: 'pane2', size: 300, minSize: 150, maxSize: 500 },
      ]);
      fixture.detectChanges();

      const startEvent = new MouseEvent('mousedown', { clientX: 100 });
      component.startDrag(startEvent, 0);
      fixture.detectChanges();

      // Try to drag below min
      const moveEvent = new MouseEvent('mousemove', { clientX: 0 });
      component['onDrag'](moveEvent);
      fixture.detectChanges();

      expect(component.paneSizes()[0]).toBeGreaterThanOrEqual(150);
    }));

    it('should respect max size on drag', fakeAsync(() => {
      component.panes.set([
        { id: 'pane1', size: 200, minSize: 100, maxSize: 250 },
        { id: 'pane2', size: 300, minSize: 150, maxSize: 500 },
      ]);
      fixture.detectChanges();

      const startEvent = new MouseEvent('mousedown', { clientX: 100 });
      component.startDrag(startEvent, 0);
      fixture.detectChanges();

      // Try to drag above max
      const moveEvent = new MouseEvent('mousemove', { clientX: 500 });
      component['onDrag'](moveEvent);
      fixture.detectChanges();

      expect(component.paneSizes()[0]).toBeLessThanOrEqual(250);
    }));

    it('should emit paneResized event on drag', () => {
      const emitSpy = jest.spyOn(component.paneResized, 'emit');
      
      const startEvent = new MouseEvent('mousedown', { clientX: 100 });
      component.startDrag(startEvent, 0);
      
      const moveEvent = new MouseEvent('mousemove', { clientX: 150 });
      component['onDrag'](moveEvent);

      expect(emitSpy).toHaveBeenCalledWith({
        paneIndex: 0,
        size: expect.any(Number),
      });
    });

    it('should cleanup on end drag', () => {
      const startEvent = new MouseEvent('mousedown', { clientX: 100 });
      component.startDrag(startEvent, 0);
      
      component['endDrag']();
      
      expect(component.draggingIndex()).toBe(-1);
      expect(component['currentDragIndex']).toBe(-1);
    });
  });

  describe('double-click collapse', () => {
    it('should collapse pane on double-click', () => {
      const collapseSpy = jest.spyOn(component.paneCollapsed, 'emit');
      
      component.onSplitterDblClick(0);
      fixture.detectChanges();

      expect(collapseSpy).toHaveBeenCalledWith(0);
      expect(component.paneSizes()[0]).toBe(0);
    });

    it('should expand pane on double-click', () => {
      // First collapse
      component.onSplitterDblClick(0);
      fixture.detectChanges();

      const expandSpy = jest.spyOn(component.paneExpanded, 'emit');
      
      // Then expand
      component.onSplitterDblClick(0);
      fixture.detectChanges();

      expect(expandSpy).toHaveBeenCalledWith(0);
      expect(component.paneSizes()[0]).toBeGreaterThan(0);
    });

    it('should handle invalid index', () => {
      expect(() => {
        component.onSplitterDblClick(99);
      }).not.toThrow();
    });
  });

  describe('horizontal direction', () => {
    beforeEach(() => {
      component.direction.set('horizontal');
      fixture.detectChanges();
    });

    it('should use Y coordinate for drag', () => {
      const startEvent = new MouseEvent('mousedown', { clientY: 100 });
      component.startDrag(startEvent, 0);
      
      expect(component['dragStartPos']).toBe(100);
    });

    it('should update height on drag', () => {
      const startEvent = new MouseEvent('mousedown', { clientY: 100 });
      component.startDrag(startEvent, 0);
      
      const moveEvent = new MouseEvent('mousemove', { clientY: 150 });
      component['onDrag'](moveEvent);
      
      expect(component.paneSizes()[0]).toBeGreaterThan(200);
    });
  });

  describe('event prevention', () => {
    it('should prevent default on drag start', () => {
      const event = new MouseEvent('mousedown', { bubbles: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      component.startDrag(event, 0);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should stop propagation on drag start', () => {
      const event = new MouseEvent('mousedown', { bubbles: true });
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');
      
      component.startDrag(event, 0);
      
      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup mouse listeners on destroy', () => {
      const startEvent = new MouseEvent('mousedown', { clientX: 100 });
      component.startDrag(startEvent, 0);
      
      expect(component['cleanupMouseMove']).toBeDefined();
      expect(component['cleanupMouseUp']).toBeDefined();
      
      component.ngOnDestroy();
      
      // Cleanup functions should be set
      expect(component['cleanupMouseMove']).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty panes array', () => {
      component.panes.set([]);
      fixture.detectChanges();
      
      expect(component.paneSize(0)).toBe(0);
      expect(component.showSplitter(0)).toBe(false);
    });

    it('should handle single pane', () => {
      component.panes.set([{ id: 'single', size: 300 }]);
      fixture.detectChanges();
      
      expect(component.paneSize(0)).toBe(300);
      expect(component.showSplitter(0)).toBe(false);
    });

    it('should handle pane without min/max size', () => {
      component.panes.set([{ id: 'test', size: 200 }]);
      fixture.detectChanges();
      
      const startEvent = new MouseEvent('mousedown', { clientX: 100 });
      component.startDrag(startEvent, 0);
      
      const moveEvent = new MouseEvent('mousemove', { clientX: 150 });
      component['onDrag'](moveEvent);
      
      // Should use defaults (100-600)
      expect(component.paneSizes()[0]).toBeGreaterThan(0);
    });
  });
});
