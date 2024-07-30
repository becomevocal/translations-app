import { sql } from "@vercel/postgres";
import { UserInfo as User, AuthProps } from "@/types/db";

// Use setUser for storing global user data (persists between installs)
export async function setUser(user: User) {
  if (!user) return Promise.resolve();

  const { email, id, username } = user;

  await sql`
    INSERT INTO users (userId, email, username)
    VALUES (${id}, ${email}, ${username})
    ON CONFLICT (userId) DO UPDATE
    SET email = ${email}, username = ${username};
  `;
}

export async function setStore(props: AuthProps) {
  const {
    access_token: accessToken,
    context,
    scope,
    user,
  } = props;
  // Only set on app install or update
  if (!accessToken || !scope) return null;

  const storeHash = context?.split("/")[1] || "";

  await sql`
    INSERT INTO stores (storeHash, accessToken, adminId, scope)
    VALUES (${storeHash}, ${accessToken}, ${user.id}, ${scope})
    ON CONFLICT (storeHash) DO UPDATE
    SET accessToken = ${accessToken}, adminId = ${user.id}, scope = ${scope};
  `;
}

export async function setStoreUser(session: AuthProps) {
  const {
    context,
    user: { id: userId },
  } = session;

  if (!userId) return null;

  const storeHash = context.split("/")[1];

  await sql`
    INSERT INTO storeUsers (userId, storeHash)
    VALUES (${userId}, ${storeHash})
    ON CONFLICT (userId, storeHash) DO NOTHING;
  `;
}

export async function deleteUser(storeHash: string, user: User) {
  const docId = `${user.id}_${storeHash}`;

  await sql`
    DELETE FROM storeUsers
    WHERE userId = ${user.id} AND storeHash = ${storeHash};
  `;
}

export async function hasStoreUser(storeHash: string, userId: string) {
    if (!storeHash || !userId) return false;

    const { rows } = await sql`
        SELECT *
        FROM storeUsers
        WHERE userId=${userId} AND storeHash = ${storeHash}
        LIMIT 1;
    `;

    return rows.length > 0;
}

export async function getStoreToken(storeHash: string): Promise<string | null> {
  if (!storeHash) return null;

  const { rows } = await sql`
    SELECT accessToken
    FROM stores
    WHERE storeHash = ${storeHash};
  `;

  return rows[0]?.accesstoken || null;
}

export async function deleteStore(storeHash: string) {
  await sql`
    DELETE FROM stores
    WHERE storeHash = ${storeHash};
  `;
}
