# BigCommerce REST Client for Translations App

A TypeScript client for interacting with BigCommerce's REST APIs in the Translations App.

## Features

- Full REST API support
- Rate limiting handling
- Automatic retries
- GraphQL support
- Strongly typed responses
- Debug logging

## Installation

```bash
npm install @bigcommerce/translations-rest-client
```

## Usage

### Basic Setup

```typescript
import { createRestClient } from '@bigcommerce/translations-rest-client';

const client = createRestClient({
  accessToken: 'your-access-token',
  storeHash: 'store-hash',
  maxRetries: 3,           // Optional: Default is 3
  apiUrl: 'https://api.bigcommerce.com' // Optional
});
```

### Making REST Requests

```typescript
// GET request
const channels = await client.get('/v3/channels');

// POST request
const newProduct = await client.post('/v3/catalog/products', {
  name: 'New Product',
  type: 'physical'
});

// PUT request
const updatedProduct = await client.put('/v3/catalog/products/123', {
  name: 'Updated Product'
});

// DELETE request
await client.delete('/v3/catalog/products/123');
```

### Helper Methods

```typescript
// Get available channels
const channels = await client.getAvailableChannels();

// Get channel locales
const locales = await client.getChannelLocales(123);

// Get store information
const storeInfo = await client.getStoreInformation();
```

### GraphQL Support

```typescript
const data = await client.graphqlRequest(
  `query {
    site {
      settings {
        storeName
      }
    }
  }`
);
```

## API Reference

### `createRestClient(config)`

Creates a new instance of the BigCommerce REST Client.

#### Config Options

- `accessToken`: Your BigCommerce access token
- `storeHash`: Your store hash
- `apiUrl`: BigCommerce API URL (optional, defaults to https://api.bigcommerce.com)
- `loginUrl`: BigCommerce login URL (optional, defaults to https://login.bigcommerce.com)
- `maxRetries`: Maximum number of retries for rate-limited requests (optional, defaults to 3)
- `headers`: Additional headers to include in requests (optional)

### REST Methods

#### `get<T>(endpoint: string, query?: object): Promise<T>`

Makes a GET request to the specified endpoint.

#### `post<T>(endpoint: string, data: any): Promise<T>`

Makes a POST request to the specified endpoint with the provided data.

#### `put<T>(endpoint: string, data: any): Promise<T>`

Makes a PUT request to the specified endpoint with the provided data.

#### `delete<T>(endpoint: string): Promise<T>`

Makes a DELETE request to the specified endpoint.

### Helper Methods

#### `getAvailableChannels()`

Gets a list of available channels.

#### `getChannelLocales(channelId: number)`

Gets locales for a specific channel.

#### `getStoreInformation()`

Gets store information.

### GraphQL Method

#### `graphqlRequest<T>(query: string, variables?: Record<string, any>): Promise<T>`

Makes a GraphQL request with the provided query and variables.

## Error Handling

The client includes comprehensive error handling and logging. All methods will throw errors with descriptive messages when:

- Required configuration is missing
- Network requests fail
- Rate limits are exceeded
- Invalid responses are received

## Rate Limiting

The client automatically handles rate limiting by:

1. Detecting rate limit responses (HTTP 429)
2. Reading the retry-after header
3. Waiting the specified time
4. Retrying the request
5. Giving up after maxRetries attempts

## Debugging

The client uses the `debug` package for logging. Enable logs by setting the DEBUG environment variable:

```bash
DEBUG=bigcommerce:rest
```

## Types

The package includes TypeScript definitions for all responses and parameters. 