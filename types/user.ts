/**
 * Core user type that represents the minimum required user information
 */
export interface BaseUser {
  id: number;
  email: string;
  username?: string;
}

/**
 * Extended user type with locale information used in auth contexts
 */
export interface AuthUser extends BaseUser {
  locale?: string;
}

/**
 * User type with store-specific information
 */
export interface StoreUser extends BaseUser {
  storeHash: string;
}

/**
 * Type guard to check if a user object is a store user
 */
export function isStoreUser(user: BaseUser | StoreUser): user is StoreUser {
  return "storeHash" in user;
}
