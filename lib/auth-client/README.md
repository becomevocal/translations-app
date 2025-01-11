# BigCommerce Auth Client for Translations App

A TypeScript client for handling BigCommerce authentication and session management in the Translations App.

## Features

- OAuth handshake with BigCommerce
- JWT session management
- BigCommerce JWT verification
- Strongly typed responses
- Debug logging

## Installation

```bash
npm install @bigcommerce/translations-auth-client
```

## Usage

### Basic Setup

```typescript
import { createAuthClient } from '@bigcommerce/translations-auth-client';

const client = createAuthClient({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  callback: 'your-callback-url',
  jwtKey: 'your-jwt-key'
});
```

### OAuth Handshake

```typescript
const oauthResponse = await client.performOauthHandshake({
  code: 'auth-code',
  scope: 'scope-string',
  context: 'store-context'
});
```

### Session Management

```typescript
// Create a session token
const token = await client.encodeSessionPayload({
  userId: 123,
  userEmail: 'user@example.com',
  storeHash: 'store123'
});

// Decode a session token
const session = await client.decodeSessionPayload(token);

// Verify an app session token
const verified = await client.verifyAppJWT(token);
```

### BigCommerce JWT Verification

```typescript
const payload = await client.verifyBigCommerceJWT(signedJwt);
```

## API Reference

### `createAuthClient(config)`

Creates a new instance of the BigCommerce Auth Client.

#### Config Options

- `clientId`: Your BigCommerce app's client ID
- `clientSecret`: Your BigCommerce app's client secret
- `callback`: OAuth callback URL
- `jwtKey`: Key for signing/verifying app session JWTs
- `loginUrl`: BigCommerce login URL (optional, defaults to https://login.bigcommerce.com)

### `performOauthHandshake(query)`

Performs the OAuth handshake with BigCommerce.

#### Parameters

- `query.code`: The authorization code from BigCommerce
- `query.scope`: The requested scope string
- `query.context`: The store context

### `encodeSessionPayload(payload, expiration?)`

Creates a JWT for app session management.

#### Parameters

- `payload`: The session data to encode
- `expiration`: Token expiration time (optional, defaults to "1h")

### `decodeSessionPayload(encodedContext)`

Decodes a session JWT.

#### Parameters

- `encodedContext`: The JWT token to decode

### `verifyAppJWT(token)`

Verifies a JWT created by this app.

#### Parameters

- `token`: The app session JWT to verify

### `verifyBigCommerceJWT(token)`

Verifies a JWT created by BigCommerce.

#### Parameters

- `token`: The BigCommerce signed JWT to verify

## Error Handling

The client includes comprehensive error handling and logging. All methods will throw errors with descriptive messages when:

- Required configuration is missing
- JWT operations fail
- OAuth handshake fails
- Network requests fail

## Debugging

The client uses the `debug` package for logging. Enable logs by setting the DEBUG environment variable:

```bash
DEBUG=bigcommerce:auth
```

## Types

The package includes TypeScript definitions for all responses and parameters. 