import { db } from '.';
import { migrate as pgMigrate } from 'drizzle-orm/vercel-postgres/migrator';
import { migrate as mysqlMigrate } from 'drizzle-orm/mysql2/migrator';
import { migrate as sqliteMigrate } from 'drizzle-orm/better-sqlite3/migrator';

const { DB_TYPE = 'postgres' } = process.env;

// This script runs all pending migrations in the /drizzle folder
async function main() {
  console.log('Running migrations...');
  
  try {
    switch (DB_TYPE) {
      case 'mysql':
        await mysqlMigrate(db, { migrationsFolder: './drizzle' });
        break;
      case 'sqlite':
        await sqliteMigrate(db, { migrationsFolder: './drizzle' });
        break;
      default: // postgres
        await pgMigrate(db, { migrationsFolder: './drizzle' });
        break;
    }
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main(); 