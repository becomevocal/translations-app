import type { BaseUser, AuthSession } from '@/types';
import type { TranslationJob as PgTranslationJob } from '../drizzle-schema-pg';
import type { TranslationJob as MySQLTranslationJob } from '../drizzle-schema-mysql';
import type { TranslationJob as SQLiteTranslationJob } from '../drizzle-schema-sqlite';

// Union type to support all database types
export type TranslationJob = PgTranslationJob | MySQLTranslationJob | SQLiteTranslationJob;

export interface DatabaseOperations {
  // Auth operations
  hasStoreUser(storeHash: string, userId: number): Promise<boolean>;
  setUser(user: BaseUser): Promise<void>;
  setStore(session: AuthSession): Promise<void>;
  setStoreUser(session: AuthSession): Promise<void>;
  getStoreToken(storeHash: string | null): Promise<string | null>;
  deleteStore(storeHash: string): Promise<void>;
  deleteUser(storeHash: string, user: BaseUser): Promise<void>;

  // Translation job operations
  getTranslationJobs(storeHash: string): Promise<TranslationJob[]>;
  createTranslationJob(data: {
    storeHash: string;
    jobType: 'import' | 'export';
    channelId: number;
    locale: string;
    fileUrl?: string;
  }): Promise<TranslationJob>;
  updateTranslationJob(id: number, data: Partial<TranslationJob>): Promise<TranslationJob>;
  getPendingTranslationJobs(): Promise<TranslationJob[]>;
  getPendingTranslationJobsByStore(storeHash: string): Promise<TranslationJob[]>;
} 