import { z } from "zod";
import { SignJWT, jwtVerify } from "jose";
import { AuthSession, QueryParams } from "../types";
import { signedPayloadJwtSchema } from "./schemas";

interface AuthClientConfig {
  clientId?: string;
  clientSecret?: string;
  callback?: string;
  jwtKey?: string;
  loginUrl?: string;
}

export class BigCommerceAuthClient {
  private config: AuthClientConfig;
  private loginUrl: string;

  constructor(config: AuthClientConfig) {
    this.config = config;
    this.loginUrl = config.loginUrl || "https://login.bigcommerce.com";
  }

  static createClient(config: AuthClientConfig): BigCommerceAuthClient {
    return new BigCommerceAuthClient(config);
  }

  // JWT Methods
  /**
   * Creates a JWT for the app's session management.
   * Used after successful OAuth to create a session token containing user and store info.
   * Called in auth/route.ts and load/route.ts to create the client-side session.
   * 
   * @param payload - The session data to encode (user info, store info)
   * @param expiration - Token expiration time (default: 1 hour)
   */
  async encodeSessionPayload(
    payload: any,
    expiration: number | string | Date = "1h"
  ) {
    if (!this.config.jwtKey) {
      throw new Error("JWT Key is required for encoding session payload");
    }

    return await new SignJWT({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      nbf: Math.floor(Date.now() / 1000),
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expiration)
      .sign(new TextEncoder().encode(this.config.jwtKey));
  }

  /**
   * Decodes a session JWT without validation.
   * Used to read session data when validation isn't required.
   * Called in i18n/request.ts to get user locale preferences.
   * 
   * @param encodedContext - The JWT token to decode
   */
  async decodeSessionPayload(encodedContext: string) {
    if (!this.config.jwtKey) {
      throw new Error("JWT Key is required for decoding session payload");
    }

    const { payload } = await jwtVerify(
      encodedContext,
      new TextEncoder().encode(this.config.jwtKey)
    );

    return payload;
  }

  /**
   * Verifies a JWT created by this app (via encodeSessionPayload).
   * Used to validate app session tokens.
   * Called in authorize.ts to verify the current session.
   * 
   * @param token - The app session JWT to verify
   */
  async verifyAppJWT(token: string) {
    if (!this.config.jwtKey) {
      throw new Error("JWT Key is required for App JWT verification");
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(this.config.jwtKey)
    );

    return payload;
  }

  /**
   * Verifies a JWT created by BigCommerce.
   * Used to validate signed_payload_jwt from BigCommerce callbacks.
   * Called in uninstall/route.ts and remove-user/route.ts for app lifecycle events.
   * Returns a strongly typed payload matching BigCommerce's JWT structure.
   * 
   * @param token - The BigCommerce signed JWT to verify
   */
  async verifyBigCommerceJWT(token: string): Promise<z.infer<typeof signedPayloadJwtSchema>> {
    if (!this.config.clientSecret) {
      throw new Error("Client Secret is required for BigCommerce JWT verification");
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(this.config.clientSecret)
    );

    return signedPayloadJwtSchema.parse(payload);
  }

  /**
   * Performs the OAuth handshake with BigCommerce.
   * Used during app installation to exchange the auth code for an access token.
   * Called in auth/route.ts when BigCommerce redirects back to the app.
   * 
   * @param query - The OAuth query parameters from BigCommerce
   */
  async performOauthHandshake(query: QueryParams) {
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error("Client ID and Client Secret are required to perform OAuth handshake");
    }

    const authUrl = `${this.loginUrl}/oauth2/token`;
    const body = {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code: query.code,
      scope: query.scope,
      grant_type: "authorization_code",
      context: query.context,
      redirect_uri: this.config.callback,
    };

    const response = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error during OAuth handshake! status: ${response.status}`);
    }

    return response.json();
  }
} 