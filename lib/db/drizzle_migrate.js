"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var vercel_postgres_1 = require("drizzle-orm/vercel-postgres");
var mysql2_1 = require("drizzle-orm/mysql2");
var better_sqlite3_1 = require("drizzle-orm/better-sqlite3");
var postgres_1 = require("@vercel/postgres");
var promise_1 = require("mysql2/promise");
var better_sqlite3_2 = require("better-sqlite3");
var migrator_1 = require("drizzle-orm/vercel-postgres/migrator");
var migrator_2 = require("drizzle-orm/mysql2/migrator");
var migrator_3 = require("drizzle-orm/better-sqlite3/migrator");
var pgSchema = require("./drizzle_schema_pg");
var mysqlSchema = require("./drizzle_schema_mysql");
var sqliteSchema = require("./drizzle_schema_sqlite");
var _a = process.env, _b = _a.DB_TYPE, DB_TYPE = _b === void 0 ? 'postgres' : _b, DATABASE_URL = _a.DATABASE_URL;
// This script runs all pending migrations in the /drizzle folder
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, pool, db, sqlite, db, db, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('Running migrations...');
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 9, , 10]);
                    _a = DB_TYPE;
                    switch (_a) {
                        case 'mysql': return [3 /*break*/, 2];
                        case 'sqlite': return [3 /*break*/, 4];
                    }
                    return [3 /*break*/, 6];
                case 2:
                    pool = promise_1.default.createPool(DATABASE_URL);
                    db = (0, mysql2_1.drizzle)(pool, { schema: mysqlSchema, mode: 'default' });
                    return [4 /*yield*/, (0, migrator_2.migrate)(db, { migrationsFolder: './drizzle' })];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 8];
                case 4:
                    sqlite = new better_sqlite3_2.default((DATABASE_URL === null || DATABASE_URL === void 0 ? void 0 : DATABASE_URL.replace('sqlite:', '')) || ':memory:');
                    db = (0, better_sqlite3_1.drizzle)(sqlite, { schema: sqliteSchema });
                    return [4 /*yield*/, (0, migrator_3.migrate)(db, { migrationsFolder: './drizzle' })];
                case 5:
                    _b.sent();
                    return [3 /*break*/, 8];
                case 6:
                    db = (0, vercel_postgres_1.drizzle)(postgres_1.sql, { schema: pgSchema });
                    return [4 /*yield*/, (0, migrator_1.migrate)(db, { migrationsFolder: './drizzle' })];
                case 7:
                    _b.sent();
                    return [3 /*break*/, 8];
                case 8:
                    console.log('Migrations completed successfully');
                    return [3 /*break*/, 10];
                case 9:
                    error_1 = _b.sent();
                    console.error('Error running migrations:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 10];
                case 10:
                    process.exit(0);
                    return [2 /*return*/];
            }
        });
    });
}
main();
