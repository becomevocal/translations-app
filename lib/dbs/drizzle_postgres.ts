import { eq, and } from "drizzle-orm";
import { db } from "./drizzle_db";
import { users, stores, storeUsers } from "./drizzle_schema";
import { UserInfo as User, AuthProps } from "@/types/db";

export async function setUser(user: User) {
    if (!user) return;
  
    const { email, id, username } = user;
  
    await db.insert(users).values({
      userId: id,
      email,
      username
    }).onConflictDoUpdate({
      target: users.userId,
      set: { email, username }
    });
  }
  
  export async function setStore(props: AuthProps) {
    const {
      access_token: accessToken,
      context,
      scope,
      user,
    } = props;
    
    if (!accessToken || !scope) return null;
  
    const storeHash = context?.split("/")[1] || "";
  
    await db.insert(stores).values({
      storeHash,
      accessToken,
      adminId: user.id,
      scope
    }).onConflictDoUpdate({
      target: stores.storeHash,
      set: { accessToken, adminId: user.id, scope }
    });
  }
  
  export async function setStoreUser(session: AuthProps) {
    const {
      context,
      user: { id: userId },
    } = session;
  
    if (!userId) return null;
  
    const storeHash = context.split("/")[1];
  
    await db.insert(storeUsers).values({
      userId,
      storeHash
    }).onConflictDoNothing();
  }
  
  export async function deleteUser(storeHash: string, user: User) {
    await db.delete(storeUsers)
      .where(and(
        eq(storeUsers.userId, user.id),
        eq(storeUsers.storeHash, storeHash)
      ));
  }
  
  export async function hasStoreUser(storeHash: string, userId: number) {
    if (!storeHash || !userId) return false;
  
    const result = await db.select()
      .from(storeUsers)
      .where(and(
        eq(storeUsers.userId, userId),
        eq(storeUsers.storeHash, storeHash)
      ))
      .limit(1);
  
    return result.length > 0;
  }
  
  export async function getStoreToken(storeHash: string): Promise<string | null> {
    if (!storeHash) return null;
  
    const result = await db.select({ accessToken: stores.accessToken })
      .from(stores)
      .where(eq(stores.storeHash, storeHash))
      .limit(1);
  
    return result[0]?.accessToken || null;
  }
  
  export async function deleteStore(storeHash: string) {
    await db.delete(stores)
      .where(eq(stores.storeHash, storeHash));
  }
