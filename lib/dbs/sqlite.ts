import Database from 'better-sqlite3';
import { SessionProps, StoreData } from '../../types';

const db = new Database(process.env.SQLITE_DATABASE || ':memory:');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        email TEXT,
        userId INTEGER PRIMARY KEY,
        username TEXT
    );
    CREATE TABLE IF NOT EXISTS stores (
        accessToken TEXT,
        scope TEXT,
        storeHash TEXT PRIMARY KEY
    );
    CREATE TABLE IF NOT EXISTS storeUsers (
        isAdmin INTEGER,
        storeHash TEXT,
        userId INTEGER,
        PRIMARY KEY (userId, storeHash)
    );
`);

export function setUser({ user }: SessionProps) {
    if (!user) return null;

    const { email, id, username } = user;
    const stmt = db.prepare('INSERT OR REPLACE INTO users (email, userId, username) VALUES (?, ?, ?)');
    stmt.run(email, id, username);
}

export function setStore(session: SessionProps) {
    const { access_token: accessToken, context, scope } = session;
    if (!accessToken || !scope) return null;

    const storeHash = context?.split('/')[1] || '';
    const stmt = db.prepare('INSERT OR REPLACE INTO stores (accessToken, scope, storeHash) VALUES (?, ?, ?)');
    stmt.run(accessToken, scope, storeHash);
}

export function setStoreUser(session: SessionProps) {
    const { access_token: accessToken, context, owner, sub, user: { id: userId } } = session;
    if (!userId) return null;

    const contextString = context ?? sub;
    const storeHash = contextString?.split('/')[1] || '';
    const stmtSelect = db.prepare('SELECT * FROM storeUsers WHERE userId = ? AND storeHash = ?');
    const storeUser = stmtSelect.get(String(userId), storeHash) as any;

    if (accessToken) {
        if (!storeUser) {
            const stmtInsert = db.prepare('INSERT INTO storeUsers (isAdmin, storeHash, userId) VALUES (?, ?, ?)');
            stmtInsert.run(1, storeHash, userId);
        } else if (!storeUser.isAdmin) {
            const stmtUpdate = db.prepare('UPDATE storeUsers SET isAdmin = 1 WHERE userId = ? AND storeHash = ?');
            stmtUpdate.run(String(userId), storeHash);
        }
    } else {
        if (!storeUser) {
            const stmtInsert = db.prepare('INSERT INTO storeUsers (isAdmin, storeHash, userId) VALUES (?, ?, ?)');
            stmtInsert.run(owner?.id === userId ? 1 : 0, storeHash, userId);
        }
    }
}

export function deleteUser({ context, user, sub }: SessionProps) {
    const contextString = context ?? sub;
    const storeHash = contextString?.split('/')[1] || '';
    const stmt = db.prepare('DELETE FROM storeUsers WHERE userId = ? AND storeHash = ?');
    stmt.run(String(user?.id), storeHash);
}

export function hasStoreUser(storeHash: string, userId: string) {
    if (!storeHash || !userId) return false;

    const stmt = db.prepare('SELECT * FROM storeUsers WHERE userId = ? AND storeHash = ? LIMIT 1');
    const storeUser = stmt.get(userId, storeHash);

    return !!storeUser;
}

export function getStoreToken(storeHash: string) {
    if (!storeHash) return null;

    const stmt = db.prepare('SELECT accessToken FROM stores WHERE storeHash = ?');
    const store = stmt.get(storeHash) as any;

    return store ? store.accessToken : null;
}

export function deleteStore({ store_hash: storeHash }: SessionProps) {
    const stmt = db.prepare('DELETE FROM stores WHERE storeHash = ?');
    stmt.run(storeHash);
}
