import { Db } from '../types'

const { DB_TYPE } = process.env;

let db: Db;

switch (DB_TYPE) {
    // case 'd1':
    //     db = require('./dbs/d1');
    //     break;
    case 'hardcoded':
        db = require('./dbs/hardcoded');
        break;
    case 'mysql':
        db = require('./dbs/mysql');
        break;
    default:
        db = require('./dbs/sqlite');
        break;
}

export default db;
