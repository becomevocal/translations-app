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
  scope: string;
  user: UserInfo;
  account_uuid: string;
}
