import { SessionProps } from "./index";

export interface StoreData {
  accessToken?: string;
  scope?: string;
  storeHash: string;
}

export interface UserData {
  email: string;
  username?: string;
}

export interface UserInfo {
  email: string;
  id: number;
  username?: string;
}

export interface AuthProps {
  access_token?: string;
  context: string;
  scope?: string;
  user: UserInfo;
}

export interface Db {
  hasStoreUser(storeHash: string, userId: number): Promise<boolean> | boolean;
  setUser(user: UserInfo): Promise<void>;
  setStore(session: SessionProps): Promise<void>;
  setStoreUser(session: SessionProps): Promise<void>;
  getStoreToken(storeHash: string | null): Promise<string | undefined>;
  deleteStore(storeHash: string): Promise<void>;
  deleteUser(storeHash: string, user: UserInfo): Promise<void>;
}
