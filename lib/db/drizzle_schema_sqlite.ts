import { sqliteTable, integer, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('userid').notNull(),
  email: text('email').notNull(),
  username: text('username')
}, (table) => {
  return {
    userIdIdx: uniqueIndex('userid_idx').on(table.userId),
  }
});

export const stores = sqliteTable('stores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeHash: text('storehash').notNull(),
  accessToken: text('accesstoken'),
  scope: text('scope'),
  ownerId: integer('ownerid').notNull(),
  accountUuid: text('accountuuid').notNull()
}, (table) => {
  return {
    storeHashIdx: uniqueIndex('storehash_idx').on(table.storeHash),
  }
});

export const storeUsers = sqliteTable('storeusers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('userid').notNull(),
  storeHash: text('storehash').notNull()
}, (table) => {
  return {
    userStoreIdx: uniqueIndex('userid_storeHash_idx').on(table.userId, table.storeHash),
  }
}); 