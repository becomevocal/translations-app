export interface User {
    email: string;
    id: number;
    username?: string;
    locale?: string;
}

export interface SessionProps {
    access_token?: string;
    context: string;
    owner?: User;
    scope?: string;
    store_hash?: string;
    sub?: string;
    timestamp?: number;
    user: User;
    url?: string
}

export interface SessionContextProps {
    accessToken: string;
    storeHash: string;
    user: User;
}

export interface QueryParams {
    [key: string]: string | string[] | undefined;
}

export interface ApiConfig {
    apiUrl?: string;
    loginUrl?: string;
}

export interface CookieData {
    storeHash: string;
}
