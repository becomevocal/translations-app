import { pgTable, serial, integer, text, varchar, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  userId: integer('userid').notNull(),
  email: text('email').notNull(),
  username: text('username')
}, (table) => {
  return {
    userIdIdx: uniqueIndex('userid_idx').on(table.userId),
  }
});

export const stores = pgTable('stores', {
  id: serial('id').primaryKey(),
  storeHash: varchar('storehash', { length: 10 }).notNull(),
  accessToken: text('accesstoken'),
  scope: text('scope'),
  adminId: integer('adminid').notNull()
}, (table) => {
  return {
    storeHashIdx: uniqueIndex('storehash_idx').on(table.storeHash),
  }
});

export const storeUsers = pgTable('storeusers', {
  id: serial('id').primaryKey(),
  userId: integer('userid').notNull(),
  storeHash: varchar('storehash', { length: 10 }).notNull()
}, (table) => {
  return {
    userStoreIdx: uniqueIndex('userid_storeHash_idx').on(table.userId, table.storeHash),
  }
}); 