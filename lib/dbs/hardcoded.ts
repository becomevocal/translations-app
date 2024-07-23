import { SessionProps, StoreData } from '../../types';

// Use setUser for storing global user data (persists between installs)
export async function setUser({ user }: SessionProps) {
    return user
}

export async function setStore(session: SessionProps) {
    return session
}

// Use setStoreUser for storing store specific variables
export async function setStoreUser(session: SessionProps) {
    return session
}

export async function deleteUser({ context, user, sub }: SessionProps) {
    return true
}

export async function hasStoreUser(storeHash: string, userId: string) {
    return true
}

export async function getStoreToken(storeHash: string) {
    return process.env.HARDCODED_ACCESS_TOKEN
}

export async function deleteStore({ store_hash: storeHash }: SessionProps) {
    return true
}
