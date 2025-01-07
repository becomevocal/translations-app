import type { AuthUser } from './user';

/**
 * Base session properties that are always required
 */
export interface BaseSession {
  context: string;
  store_hash: string;
  access_token: string;
}

/**
 * Extended session properties for authenticated sessions
 */
export interface AuthSession extends BaseSession {
  owner: AuthUser;
  user: AuthUser;
  scope?: string;
  sub?: string;
  timestamp?: number;
  url?: string;
  account_uuid: string;
}

/**
 * Type guard to check if a session is an authenticated session
 */
export function isAuthSession(session: BaseSession | AuthSession): session is AuthSession {
  return 'owner' in session && 'user' in session;
} 