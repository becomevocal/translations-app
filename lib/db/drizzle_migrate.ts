import { drizzle as drizzlePostgres } from 'drizzle-orm/vercel-postgres';
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { sql } from '@vercel/postgres';
import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import { migrate as pgMigrate } from 'drizzle-orm/vercel-postgres/migrator';
import { migrate as mysqlMigrate } from 'drizzle-orm/mysql2/migrator';
import { migrate as sqliteMigrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as pgSchema from './drizzle_schema_pg';
import * as mysqlSchema from './drizzle_schema_mysql';
import * as sqliteSchema from './drizzle_schema_sqlite';

const { DB_TYPE = 'postgres', DATABASE_URL } = process.env;

// This script runs all pending migrations in the /drizzle folder
async function main() {
  console.log('Running migrations...');
  
  try {
    switch (DB_TYPE) {
      case 'mysql': {
        const pool = mysql.createPool(DATABASE_URL!);
        const db = drizzleMysql(pool, { schema: mysqlSchema, mode: 'default' });
        await mysqlMigrate(db, { migrationsFolder: './drizzle' });
        break;
      }
      case 'sqlite': {
        const sqlite = new Database(DATABASE_URL?.replace('sqlite:', '') || ':memory:');
        const db = drizzleSqlite(sqlite, { schema: sqliteSchema });
        await sqliteMigrate(db, { migrationsFolder: './drizzle' });
        break;
      }
      default: {
        const db = drizzlePostgres(sql, { schema: pgSchema });
        await pgMigrate(db, { migrationsFolder: './drizzle' });
        break;
      }
    }
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main(); 