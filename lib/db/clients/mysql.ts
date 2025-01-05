import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle_schema_mysql';
import { eq, and } from 'drizzle-orm';
import type { DatabaseOperations } from './types';
import type { UserInfo } from '@/types/db';
import type { SessionProps } from '@/types';

const { DATABASE_URL } = process.env;

export class MySQLClient implements DatabaseOperations {
  protected db = drizzle(mysql.createPool(DATABASE_URL!), { schema, mode: 'default' });
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

  async setUser(user: UserInfo) {
    if (!user) return;
    try {
      await this.db
        .insert(this.schema.users)
        .values({
          userId: user.id,
          email: user.email,
          username: user.username
        });
    } catch (error) {
      // If insert fails, try update
      await this.db
        .update(this.schema.users)
        .set({ email: user.email, username: user.username })
        .where(eq(this.schema.users.userId, user.id));
    }
  }

  async setStore(session: SessionProps) {
    if (!session.store_hash || !session.access_token || !session.account_uuid) return;
    try {
      await this.db
        .insert(this.schema.stores)
        .values({
          storeHash: session.store_hash,
          accessToken: session.access_token,
          scope: session.scope,
          ownerId: session.owner.id,
          accountUuid: session.account_uuid
        });
    } catch (error) {
      // If insert fails, try update
      await this.db
        .update(this.schema.stores)
        .set({ 
          accessToken: session.access_token,
          scope: session.scope,
          ownerId: session.owner.id,
          accountUuid: session.account_uuid
        })
        .where(eq(this.schema.stores.storeHash, session.store_hash));
    }
  }

  async setStoreUser(session: SessionProps) {
    if (!session.store_hash || !session.user?.id) return;
    try {
      await this.db
        .insert(this.schema.storeUsers)
        .values({
          storeHash: session.store_hash,
          userId: session.user.id
        });
    } catch (error) {
      // Ignore duplicate key errors
    }
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

  async deleteUser(storeHash: string, user: UserInfo) {
    if (!storeHash || !user) return;
    await this.db
      .delete(this.schema.storeUsers)
      .where(and(
        eq(this.schema.storeUsers.storeHash, storeHash),
        eq(this.schema.storeUsers.userId, user.id)
      ));
  }
} 