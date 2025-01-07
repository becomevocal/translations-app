import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
import { join } from "path";

// Load environment variables from .env.local first, then fall back to .env
dotenv.config({ path: join(process.cwd(), ".env.local") });
dotenv.config({ path: join(process.cwd(), ".env") });

const {
  DB_TYPE = "postgres",
  DATABASE_URL = "",
  POSTGRES_URL = "",
} = process.env;

// Get database configuration based on DB_TYPE
function getDatabaseConfig(): Config {
  const baseConfig = {
    out: "./drizzle",
  };

  switch (DB_TYPE) {
    case "mysql":
      return {
        ...baseConfig,
        schema: "./lib/db/drizzle-schema-mysql.ts",
        dialect: "mysql",
        dbCredentials: {
          url: DATABASE_URL,
        },
      };
    case "sqlite":
      return {
        ...baseConfig,
        schema: "./lib/db/drizzle-schema-sqlite.ts",
        dialect: "sqlite",
        dbCredentials: {
          url: DATABASE_URL.replace("sqlite:", ""),
        },
      };
    default: // postgres
      return {
        ...baseConfig,
        schema: "./lib/db/drizzle-schema-pg.ts",
        dialect: "postgresql",
        dbCredentials: {
          url: DATABASE_URL === "" ? POSTGRES_URL : DATABASE_URL,
        },
      };
  }
}

export default getDatabaseConfig();
