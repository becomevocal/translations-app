import { sql } from "@vercel/postgres";
import dotenv from "dotenv";
dotenv.config({ path: '.env.local' });

// Users table
sql`
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL,
        email TEXT NOT NULL,
        username TEXT,
        UNIQUE (userId)
    );
`;

// Stores table
sql`
    CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        storeHash VARCHAR(10) NOT NULL,
        accessToken TEXT,
        scope TEXT,
        adminId INTEGER NOT NULL,
        UNIQUE (storeHash)
    );
`;

// Store Users table
sql`
    CREATE TABLE IF NOT EXISTS storeUsers (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL,
        storeHash VARCHAR(10) NOT NULL,
        UNIQUE (userId, storeHash)
    );
`;