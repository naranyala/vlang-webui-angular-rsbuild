import { Injectable, signal, computed, inject } from '@angular/core';
import { WebUIService } from './webui.service';
import { LoggerService } from '../core/logger.service';
import type {
  DevToolsData,
  SystemInfo,
  MemoryInfo,
  ProcessInfo,
  NetworkInfo,
  DatabaseInfo,
  ConfigInfo,
  PerformanceMetrics,
  EventLogEntry,
  BackendBinding,
  WindowState,
  LogEntry,
  EnvironmentInfo,
} from '../../models/devtools.model';

/**
 * DevTools Service - Comprehensive system information for DevTools panel
 */
@Injectable({ providedIn: 'root' })
export class DevToolsService {
  private readonly webui = inject(WebUIService);
  private readonly logger = inject(LoggerService).getLogger('DevToolsService');

  // Signal-based state
  private readonly isOpen = signal<boolean>(false);
  private readonly activeTab = signal<string>('overview');
  private readonly autoRefresh = signal<boolean>(true);
  private readonly refreshInterval = signal<number>(5000);
  private readonly lastUpdated = signal<string>('');
  private readonly isLoading = signal<boolean>(false);

  // Data signals
  private readonly systemInfo = signal<SystemInfo | null>(null);
  private readonly memoryInfo = signal<MemoryInfo | null>(null);
  private readonly processInfo = signal<ProcessInfo | null>(null);
  private readonly networkInfo = signal<NetworkInfo | null>(null);
  private readonly databaseInfo = signal<DatabaseInfo | null>(null);
  private readonly configInfo = signal<ConfigInfo | null>(null);
  private readonly performanceMetrics = signal<PerformanceMetrics | null>(null);
  private readonly environmentInfo = signal<EnvironmentInfo | null>(null);
  private readonly events = signal<EventLogEntry[]>([]);
  private readonly bindings = signal<BackendBinding[]>([]);
  private readonly windows = signal<WindowState[]>([]);
  private readonly logs = signal<LogEntry[]>([]);

  // Computed signals
  readonly devToolsState = computed(() => ({
    isOpen: this.isOpen(),
    activeTab: this.activeTab(),
    autoRefresh: this.autoRefresh(),
    refreshInterval: this.refreshInterval(),
    lastUpdated: this.lastUpdated(),
    isLoading: this.isLoading(),
  }));

  readonly devToolsData = computed<Partial<DevToolsData>>(() => ({
    system: this.systemInfo() || undefined,
    memory: this.memoryInfo() || undefined,
    process: this.processInfo() || undefined,
    network: this.networkInfo() || undefined,
    database: this.databaseInfo() || undefined,
    config: this.configInfo() || undefined,
    performance: this.performanceMetrics() || undefined,
    environment: this.environmentInfo() || undefined,
    events: this.events(),
    bindings: this.bindings(),
    windows: this.windows(),
    logs: this.logs(),
  }));

  readonly eventCount = computed(() => this.events().length);
  readonly logCount = computed(() => this.logs().length);
  readonly bindingCount = computed(() => this.bindings().length);

  constructor() {
    // Set up environment info (frontend-only)
    this.loadEnvironmentInfo();
  }

  /**
   * Open DevTools panel
   */
  open(): void {
    this.isOpen.set(true);
    this.logger.info('DevTools opened');
    this.refreshAll();
  }

  /**
   * Close DevTools panel
   */
  close(): void {
    this.isOpen.set(false);
    this.logger.info('DevTools closed');
  }

  /**
   * Toggle DevTools panel
   */
  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Set active tab
   */
  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId);
    this.logger.debug('DevTools tab changed', { tab: tabId });
    this.refreshTab(tabId);
  }

  /**
   * Toggle auto-refresh
   */
  toggleAutoRefresh(): void {
    this.autoRefresh.update(v => !v);
    this.logger.info('Auto-refresh toggled', { enabled: this.autoRefresh() });
  }

  /**
   * Set refresh interval
   */
  setRefreshInterval(intervalMs: number): void {
    this.refreshInterval.set(intervalMs);
    this.logger.debug('Refresh interval changed', { interval: intervalMs });
  }

  /**
   * Refresh all data
   */
  async refreshAll(): Promise<void> {
    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.logger.debug('Refreshing all DevTools data');

    try {
      await Promise.all([
        this.loadSystemInfo(),
        this.loadMemoryInfo(),
        this.loadProcessInfo(),
        this.loadNetworkInfo(),
        this.loadDatabaseInfo(),
        this.loadConfigInfo(),
        this.loadPerformanceMetrics(),
        this.loadEvents(),
        this.loadBindings(),
        this.loadLogs(),
      ]);

      this.lastUpdated.set(new Date().toISOString());
      this.logger.info('DevTools data refreshed');
    } catch (error) {
      this.logger.error('Failed to refresh DevTools data', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Refresh specific tab data
   */
  async refreshTab(tabId: string): Promise<void> {
    this.logger.debug('Refreshing tab', { tab: tabId });

    switch (tabId) {
      case 'overview':
      case 'system':
        await this.loadSystemInfo();
        break;
      case 'memory':
        await this.loadMemoryInfo();
        break;
      case 'process':
        await this.loadProcessInfo();
        break;
      case 'network':
        await this.loadNetworkInfo();
        break;
      case 'database':
        await this.loadDatabaseInfo();
        break;
      case 'config':
        await this.loadConfigInfo();
        break;
      case 'performance':
        await this.loadPerformanceMetrics();
        break;
      case 'events':
        await this.loadEvents();
        break;
      case 'bindings':
        await this.loadBindings();
        break;
      case 'logs':
        await this.loadLogs();
        break;
    }

    this.lastUpdated.set(new Date().toISOString());
  }

  /**
   * Load system information
   */
  private async loadSystemInfo(): Promise<void> {
    try {
      const data = await this.webui.call('getDevToolsSystemInfo') as unknown as SystemInfo;
      this.systemInfo.set(data);
    } catch (error) {
      this.logger.error('Failed to load system info', error);
    }
  }

  /**
   * Load memory information
   */
  private async loadMemoryInfo(): Promise<void> {
    try {
      const data = await this.webui.call('getDevToolsMemoryInfo') as unknown as MemoryInfo;
      this.memoryInfo.set(data);
    } catch (error) {
      this.logger.error('Failed to load memory info', error);
    }
  }

  /**
   * Load process information
   */
  private async loadProcessInfo(): Promise<void> {
    try {
      const data = await this.webui.call('getDevToolsProcessInfo') as unknown as ProcessInfo;
      this.processInfo.set(data);
    } catch (error) {
      this.logger.error('Failed to load process info', error);
    }
  }

  /**
   * Load network information
   */
  private async loadNetworkInfo(): Promise<void> {
    try {
      const data = await this.webui.call('getDevToolsNetworkInfo') as unknown as NetworkInfo;
      this.networkInfo.set(data);
    } catch (error) {
      this.logger.error('Failed to load network info', error);
    }
  }

  /**
   * Load database information
   */
  private async loadDatabaseInfo(): Promise<void> {
    try {
      const data = await this.webui.call('getDevToolsDatabaseInfo') as unknown as DatabaseInfo;
      this.databaseInfo.set(data);
    } catch (error) {
      this.logger.error('Failed to load database info', error);
    }
  }

  /**
   * Load configuration information
   */
  private async loadConfigInfo(): Promise<void> {
    try {
      const data = await this.webui.call('getDevToolsConfigInfo') as unknown as ConfigInfo;
      this.configInfo.set(data);
    } catch (error) {
      this.logger.error('Failed to load config info', error);
    }
  }

  /**
   * Load performance metrics (frontend + backend)
   */
  private async loadPerformanceMetrics(): Promise<void> {
    try {
      const backendMetrics = await this.webui.call('getDevToolsPerformanceMetrics') as unknown as PerformanceMetrics;
      
      // Merge with frontend metrics
      const frontendMetrics: PerformanceMetrics = {
        fps: this.calculateFPS(),
        dom_nodes: document.getElementsByTagName('*').length,
        js_heap_size_mb: this.getJSHeapSize(),
        js_heap_used_mb: this.getJSHeapUsed(),
        event_listeners: this.getEventListenerCount(),
        open_windows: 0, // Would need to track
        active_timers: 0, // Would need to track
        pending_requests: 0, // Would need to track
      };

      this.performanceMetrics.set({
        ...backendMetrics,
        ...frontendMetrics,
      });
    } catch (error) {
      this.logger.error('Failed to load performance metrics', error);
    }
  }

  /**
   * Load event log
   */
  private async loadEvents(): Promise<void> {
    try {
      const data = await this.webui.call('getDevToolsEvents') as unknown as EventLogEntry[];
      this.events.set(data);
    } catch (error) {
      this.logger.error('Failed to load events', error);
    }
  }

  /**
   * Load backend function bindings
   */
  private async loadBindings(): Promise<void> {
    try {
      const data = await this.webui.call('getDevToolsBindings') as unknown as BackendBinding[];
      this.bindings.set(data);
    } catch (error) {
      this.logger.error('Failed to load bindings', error);
    }
  }

  /**
   * Load logs
   */
  private async loadLogs(): Promise<void> {
    try {
      const data = await this.webui.call('getDevToolsLogs') as unknown as LogEntry[];
      this.logs.set(data);
    } catch (error) {
      this.logger.error('Failed to load logs', error);
    }
  }

  /**
   * Load environment information (frontend-only)
   */
  private loadEnvironmentInfo(): void {
    const envInfo: EnvironmentInfo = {
      angular_version: '19.2.18',
      production: false, // Would check environment
      browser: navigator.userAgent,
      user_agent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen_resolution: `${screen.width}x${screen.height}`,
      color_depth: screen.colorDepth,
      device_pixel_ratio: window.devicePixelRatio,
      cookies_enabled: navigator.cookieEnabled,
      local_storage_enabled: typeof localStorage !== 'undefined',
      session_storage_enabled: typeof sessionStorage !== 'undefined',
      webgl_enabled: this.isWebGLEnabled(),
      webgl_renderer: this.getWebGLRenderer(),
    };

    this.environmentInfo.set(envInfo);
  }

  /**
   * Clear events
   */
  async clearEvents(): Promise<void> {
    try {
      await this.webui.call('clearDevToolsEvents') as unknown as void;
      this.events.set([]);
      this.logger.info('Events cleared');
    } catch (error) {
      this.logger.error('Failed to clear events', error);
    }
  }

  /**
   * Clear logs
   */
  async clearLogs(): Promise<void> {
    try {
      await this.webui.call('clearDevToolsLogs') as unknown as void;
      this.logs.set([]);
      this.logger.info('Logs cleared');
    } catch (error) {
      this.logger.error('Failed to clear logs', error);
    }
  }

  /**
   * Helper: Calculate FPS (simplified)
   */
  private calculateFPS(): number {
    // Would need proper FPS tracking
    return 60;
  }

  /**
   * Helper: Get JS heap size
   */
  private getJSHeapSize(): number {
    if (performance && 'memory' in performance) {
      const mem = (performance as any).memory;
      return mem.jsHeapSizeLimit / (1024 * 1024);
    }
    return 0;
  }

  /**
   * Helper: Get JS heap used
   */
  private getJSHeapUsed(): number {
    if (performance && 'memory' in performance) {
      const mem = (performance as any).memory;
      return mem.usedJSHeapSize / (1024 * 1024);
    }
    return 0;
  }

  /**
   * Helper: Get event listener count
   */
  private getEventListenerCount(): number {
    // Would need proper tracking
    return 0;
  }

  /**
   * Helper: Check if WebGL is enabled
   */
  private isWebGLEnabled(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch {
      return false;
    }
  }

  /**
   * Helper: Get WebGL renderer
   */
  private getWebGLRenderer(): string | undefined {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          return (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
      }
    } catch {
      // Ignore
    }
    return undefined;
  }
}
