export interface AuthClientConfig {
  clientId?: string;
  clientSecret?: string;
  callback?: string;
  jwtKey?: string;
  loginUrl?: string;
}

export interface QueryParams {
  code: string;
  scope: string;
  context: string;
}

export interface AppSessionPayload {
  userId: number;
  userEmail: string;
  channelId: number | null;
  storeHash: string;
  userLocale?: string;
}

export interface SignedPayloadJwt {
  aud: string;
  iss: string;
  iat: number;
  nbf: number;
  exp: number;
  jti: string;
  sub: string;
  user: {
    id: number;
    email: string;
    locale?: string;
  };
  owner: {
    id: number;
    email: string;
  };
  url: string;
  channel_id: number | null;
} 