import { mysqlTable, int, varchar, uniqueIndex } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('userid').notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  username: varchar('username', { length: 255 })
}, (table) => {
  return {
    userIdIdx: uniqueIndex('userid_idx').on(table.userId),
  }
});

export const stores = mysqlTable('stores', {
  id: int('id').primaryKey().autoincrement(),
  storeHash: varchar('storehash', { length: 10 }).notNull(),
  accessToken: varchar('accesstoken', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  adminId: int('adminid').notNull()
}, (table) => {
  return {
    storeHashIdx: uniqueIndex('storehash_idx').on(table.storeHash),
  }
});

export const storeUsers = mysqlTable('storeusers', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('userid').notNull(),
  storeHash: varchar('storehash', { length: 10 }).notNull()
}, (table) => {
  return {
    userStoreIdx: uniqueIndex('userid_storeHash_idx').on(table.userId, table.storeHash),
  }
}); 