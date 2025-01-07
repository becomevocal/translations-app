import type { BaseUser } from './user';
import type { AuthSession } from './session';

/**
 * Database operations interface that all database clients must implement
 */
export interface DatabaseOperations {
  /**
   * Check if a user has access to a store
   */
  hasStoreUser(storeHash: string, userId: number): Promise<boolean>;

  /**
   * Create or update a user
   */
  setUser(user: BaseUser): Promise<void>;

  /**
   * Create or update store information from a session
   */
  setStore(session: AuthSession): Promise<void>;

  /**
   * Create a store user association
   */
  setStoreUser(session: AuthSession): Promise<void>;

  /**
   * Get a store's access token
   */
  getStoreToken(storeHash: string | null): Promise<string | null>;

  /**
   * Delete a store and all its associations
   */
  deleteStore(storeHash: string): Promise<void>;

  /**
   * Delete a user's association with a store
   */
  deleteUser(storeHash: string, user: BaseUser): Promise<void>;
}
