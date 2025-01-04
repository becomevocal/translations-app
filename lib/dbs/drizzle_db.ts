import { drizzle as drizzlePostgres } from 'drizzle-orm/vercel-postgres';
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { sql } from '@vercel/postgres';
import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import * as schema from './drizzle_schema';

const { DB_TYPE = 'postgres', DATABASE_URL } = process.env;

let db: any;

switch (DB_TYPE) {
  case 'mysql':
    const pool = mysql.createPool(DATABASE_URL!);
    db = drizzleMysql(pool, { schema, mode: 'default' });
    break;
  case 'sqlite':
    const sqlite = new Database(DATABASE_URL?.replace('sqlite:', '') || ':memory:');
    db = drizzleSqlite(sqlite, { schema });
    break;
  default: // postgres
    db = drizzlePostgres(sql, { schema });
    break;
}

export { db };
