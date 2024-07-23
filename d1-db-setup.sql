-- migration.sql

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    email TEXT NOT NULL,
    username TEXT,
    UNIQUE (userId)
);

CREATE TABLE stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    storeHash TEXT NOT NULL,
    accessToken TEXT,
    scope TEXT,
    UNIQUE (storeHash)
);

CREATE TABLE storeUsers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    storeHash TEXT,
    isAdmin BOOLEAN,
    UNIQUE (userId, storeHash)
);