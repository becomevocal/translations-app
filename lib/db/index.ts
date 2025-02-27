import { PostgresClient } from './clients/postgres';
import { MySQLClient } from './clients/mysql';
import { SQLiteClient } from './clients/sqlite';
import type { DatabaseOperations } from './clients/types';

const { DB_TYPE = 'postgres' } = process.env;

export const dbClient: DatabaseOperations = (() => {
  switch (DB_TYPE) {
    case 'mysql': return new MySQLClient();
    case 'sqlite': return new SQLiteClient();
    default: return new PostgresClient();
  }
})();

export async function logTranslationError({
  jobId,
  productId,
  lineNumber,
  errorType,
  errorMessage,
  rawData,
  createdAt = Date.now(),
}: {
  jobId: number;
  productId: number;
  lineNumber: number;
  errorType: string;
  errorMessage: string;
  rawData: string;
  createdAt?: number;
}) {
  await dbClient.createTranslationError({
    jobId,
    productId,
    lineNumber,
    errorType,
    errorMessage,
    rawData: JSON.parse(rawData),
  });
}

