import { Db } from "../types";

const { DB_TYPE } = process.env;

let db: Db;

switch (DB_TYPE) {
  case "hardcoded":
    db = require("./dbs/hardcoded");
    break;
  case "postgres":
    db = require("./dbs/postgres");
    break;
  case "drizzle_postgres":
    db = require("./dbs/drizzle_postgres");
    break;
  case "mysql":
    db = require("./dbs/mysql");
    break;
  default:
    db = require("./dbs/sqlite");
    break;
}

export default db;
