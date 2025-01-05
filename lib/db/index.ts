import { drizzle as drizzlePostgres } from 'drizzle-orm/vercel-postgres';
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { sql } from '@vercel/postgres';
import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import * as pgSchema from './drizzle_schema_pg';
import * as mysqlSchema from './drizzle_schema_mysql';
import * as sqliteSchema from './drizzle_schema_sqlite';
import { eq, and } from 'drizzle-orm';
import type { UserInfo } from '@/types/db';
import type { SessionProps } from '@/types';

const { DB_TYPE = 'postgres', DATABASE_URL } = process.env;

let drizzleDb: any;

switch (DB_TYPE) {
  case 'mysql':
    const pool = mysql.createPool(DATABASE_URL!);
    drizzleDb = drizzleMysql(pool, { schema: mysqlSchema, mode: 'default' });
    break;
  case 'sqlite':
    const sqlite = new Database(DATABASE_URL?.replace('sqlite:', '') || ':memory:');
    drizzleDb = drizzleSqlite(sqlite, { schema: sqliteSchema });
    break;
  default: // postgres
    drizzleDb = drizzlePostgres(sql, { schema: pgSchema });
    break;
}


interface AppDatabaseClient {
  hasStoreUser(storeHash: string, userId: number): Promise<boolean> | boolean;
  setUser(user: UserInfo): Promise<void>;
  setStore(session: SessionProps): Promise<void>;
  setStoreUser(session: SessionProps): Promise<void>;
  getStoreToken(storeHash: string | null): Promise<string | null>;
  deleteStore(storeHash: string): Promise<void>;
  deleteUser(storeHash: string, user: UserInfo): Promise<void>;
}

const db: AppDatabaseClient = {
  async hasStoreUser(storeHash: string, userId: number) {
    const schema = DB_TYPE === 'mysql' ? mysqlSchema : 
                  DB_TYPE === 'sqlite' ? sqliteSchema : 
                  pgSchema;
    
    const result = await drizzleDb.select()
      .from(schema.storeUsers)
      .where(and(
        eq(schema.storeUsers.storeHash, storeHash),
        eq(schema.storeUsers.userId, userId)
      ))
      .limit(1);
    
    return result.length > 0;
  },

  async setUser(user: UserInfo) {
    const schema = DB_TYPE === 'mysql' ? mysqlSchema : 
                  DB_TYPE === 'sqlite' ? sqliteSchema : 
                  pgSchema;

    await drizzleDb.insert(schema.users)
      .values({
        userId: user.id,
        email: user.email,
        username: user.username
      })
      .onConflictDoUpdate({
        target: schema.users.userId,
        set: { email: user.email, username: user.username }
      });
  },

  async setStore(session: SessionProps) {
    if (!session.store_hash || !session.access_token) return;

    const schema = DB_TYPE === 'mysql' ? mysqlSchema : 
                  DB_TYPE === 'sqlite' ? sqliteSchema : 
                  pgSchema;

    await drizzleDb.insert(schema.stores)
      .values({
        storeHash: session.store_hash,
        accessToken: session.access_token,
        scope: session.scope,
        adminId: session.user.id
      })
      .onConflictDoUpdate({
        target: schema.stores.storeHash,
        set: { 
          accessToken: session.access_token,
          scope: session.scope,
          adminId: session.user.id
        }
      });
  },

  async setStoreUser(session: SessionProps) {
    if (!session.store_hash || !session.user?.id) return;

    const schema = DB_TYPE === 'mysql' ? mysqlSchema : 
                  DB_TYPE === 'sqlite' ? sqliteSchema : 
                  pgSchema;

    await drizzleDb.insert(schema.storeUsers)
      .values({
        storeHash: session.store_hash,
        userId: session.user.id
      })
      .onConflictDoNothing();
  },

  async getStoreToken(storeHash: string | null) {
    if (!storeHash) return null;

    const schema = DB_TYPE === 'mysql' ? mysqlSchema : 
                  DB_TYPE === 'sqlite' ? sqliteSchema : 
                  pgSchema;

    const result = await drizzleDb.select({ accessToken: schema.stores.accessToken })
      .from(schema.stores)
      .where(eq(schema.stores.storeHash, storeHash))
      .limit(1);

    return result[0]?.accessToken || null;
  },

  async deleteStore(storeHash: string) {
    const schema = DB_TYPE === 'mysql' ? mysqlSchema : 
                  DB_TYPE === 'sqlite' ? sqliteSchema : 
                  pgSchema;

    await drizzleDb.delete(schema.stores)
      .where(eq(schema.stores.storeHash, storeHash));
  },

  async deleteUser(storeHash: string, user: UserInfo) {
    const schema = DB_TYPE === 'mysql' ? mysqlSchema : 
                  DB_TYPE === 'sqlite' ? sqliteSchema : 
                  pgSchema;

    await drizzleDb.delete(schema.storeUsers)
      .where(and(
        eq(schema.storeUsers.storeHash, storeHash),
        eq(schema.storeUsers.userId, user.id)
      ));
  }
};

export { db, drizzleDb };
