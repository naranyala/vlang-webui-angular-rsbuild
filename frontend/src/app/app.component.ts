import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal, effect } from '@angular/core';
import { WinBoxService } from '../core/winbox-nested.service';
import { ErrorService, LoggerService, WebUIService } from '../services';
import { FinderLayoutComponent } from '../components/layout/finder-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FinderLayoutComponent],
  template: `
    <div class="app-container">
      <!-- Nested WinBox Finder Layout -->
      <app-finder-layout
        (pathChanged)="onPathChanged($event)"
        (itemSelected)="onItemSelected($event)"
        (itemOpened)="onItemOpened($event)"
      />

      <!-- Debug/Info Panel -->
      <div class="info-panel">
        <div class="info-item">
          <span class="info-label">Windows:</span>
          <span class="info-value">{{ windowCount() }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Status:</span>
          <span class="info-value" [class.connected]="connectionState().connected">
            {{ connectionState().connected ? 'Connected' : 'Disconnected' }}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
      background: linear-gradient(135deg, #1a1a2e 0%, #16162a 100%);
    }

    .app-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .info-panel {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      gap: 16px;
      padding: 12px 20px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-size: 12px;
      color: rgba(255, 255, 255, 0.9);
      z-index: 1000;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .info-label {
      color: rgba(255, 255, 255, 0.6);
      font-weight: 500;
    }

    .info-value {
      font-weight: 600;
    }

    .info-value.connected {
      color: #4ade80;
    }
  `],
})
export class AppComponent implements OnInit {
  private readonly logger = this.loggerService.getLogger('AppComponent');
  private readonly winboxService = inject(WinBoxService);
  private readonly errorService = inject(ErrorService);
  private readonly webuiService = inject(WebUIService);

  // Computed signals
  readonly connectionState = computed(() => this.webuiService.connectionState());
  readonly windowCount = computed(() => this.winboxService.windowCount());

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

  ngOnInit(): void {
    this.logger.info('Application initialized with nested WinBox Finder layout');

    // Create the main finder window after a short delay
    setTimeout(() => {
      this.createFinderWindow();
    }, 300);
  }

  createFinderWindow(): void {
    this.logger.info('Creating Finder window');

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

    if (finderWindow) {
      this.logger.info('Finder window created successfully');
    } else {
      this.errorService.report({
        message: 'Failed to create Finder window',
        severity: 'error',
      });
    }
  }

  onPathChanged(path: string): void {
    this.logger.debug('Path changed', { path });
  }

  onItemSelected(item: any): void {
    this.logger.debug('Item selected', { item });
  }

  onItemOpened(item: any): void {
    this.logger.info('Item opened', { item });
  }
}
