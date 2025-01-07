import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from '../drizzle-schema-pg';
import { eq, and } from 'drizzle-orm';
import type { DatabaseOperations } from './types';
import type { BaseUser, AuthSession } from '@/types';

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
} 