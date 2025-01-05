import { PostgresClient } from './clients/postgres';
import { MySQLClient } from './clients/mysql';
import { SQLiteClient } from './clients/sqlite';
import type { DatabaseOperations } from './clients/types';

const { DB_TYPE = 'postgres' } = process.env;

const dbClient: DatabaseOperations = (() => {
  switch (DB_TYPE) {
    case 'mysql': return new MySQLClient();
    case 'sqlite': return new SQLiteClient();
    default: return new PostgresClient();
  }
})();

export { dbClient };
