"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeUsers = exports.stores = exports.users = void 0;
var sqlite_core_1 = require("drizzle-orm/sqlite-core");
exports.users = (0, sqlite_core_1.sqliteTable)('users', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.integer)('userid').notNull(),
    email: (0, sqlite_core_1.text)('email').notNull(),
    username: (0, sqlite_core_1.text)('username')
}, function (table) {
    return {
        userIdIdx: (0, sqlite_core_1.uniqueIndex)('userid_idx').on(table.userId),
    };
});
exports.stores = (0, sqlite_core_1.sqliteTable)('stores', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    storeHash: (0, sqlite_core_1.text)('storehash').notNull(),
    accessToken: (0, sqlite_core_1.text)('accesstoken'),
    scope: (0, sqlite_core_1.text)('scope'),
    ownerId: (0, sqlite_core_1.integer)('ownerid').notNull(),
    accountUuid: (0, sqlite_core_1.text)('accountuuid').notNull()
}, function (table) {
    return {
        storeHashIdx: (0, sqlite_core_1.uniqueIndex)('storehash_idx').on(table.storeHash),
    };
});
exports.storeUsers = (0, sqlite_core_1.sqliteTable)('storeusers', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.integer)('userid').notNull(),
    storeHash: (0, sqlite_core_1.text)('storehash').notNull()
}, function (table) {
    return {
        userStoreIdx: (0, sqlite_core_1.uniqueIndex)('userid_storeHash_idx').on(table.userId, table.storeHash),
    };
});
