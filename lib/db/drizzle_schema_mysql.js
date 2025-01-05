"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeUsers = exports.stores = exports.users = void 0;
var mysql_core_1 = require("drizzle-orm/mysql-core");
exports.users = (0, mysql_core_1.mysqlTable)('users', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    userId: (0, mysql_core_1.int)('userid').notNull(),
    email: (0, mysql_core_1.varchar)('email', { length: 255 }).notNull(),
    username: (0, mysql_core_1.varchar)('username', { length: 255 })
}, function (table) {
    return {
        userIdIdx: (0, mysql_core_1.uniqueIndex)('userid_idx').on(table.userId),
    };
});
exports.stores = (0, mysql_core_1.mysqlTable)('stores', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    storeHash: (0, mysql_core_1.varchar)('storehash', { length: 10 }).notNull(),
    accessToken: (0, mysql_core_1.varchar)('accesstoken', { length: 255 }),
    scope: (0, mysql_core_1.varchar)('scope', { length: 255 }),
    ownerId: (0, mysql_core_1.int)('ownerid').notNull(),
    accountUuid: (0, mysql_core_1.varchar)('accountuuid', { length: 255 }).notNull()
}, function (table) {
    return {
        storeHashIdx: (0, mysql_core_1.uniqueIndex)('storehash_idx').on(table.storeHash),
    };
});
exports.storeUsers = (0, mysql_core_1.mysqlTable)('storeusers', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    userId: (0, mysql_core_1.int)('userid').notNull(),
    storeHash: (0, mysql_core_1.varchar)('storehash', { length: 10 }).notNull()
}, function (table) {
    return {
        userStoreIdx: (0, mysql_core_1.uniqueIndex)('userid_storeHash_idx').on(table.userId, table.storeHash),
    };
});
