import { Injectable, signal, computed, NgZone } from '@angular/core';
import { getLogger } from '../viewmodels/logger';
import { StorageService } from './storage.service';
import { WebUIService } from './webui.service';
import { Result, isOk, isErr, ErrorValue, ErrorCode } from '../types/error.types';

/**
 * User role enumeration
 */
export type UserRole = 'guest' | 'user' | 'moderator' | 'admin' | 'superadmin';

/**
 * User permissions
 */
export type UserPermission =
  | 'read'
  | 'write'
  | 'delete'
  | 'admin'
  | 'manage_users'
  | 'manage_settings'
  | 'manage_content';

/**
 * User profile interface
 */
export interface UserProfile {
  id: number | string;
  username: string;
  email: string;
  role: UserRole;
  permissions: UserPermission[];
  displayName?: string;
  avatar?: string;
  lastLogin?: string;
  createdAt?: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Registration data
 */
export interface RegistrationData {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

/**
 * Authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Role hierarchy for permission checks
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  guest: 0,
  user: 1,
  moderator: 2,
  admin: 3,
  superadmin: 4,
};

/**
 * Default permissions by role
 */
const ROLE_PERMISSIONS: Record<UserRole, UserPermission[]> = {
  guest: [],
  user: ['read'],
  moderator: ['read', 'write', 'delete'],
  admin: ['read', 'write', 'delete', 'admin', 'manage_content'],
  superadmin: ['read', 'write', 'delete', 'admin', 'manage_users', 'manage_settings', 'manage_content'],
};

/**
 * Authentication service for managing user sessions
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly logger = getLogger('auth');
  private readonly storage: StorageService;
  private readonly webui: WebUIService;
  private readonly ngZone: NgZone;

  private readonly authState = signal<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
  readonly currentUser = computed(() => this.authState().user);
  readonly currentRole = computed(() => this.authState().user?.role || 'guest');
  readonly isLoading = computed(() => this.authState().loading);
  readonly error = computed(() => this.authState().error);

  readonly permissions = computed(() => {
    const user = this.authState().user;
    if (!user) return [];
    return user.permissions.length > 0 ? user.permissions : ROLE_PERMISSIONS[user.role];
  });

  constructor(storage: StorageService, webui: WebUIService, ngZone: NgZone) {
    this.storage = storage;
    this.webui = webui;
    this.ngZone = ngZone;
    this.initialize();
  }

  /**
   * Initialize authentication state from storage
   */
  private async initialize(): Promise<void> {
    try {
      const token = this.storage.get<string>('auth_token');
      const savedUser = this.storage.get<UserProfile>('auth_user');

      if (token && savedUser) {
        // Verify token with backend
        const result = await this.verifyToken(token);

        if (isOk(result)) {
          this.authState.set({
            isAuthenticated: true,
            user: result.value,
            token,
            loading: false,
            error: null,
          });
          this.logger.info('Session restored', { username: savedUser.username });
        } else {
          // Token invalid, clear storage
          this.clearAuth();
          this.authState.update((state) => ({ ...state, loading: false }));
        }
      } else {
        this.authState.update((state) => ({ ...state, loading: false }));
      }
    } catch (err) {
      this.logger.error('Initialization failed', { error: err });
      this.authState.update((state) => ({
        ...state,
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  /**
   * Login with credentials
   */
  async login(credentials: LoginCredentials): Promise<Result<UserProfile>> {
    this.authState.update((state) => ({ ...state, loading: true, error: null }));

    try {
      // Call backend login function
      const result = await this.webui.call<{ token: string; user: UserProfile }>('login', [
        JSON.stringify(credentials),
      ]);

      if (isOk(result)) {
        const { token, user } = result.value;

        // Store auth data
        if (credentials.rememberMe) {
          this.storage.set('auth_token', token);
          this.storage.set('auth_user', user);
        } else {
          // Session storage only
          const sessionStorageService = StorageService.session();
          sessionStorageService.set('auth_token', token);
          sessionStorageService.set('auth_user', user);
        }

        this.authState.set({
          isAuthenticated: true,
          user,
          token,
          loading: false,
          error: null,
        });

        this.logger.info('Login successful', { username: user.username, role: user.role });
        return { ok: true, value: user };
      } else {
        this.authState.update((state) => ({
          ...state,
          loading: false,
          error: result.error.message,
        }));
        this.logger.warn('Login failed', { error: result.error.message });
        return result;
      }
    } catch (err) {
      const error: ErrorValue = {
        code: ErrorCode.InternalError,
        message: err instanceof Error ? err.message : String(err),
      };
      this.authState.update((state) => ({
        ...state,
        loading: false,
        error: error.message,
      }));
      return { ok: false, error };
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegistrationData): Promise<Result<UserProfile>> {
    this.authState.update((state) => ({ ...state, loading: true, error: null }));

    try {
      const result = await this.webui.call<UserProfile>('register', [JSON.stringify(data)]);

      if (isOk(result)) {
        this.logger.info('Registration successful', { username: result.value.username });
        this.authState.update((state) => ({ ...state, loading: false }));
        return result;
      } else {
        this.authState.update((state) => ({
          ...state,
          loading: false,
          error: result.error.message,
        }));
        return result;
      }
    } catch (err) {
      const error: ErrorValue = {
        code: ErrorCode.InternalError,
        message: err instanceof Error ? err.message : String(err),
      };
      this.authState.update((state) => ({
        ...state,
        loading: false,
        error: error.message,
      }));
      return { ok: false, error };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    const user = this.currentUser();

    // Call backend logout
    await this.webui.call('logout');

    // Clear auth data
    this.clearAuth();

    this.logger.info('Logout successful', { username: user?.username });
  }

  /**
   * Verify token with backend
   */
  private async verifyToken(token: string): Promise<Result<UserProfile>> {
    return this.webui.call<UserProfile>('verify_token', [token]);
  }

  /**
   * Clear authentication data
   */
  private clearAuth(): void {
    this.storage.remove('auth_token');
    this.storage.remove('auth_user');

    const sessionStorageService = StorageService.session();
    sessionStorageService.remove('auth_token');
    sessionStorageService.remove('auth_user');

    this.authState.set({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null,
    });
  }

  /**
   * Check if user has required role
   */
  hasRole(requiredRole: UserRole): boolean {
    const currentRole = this.currentRole();
    return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[requiredRole];
  }

  /**
   * Check if user has required permission
   */
  hasPermission(permission: UserPermission): boolean {
    return this.permissions().includes(permission);
  }

  /**
   * Check if user has any of the required permissions
   */
  hasAnyPermission(permissions: UserPermission[]): boolean {
    return permissions.some((p) => this.hasPermission(p));
  }

  /**
   * Check if user has all required permissions
   */
  hasAllPermissions(permissions: UserPermission[]): boolean {
    return permissions.every((p) => this.hasPermission(p));
  }

  /**
   * Check if user can perform action based on role
   */
  can(role: UserRole, permission?: UserPermission): boolean {
    if (!this.isAuthenticated()) {
      return false;
    }

    if (!this.hasRole(role)) {
      return false;
    }

    if (permission && !this.hasPermission(permission)) {
      return false;
    }

    return true;
  }

  /**
   * Update current user profile
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<Result<UserProfile>> {
    const userId = this.currentUser()?.id;
    if (!userId) {
      return { ok: false, error: { code: ErrorCode.ResourceNotFound, message: 'No user logged in' } };
    }

    const result = await this.webui.call<UserProfile>('update_profile', [userId.toString(), JSON.stringify(updates)]);

    if (isOk(result)) {
      this.authState.update((state) => ({
        ...state,
        user: result.value,
      }));

      // Update storage
      this.storage.set('auth_user', result.value);
    }

    return result;
  }

  /**
   * Change password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<Result<boolean>> {
    const userId = this.currentUser()?.id;
    if (!userId) {
      return { ok: false, error: { code: ErrorCode.ResourceNotFound, message: 'No user logged in' } };
    }

    return this.webui.call<boolean>('change_password', [
      userId.toString(),
      oldPassword,
      newPassword,
    ]);
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<Result<boolean>> {
    return this.webui.call<boolean>('reset_password', [email]);
  }

  /**
   * Get auth token
   */
  getToken(): string | null {
    return this.authState().token;
  }

  /**
   * Refresh current session
   */
  async refresh(): Promise<Result<UserProfile>> {
    const token = this.getToken();
    if (!token) {
      return { ok: false, error: { code: ErrorCode.InternalError, message: 'No token available' } };
    }

    return this.verifyToken(token);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.authState.update((state) => ({ ...state, error: null }));
  }
}
