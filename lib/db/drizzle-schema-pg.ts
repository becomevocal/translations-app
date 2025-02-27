import { pgTable, serial, integer, json, timestamp, text, varchar, uniqueIndex } from 'drizzle-orm/pg-core';

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
  ownerId: integer('ownerid').notNull(),
  accountUuid: text('accountuuid').notNull()
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

export const translationJobs = pgTable('translation_jobs', {
  id: serial('id').primaryKey(),
  storeHash: text('store_hash').notNull(),
  status: text('status', { enum: ['pending', 'processing', 'completed', 'failed'] }).notNull().default('pending'),
  jobType: text('job_type', { enum: ['import', 'export'] }).notNull(),
  fileUrl: text('file_url'),
  channelId: integer('channel_id').notNull(),
  locale: text('locale').notNull(),
  metadata: json('metadata'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const translationErrors = pgTable('translation_errors', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull(), // References translationJobs.id
  productId: integer('product_id').notNull(),
  lineNumber: integer('line_number').notNull(),
  errorType: text('error_type', { 
    enum: ['parse_error', 'validation_error', 'api_error', 'unknown']
  }).notNull(),
  errorMessage: text('error_message').notNull(),
  rawData: json('raw_data'), // Original data that caused the error
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export type TranslationJob = typeof translationJobs.$inferSelect;
export type NewTranslationJob = typeof translationJobs.$inferInsert;
export type TranslationError = typeof translationErrors.$inferSelect; 