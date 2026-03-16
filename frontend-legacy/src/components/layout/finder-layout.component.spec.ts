import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FinderLayoutComponent } from './finder-layout.component';
import { SplitPaneComponent } from './split-pane.component';
import { WebUIService } from '../../services/app/webui.service';
import { ErrorService } from '../../services/core/error.service';
import { LoggerService } from '../../services/core/logger.service';

describe('FinderLayoutComponent', () => {
  let component: FinderLayoutComponent;
  let fixture: ComponentFixture<FinderLayoutComponent>;
  let webuiService: WebUIService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FinderLayoutComponent, SplitPaneComponent],
      providers: [WebUIService, ErrorService, LoggerService],
    });

    fixture = TestBed.createComponent(FinderLayoutComponent);
    component = fixture.componentInstance;
    webuiService = TestBed.inject(WebUIService);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have default path', () => {
      expect(component.currentPath()).toBe('/Documents');
    });

    it('should have no selected item', () => {
      expect(component.selectedItem()).toBeNull();
    });

    it('should have preview visible by default', () => {
      expect(component.previewCollapsed()).toBe(false);
    });

    it('should have breadcrumbs', () => {
      const breadcrumbs = component.breadcrumbs();
      expect(breadcrumbs.length).toBeGreaterThan(0);
      expect(breadcrumbs[0].label).toBe('Home');
      expect(breadcrumbs[0].path).toBe('/');
    });

    it('should have current folder name', () => {
      expect(component.currentFolderName()).toBe('Documents');
    });

    it('should have demo items', () => {
      const items = component.currentItems();
      expect(items.length).toBeGreaterThan(0);
    });

    it('should have layout panes configured', () => {
      const panes = component.layoutPanes();
      expect(panes.length).toBe(2); // content and preview
      expect(panes[0].id).toBe('content');
      expect(panes[1].id).toBe('preview');
    });
  });

  describe('breadcrumb navigation', () => {
    it('should generate breadcrumbs for root path', () => {
      component.navigateTo('/');
      fixture.detectChanges();

      const breadcrumbs = component.breadcrumbs();
      expect(breadcrumbs.length).toBe(1);
      expect(breadcrumbs[0].path).toBe('/');
    });

    it('should generate breadcrumbs for nested path', () => {
      component.navigateTo('/Documents/Project Files');
      fixture.detectChanges();

      const breadcrumbs = component.breadcrumbs();
      expect(breadcrumbs.length).toBe(3); // Home, Documents, Project Files
      expect(breadcrumbs[1].label).toBe('Documents');
      expect(breadcrumbs[2].label).toBe('Project Files');
    });

    it('should get folder icons', () => {
      expect(component.getFolderIcon('Documents')).toBe('📄');
      expect(component.getFolderIcon('Downloads')).toBe('⬇️');
      expect(component.getFolderIcon('Desktop')).toBe('🖥️');
      expect(component.getFolderIcon('Applications')).toBe('⌘');
      expect(component.getFolderIcon('Unknown')).toBe('📁');
    });

    it('should handle breadcrumb click', () => {
      const navigateSpy = jest.spyOn(component, 'navigateTo');
      component.onBreadcrumbClick('/Documents');
      expect(navigateSpy).toHaveBeenCalledWith('/Documents');
    });
  });

  describe('navigation', () => {
    it('should navigate to new path', () => {
      const pathChangedSpy = jest.spyOn(component.pathChanged, 'emit');
      component.navigateTo('/Downloads');

      expect(component.currentPath()).toBe('/Downloads');
      expect(component.currentFolderName()).toBe('Downloads');
      expect(pathChangedSpy).toHaveBeenCalledWith('/Downloads');
    });

    it('should update history on navigation', () => {
      component.navigateTo('/Downloads');
      component.navigateTo('/Pictures');

      expect(component.historyIndex()).toBe(1);
    });

    it('should get demo items for path', () => {
      const items = component.getDemoItems('/Test');
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].path).toContain('/Test');
    });

    it('should calculate total size', () => {
      const totalSize = component.totalSize();
      expect(totalSize).toBeGreaterThan(0);
    });
  });

  describe('file selection', () => {
    it('should select an item', () => {
      const items = component.currentItems();
      const itemSelectedSpy = jest.spyOn(component.itemSelected, 'emit');

      component.selectItem(items[0]);

      expect(component.selectedItem()).toBe(items[0]);
      expect(itemSelectedSpy).toHaveBeenCalledWith(items[0]);
    });

    it('should open a folder', () => {
      const folders = component.currentItems().filter(i => i.type === 'folder');
      if (folders.length > 0) {
        const itemOpenedSpy = jest.spyOn(component.itemOpened, 'emit');
        component.openItem(folders[0]);

        expect(component.currentPath()).toBe(folders[0].path);
        expect(itemOpenedSpy).toHaveBeenCalledWith(folders[0]);
      }
    });

    it('should open a file', () => {
      const files = component.currentItems().filter(i => i.type === 'file');
      if (files.length > 0) {
        const itemOpenedSpy = jest.spyOn(component.itemOpened, 'emit');
        component.openItem(files[0]);

        expect(component.currentPath()).toBe('/Documents'); // Should not navigate
        expect(itemOpenedSpy).toHaveBeenCalledWith(files[0]);
      }
    });
  });

  describe('preview pane', () => {
    it('should toggle preview', () => {
      expect(component.previewCollapsed()).toBe(false);

      component.togglePreview();
      expect(component.previewCollapsed()).toBe(true);

      component.togglePreview();
      expect(component.previewCollapsed()).toBe(false);
    });

    it('should handle pane collapse', () => {
      component.onPaneCollapsed(1); // Preview pane index
      expect(component.previewCollapsed()).toBe(true);
    });

    it('should handle pane expand', () => {
      component.previewCollapsed.set(true);
      component.onPaneExpanded(1); // Preview pane index
      expect(component.previewCollapsed()).toBe(false);
    });
  });

  describe('format size', () => {
    it('should format zero bytes', () => {
      expect(component.formatSize(0)).toBe('0 B');
      expect(component.formatSize()).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(component.formatSize(1024)).toBe('1.0 KB');
      expect(component.formatSize(1048576)).toBe('1.0 MB');
      expect(component.formatSize(1073741824)).toBe('1.0 GB');
    });

    it('should format partial units', () => {
      expect(component.formatSize(1536)).toBe('1.5 KB');
      expect(component.formatSize(1572864)).toBe('1.5 MB');
    });
  });

  describe('pane resize', () => {
    it('should handle pane resize event', () => {
      expect(() => {
        component.onPaneResized({ paneIndex: 0, size: 300 });
      }).not.toThrow();
    });
  });

  describe('computed values', () => {
    it('should compute current folder name from path', () => {
      component.navigateTo('/Documents/Project Files/2024');
      fixture.detectChanges();
      expect(component.currentFolderName()).toBe('2024');
    });

    it('should compute breadcrumbs from path', () => {
      component.navigateTo('/a/b/c');
      fixture.detectChanges();
      const breadcrumbs = component.breadcrumbs();
      expect(breadcrumbs[breadcrumbs.length - 1].label).toBe('c');
    });

    it('should compute current items from path', () => {
      component.navigateTo('/Downloads');
      fixture.detectChanges();
      const items = component.currentItems();
      expect(items.every(i => i.path.includes('/Downloads'))).toBe(true);
    });
  });

  describe('lifecycle', () => {
    it('should initialize on ngOnInit', () => {
      const navigateSpy = jest.spyOn(component, 'navigateTo');
      component.ngOnInit();
      expect(navigateSpy).toHaveBeenCalledWith('/Documents');
    });

    it('should cleanup on ngOnDestroy', () => {
      expect(() => {
        component.ngOnDestroy();
      }).not.toThrow();
    });
  });
});
