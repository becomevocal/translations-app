import { Db } from "../types";
import * as drizzleDb from "./dbs/drizzle_postgres";

// Standardize on Drizzle ORM which supports multiple databases
// Configure database type and connection in drizzle.config.ts
export default drizzleDb;
