import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal, input, output, effect } from '@angular/core';
import { WinBoxService } from '../core/winbox.service';
import { Card, TECH_CARDS, WindowEntry } from '../models';
import { ErrorService, LoggerService, WebUIService } from '../services';

// Type-safe WinBox instance interface
interface WinBoxInstance {
  __windowId?: string;
  __cardTitle?: string;
  __cardId?: number;
  min: boolean;
  focus(): void;
  restore(): void;
  close(force?: boolean): boolean;
  minimize(value: boolean): void;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  private readonly logger = this.loggerService.getLogger('AppComponent');
  private readonly winboxService = inject(WinBoxService);
  private readonly errorService = inject(ErrorService);
  private readonly webuiService = inject(WebUIService);

  // ============================================================================
  // BLEEDING-EDGE ANGULAR 19 FEATURES
  // ============================================================================

  // Signal-based inputs (Angular 19+)
  initialCollapsed = input<boolean>(true);
  appName = input<string>('TechHub');

  // Signal-based outputs (Angular 19+)
  windowClosed = output<string>();
  windowOpened = output<string>();
  appReady = output<void>();

  // ============================================================================
  // STATE MANAGEMENT WITH SIGNALS
  // ============================================================================

  readonly cards = TECH_CARDS;
  readonly windowEntries = signal<WindowEntry[]>([]);
  readonly bottomCollapsed = signal(this.initialCollapsed());
  readonly topCollapsed = signal(this.initialCollapsed());

  // Fuzzy search state
  readonly searchQuery = signal<string>('');
  readonly filteredCards = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.cards;
    return this.cards.filter(card => 
      card.title.toLowerCase().includes(query) ||
      card.description.toLowerCase().includes(query) ||
      card.icon.toLowerCase().includes(query)
    );
  });
  readonly hasActiveSearch = computed(() => this.searchQuery().length > 0);
  readonly noResults = computed(() => this.hasActiveSearch() && this.filteredCards().length === 0);

  // Computed signals for derived state
  readonly connectionState = computed(() => this.webuiService.connectionState());
  readonly hasWindows = computed(() => this.windowEntries().length > 0);
  readonly windowCount = computed(() => this.windowEntries().length);
  readonly focusedWindow = computed(() => this.windowEntries().find(w => w.focused));
  readonly minimizedCount = computed(() => this.windowEntries().filter(w => w.minimized).length);

  // Complex computed with multiple dependencies
  readonly appStatus = computed(() => ({
    windows: this.windowCount(),
    connected: this.connectionState().connected,
    port: this.connectionState().port,
    minimized: this.minimizedCount(),
    timestamp: new Date().toISOString(),
  }));

  // Type-safe WinBox tracking
  private existingBoxes: WinBoxInstance[] = [];

  constructor(
    private readonly loggerService: LoggerService
  ) {
    // Log connection state changes
    effect(() => {
      const state = this.connectionState();
      if (state.connected) {
        this.logger.info('Connected to backend', { port: state.port });
      }
    });
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  ngOnInit(): void {
    this.logger.info('Application initialized', {
      appName: this.appName()
    });

    this.closeAllWindows();

    // Auto-open first card after a short delay
    setTimeout(() => {
      const firstCard = this.cards[0];
      if (firstCard) {
        this.openCard(firstCard);
        this.appReady.emit();
      }
    }, 500);
  }

  // ============================================================================
  // WINDOW MANAGEMENT
  // ============================================================================

  openCard(card: Card): void {
    this.logger.info('Opening card', { title: card.title });

    const windowId = `card-${card.id}`;
    const WinBoxConstructor = (window as any).WinBox;

    if (!WinBoxConstructor) {
      this.errorService.report({
        message: 'WinBox not available',
        severity: 'error',
      });
      return;
    }

    try {
      const box = new WinBoxConstructor({
        id: windowId,
        title: `${card.icon} ${card.title}`,
        background: card.color,
        width: '80%',
        height: '80%',
        html: `<div style="padding: 24px; height: calc(100% - 40px); overflow: auto;">${card.content}</div>`,
      });

      box.__windowId = windowId;
      box.__cardTitle = card.title;
      box.__cardId = card.id;
      this.existingBoxes.push(box);

      box.onclose = () => {
        const index = this.existingBoxes.indexOf(box);
        if (index > -1) this.existingBoxes.splice(index, 1);
        this.windowEntries.update(entries => entries.filter(e => e.id !== windowId));
        this.windowClosed.emit(windowId);
        return true;
      };

      this.windowEntries.update(entries => [
        ...entries.map(e => ({ ...e, focused: false })),
        {
          id: windowId,
          title: card.title,
          minimized: false,
          focused: true,
        },
      ]);

      this.windowOpened.emit(windowId);
      this.logger.info('Window opened', { windowId, title: card.title });
    } catch (error) {
      this.errorService.report({
        message: 'Failed to open window',
        details: error instanceof Error ? error.message : String(error),
        severity: 'error',
      });
    }
  }

  closeAllWindows(): void {
    this.logger.info('Closing all windows');

    const boxesToClose = [...this.existingBoxes];
    boxesToClose.forEach(box => {
      if (!box) return;

      const windowId = box.__windowId;

      try {
        if (box.min) {
          box.restore();
        }
        box.close(true);
      } catch (error) {
        this.logger.error('Error closing window', error);
      } finally {
        const index = this.existingBoxes.indexOf(box);
        if (index > -1) {
          this.existingBoxes.splice(index, 1);
        }
        if (windowId) {
          this.windowEntries.update(entries => entries.filter(e => e.id !== windowId));
          this.windowClosed.emit(windowId);
        }
      }
    });

    this.existingBoxes = [];
    this.windowEntries.set([]);
  }

  activateWindow(windowId: string): void {
    const box = this.existingBoxes.find(b => b?.__windowId === windowId);
    if (box) {
      if (box.min) box.restore();
      box.focus();
      this.markWindowFocused(windowId);
    }
  }

  showMainMenu(): void {
    this.existingBoxes.forEach(box => {
      if (box && !box.min) box.minimize(true);
    });
    this.windowEntries.update(entries =>
      entries.map(entry => ({ ...entry, minimized: true, focused: false }))
    );
  }

  // ============================================================================
  // PANEL MANAGEMENT
  // ============================================================================

  toggleTop(): void {
    this.topCollapsed.update(v => !v);
  }

  toggleBottom(): void {
    this.bottomCollapsed.update(v => !v);
  }

  hasFocusedWindow(): boolean {
    return this.windowEntries().some(entry => entry.focused);
  }

  // ============================================================================
  // SEARCH MANAGEMENT
  // ============================================================================

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.logger.debug('Search updated', { query: value });
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.logger.debug('Search cleared');
  }

  private markWindowFocused(windowId: string): void {
    this.windowEntries.update(entries =>
      entries.map(entry => ({
        ...entry,
        focused: entry.id === windowId,
        minimized: entry.id === windowId ? false : entry.minimized,
      }))
    );
  }
}
