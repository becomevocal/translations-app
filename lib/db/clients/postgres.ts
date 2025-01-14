import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from '../drizzle-schema-pg';
import { eq, and, desc } from 'drizzle-orm';
import type { DatabaseOperations } from './types';
import type { BaseUser, AuthSession } from '@/types';
import type { TranslationJob } from '@/types/jobs';

export class PostgresClient implements DatabaseOperations {
  protected db = drizzle(sql, { schema });
  protected schema = schema;

  async hasStoreUser(storeHash: string, userId: number) {
    const result = await this.db
      .select()
      .from(this.schema.storeUsers)
      .where(and(
        eq(this.schema.storeUsers.storeHash, storeHash),
        eq(this.schema.storeUsers.userId, userId)
      ))
      .limit(1);
    return result.length > 0;
  }

  async setUser(user: BaseUser) {
    if (!user) return;
    await this.db
      .insert(this.schema.users)
      .values({
        userId: user.id,
        email: user.email,
        username: user.username
      })
      .onConflictDoUpdate({
        target: this.schema.users.userId,
        set: { email: user.email, username: user.username }
      });
  }

  async setStore(session: AuthSession) {
    if (!session.store_hash || !session.access_token || !session.account_uuid) return;
    await this.db
      .insert(this.schema.stores)
      .values({
        storeHash: session.store_hash,
        accessToken: session.access_token,
        scope: session.scope,
        ownerId: session.owner.id,
        accountUuid: session.account_uuid
      })
      .onConflictDoUpdate({
        target: this.schema.stores.storeHash,
        set: { 
          accessToken: session.access_token,
          scope: session.scope,
          ownerId: session.owner.id,
          accountUuid: session.account_uuid
        }
      });
  }

  async setStoreUser(session: AuthSession) {
    if (!session.store_hash || !session.user?.id) return;
    await this.db
      .insert(this.schema.storeUsers)
      .values({
        storeHash: session.store_hash,
        userId: session.user.id
      })
      .onConflictDoNothing();
  }

  async getStoreToken(storeHash: string | null) {
    if (!storeHash) return null;
    const result = await this.db
      .select({ accessToken: this.schema.stores.accessToken })
      .from(this.schema.stores)
      .where(eq(this.schema.stores.storeHash, storeHash))
      .limit(1);
    return result[0]?.accessToken || null;
  }

  async deleteStore(storeHash: string) {
    if (!storeHash) return;
    await this.db
      .delete(this.schema.stores)
      .where(eq(this.schema.stores.storeHash, storeHash));
  }

  async deleteUser(storeHash: string, user: BaseUser) {
    if (!storeHash || !user) return;
    await this.db
      .delete(this.schema.storeUsers)
      .where(and(
        eq(this.schema.storeUsers.storeHash, storeHash),
        eq(this.schema.storeUsers.userId, user.id)
      ));
  }

  async getTranslationJobs(storeHash: string) {
    return this.db
      .select()
      .from(this.schema.translationJobs)
      .where(eq(this.schema.translationJobs.storeHash, storeHash))
      .orderBy(desc(this.schema.translationJobs.createdAt));
  }

  async createTranslationJob(data: {
    storeHash: string;
    jobType: 'import' | 'export';
    channelId: number;
    locale: string;
    fileUrl?: string;
  }) {
    const result = await this.db
      .insert(this.schema.translationJobs)
      .values({
        ...data,
        status: 'pending',
      })
      .returning();
    return result[0];
  }

  async updateTranslationJob(id: number, data: Partial<TranslationJob>) {
    const result = await this.db
      .update(this.schema.translationJobs)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(this.schema.translationJobs.id, id))
      .returning();
    return result[0];
  }

  async getPendingTranslationJobs() {
    return this.db
      .select()
      .from(this.schema.translationJobs)
      .where(eq(this.schema.translationJobs.status, 'pending'))
      .orderBy(this.schema.translationJobs.createdAt);
  }

  async getPendingTranslationJobsByStore(storeHash: string) {
    return this.db
      .select()
      .from(this.schema.translationJobs)
      .where(and(eq(this.schema.translationJobs.status, 'pending'), eq(this.schema.translationJobs.storeHash, storeHash)))
      .orderBy(this.schema.translationJobs.createdAt);
  }
} 