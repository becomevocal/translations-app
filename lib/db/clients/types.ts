import type { BaseUser, AuthSession } from '@/types';

export interface DatabaseOperations {
  hasStoreUser(storeHash: string, userId: number): Promise<boolean>;
  setUser(user: BaseUser): Promise<void>;
  setStore(session: AuthSession): Promise<void>;
  setStoreUser(session: AuthSession): Promise<void>;
  getStoreToken(storeHash: string | null): Promise<string | null>;
  deleteStore(storeHash: string): Promise<void>;
  deleteUser(storeHash: string, user: BaseUser): Promise<void>;
} 