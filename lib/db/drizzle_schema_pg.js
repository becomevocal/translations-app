"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeUsers = exports.stores = exports.users = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('userid').notNull(),
    email: (0, pg_core_1.text)('email').notNull(),
    username: (0, pg_core_1.text)('username')
}, function (table) {
    return {
        userIdIdx: (0, pg_core_1.uniqueIndex)('userid_idx').on(table.userId),
    };
});
exports.stores = (0, pg_core_1.pgTable)('stores', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    storeHash: (0, pg_core_1.varchar)('storehash', { length: 10 }).notNull(),
    accessToken: (0, pg_core_1.text)('accesstoken'),
    scope: (0, pg_core_1.text)('scope'),
    ownerId: (0, pg_core_1.integer)('ownerid').notNull(),
    accountUuid: (0, pg_core_1.text)('accountuuid').notNull()
}, function (table) {
    return {
        storeHashIdx: (0, pg_core_1.uniqueIndex)('storehash_idx').on(table.storeHash),
    };
});
exports.storeUsers = (0, pg_core_1.pgTable)('storeusers', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('userid').notNull(),
    storeHash: (0, pg_core_1.varchar)('storehash', { length: 10 }).notNull()
}, function (table) {
    return {
        userStoreIdx: (0, pg_core_1.uniqueIndex)('userid_storeHash_idx').on(table.userId, table.storeHash),
    };
});
