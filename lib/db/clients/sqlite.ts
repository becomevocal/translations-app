import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../drizzle-schema-sqlite";
import { eq, and } from "drizzle-orm";
import type { DatabaseOperations } from "./types";
import type { BaseUser, AuthSession } from "@/types";

const { DATABASE_URL } = process.env;

export class SQLiteClient implements DatabaseOperations {
  protected db = drizzle(
    new Database(DATABASE_URL?.replace("sqlite:", "") || ":memory:"),
    { schema }
  );
  protected schema = schema;

  async hasStoreUser(storeHash: string, userId: number) {
    const result = await this.db
      .select()
      .from(this.schema.storeUsers)
      .where(
        and(
          eq(this.schema.storeUsers.storeHash, storeHash),
          eq(this.schema.storeUsers.userId, userId)
        )
      )
      .limit(1)
      .all();
    return result.length > 0;
  }

  async setUser(user: BaseUser) {
    if (!user) return;
    try {
      await this.db.insert(this.schema.users).values({
        userId: user.id,
        email: user.email,
        username: user.username,
      });
    } catch (error) {
      // If insert fails, try update
      await this.db
        .update(this.schema.users)
        .set({ email: user.email, username: user.username })
        .where(eq(this.schema.users.userId, user.id));
    }
  }

  async setStore(session: AuthSession) {
    if (!session.store_hash || !session.access_token || !session.account_uuid)
      return;
    try {
      await this.db.insert(this.schema.stores).values({
        storeHash: session.store_hash,
        accessToken: session.access_token,
        scope: session.scope,
        ownerId: session.owner.id,
        accountUuid: session.account_uuid,
      });
    } catch (error) {
      // If insert fails, try update
      await this.db
        .update(this.schema.stores)
        .set({
          accessToken: session.access_token,
          scope: session.scope,
          ownerId: session.owner.id,
          accountUuid: session.account_uuid,
        })
        .where(eq(this.schema.stores.storeHash, session.store_hash));
    }
  }

  async setStoreUser(session: AuthSession) {
    if (!session.store_hash || !session.user?.id) return;
    try {
      await this.db.insert(this.schema.storeUsers).values({
        storeHash: session.store_hash,
        userId: session.user.id,
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
      .limit(1)
      .all();
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
      .where(
        and(
          eq(this.schema.storeUsers.storeHash, storeHash),
          eq(this.schema.storeUsers.userId, user.id)
        )
      );
  }
}
