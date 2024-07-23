import mysql, { PoolOptions, RowDataPacket } from 'mysql2';
import { SessionProps, StoreData } from '../../types';

const MYSQL_CONFIG: PoolOptions = {
    host: process.env.MYSQL_HOST,
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    ...(process.env.MYSQL_PORT && { port: Number(process.env.MYSQL_PORT) }),
};

// For use with DB URLs
const dbUrl = process.env.DATABASE_URL;
const pool = dbUrl ? mysql.createPool(dbUrl).promise() : mysql.createPool(MYSQL_CONFIG).promise();

// Use setUser for storing global user data (persists between installs)
export async function setUser({ user }: SessionProps) {
    if (!user) return null;

    const { email, id, username } = user;
    const userData = { email, userId: id, username };

    await pool.query('REPLACE INTO users SET ?', userData);
}

export async function setStore(session: SessionProps) {
    const { access_token: accessToken, context, scope } = session;
    // Only set on app install or update
    if (!accessToken || !scope) return null;

    const storeHash = context?.split('/')[1] || '';
    const storeData: StoreData = { accessToken, scope, storeHash };

    await pool.query('REPLACE INTO stores SET ?', storeData);
}

// Use setStoreUser for storing store specific variables
export async function setStoreUser(session: SessionProps) {
    const { access_token: accessToken, context, owner, sub, user: { id: userId } } = session;
    if (!userId) return null;

    const contextString = context ?? sub;
    const storeHash = contextString?.split('/')[1] || '';
    const sql = 'SELECT * FROM storeUsers WHERE userId = ? AND storeHash = ?';
    const values = [String(userId), storeHash];
    
    const [rows] = await pool.query<RowDataPacket[]>(sql, values);
    const storeUser = rows as RowDataPacket[];

    // Set admin (store owner) if installing/ updating the app
    // https://developer.bigcommerce.com/api-docs/apps/guide/users
    if (accessToken) {
        // Create a new admin user if none exists
        if (storeUser.length === 0) {
            await pool.query('INSERT INTO storeUsers SET ?', { isAdmin: true, storeHash, userId });
        } else if (!storeUser[0]?.isAdmin) {
            await pool.query('UPDATE storeUsers SET isAdmin=1 WHERE userId = ? AND storeHash = ?', values);
        }
    } else {
        // Create a new user if it doesn't exist (non-store owners added here for multi-user apps)
        if (storeUser.length === 0) {
            await pool.query('INSERT INTO storeUsers SET ?', { isAdmin: owner?.id === userId, storeHash, userId });
        }
    }
}

export async function deleteUser({ context, user, sub }: SessionProps) {
    const contextString = context ?? sub;
    const storeHash = contextString?.split('/')[1] || '';
    const values = [String(user?.id), storeHash];
    await pool.query('DELETE FROM storeUsers WHERE userId = ? AND storeHash = ?', values);
}

export async function hasStoreUser(storeHash: string, userId: string) {
    if (!storeHash || !userId) return false;

    const values = [userId, storeHash];
    const [results] = await pool.query<RowDataPacket[]>('SELECT * FROM storeUsers WHERE userId = ? AND storeHash = ? LIMIT 1', values);

    return results.length > 0;
}

export async function getStoreToken(storeHash: string) {
    if (!storeHash) return null;

    const [results] = await pool.query<RowDataPacket[]>('SELECT accessToken FROM stores WHERE storeHash = ?', [storeHash]);

    return results.length ? results[0].accessToken : null;
}

export async function deleteStore({ store_hash: storeHash }: SessionProps) {
    await pool.query('DELETE FROM stores WHERE storeHash = ?', [storeHash]);
}
