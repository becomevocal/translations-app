import type { UserInfo } from '@/types/db';
import type { SessionProps } from '@/types';

export interface DatabaseOperations {
  hasStoreUser(storeHash: string, userId: number): Promise<boolean>;
  setUser(user: UserInfo): Promise<void>;
  setStore(session: SessionProps): Promise<void>;
  setStoreUser(session: SessionProps): Promise<void>;
  getStoreToken(storeHash: string | null): Promise<string | null>;
  deleteStore(storeHash: string): Promise<void>;
  deleteUser(storeHash: string, user: UserInfo): Promise<void>;
} 