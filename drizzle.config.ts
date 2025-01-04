import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

const { DB_TYPE = 'postgres', DATABASE_URL = '' } = process.env;

// Get database configuration based on DB_TYPE
const config: Config = {
  schema: './lib/dbs/drizzle_schema.ts',
  out: './drizzle',
  dialect: DB_TYPE === 'mysql' ? 'mysql' :
          DB_TYPE === 'sqlite' ? 'sqlite' : 'postgresql'
};

export default config; 