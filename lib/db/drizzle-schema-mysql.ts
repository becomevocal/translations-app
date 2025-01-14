import { mysqlTable, int, varchar, uniqueIndex, json, timestamp, text } from 'drizzle-orm/mysql-core';

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
  ownerId: int('ownerid').notNull(),
  accountUuid: varchar('accountuuid', { length: 255 }).notNull()
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

export const translationJobs = mysqlTable('translation_jobs', {
  id: int('id').primaryKey().autoincrement(),
  storeHash: text('store_hash').notNull(),
  status: varchar('status', { length: 20, enum: ['pending', 'processing', 'completed', 'failed'] }).notNull().default('pending'),
  jobType: varchar('job_type', { length: 10, enum: ['import', 'export'] }).notNull(),
  fileUrl: text('file_url'),
  channelId: int('channel_id').notNull(),
  locale: varchar('locale', { length: 10 }).notNull(),
  metadata: json('metadata'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type TranslationJob = typeof translationJobs.$inferSelect;
export type NewTranslationJob = typeof translationJobs.$inferInsert; 