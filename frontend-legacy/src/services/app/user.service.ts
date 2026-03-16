import { Injectable } from '@angular/core';
import { WebUIService } from './webui.service';
import { validateUserInput, formatValidationErrors } from '../../utils/validation';

/**
 * User interface
 */
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * User service - Concrete implementation for user management with validation
 * Replaces: Unused generic CrudService<T>
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private readonly webui: WebUIService) {}

  /**
   * Get all users
   */
  async getAll(): Promise<User[]> {
    return this.webui.call<User[]>('getUsers');
  }

  /**
   * Get user by ID
   */
  async getById(id: number): Promise<User> {
    return this.webui.call<User>('getUser', [id.toString()]);
  }

  /**
   * Create or update user with validation
   */
  async save(user: Partial<User>): Promise<User> {
    // Validate input before sending to backend
    const validation = validateUserInput(user);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${formatValidationErrors(validation.errors)}`);
    }

    return this.webui.call<User>('saveUser', [JSON.stringify(user)]);
  }

  /**
   * Delete user
   */
  async delete(id: number): Promise<void> {
    return this.webui.call<void>('deleteUser', [id.toString()]);
  }

  /**
   * Search users by name or email
   */
  async search(query: string): Promise<User[]> {
    return this.webui.call<User[]>('searchUsers', [query]);
  }

  /**
   * Get user statistics
   */
  async getStats(): Promise<{ total: number; active: number; inactive: number }> {
    return this.webui.call<{ total: number; active: number; inactive: number }>('getUserStats');
  }
}
