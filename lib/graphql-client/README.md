# BigCommerce Translations GraphQL Client

A TypeScript GraphQL client for BigCommerce's Admin API, specifically designed for managing translations and localized content.

## Features

- 🌐 Product Localization
  - Fetch and update product translations
  - Support for all product fields (basic info, SEO, modifiers, options, etc.)
  - Batch update capabilities
- 🧩 App Extensions Management
  - CRUD operations for app extensions
  - Support for all extension contexts (PANEL, BUTTON, FULL_PAGE)
  - Automatic extension deduplication
- 🔄 Smart Request Handling
  - Automatic rate limiting management
  - Configurable retry logic
  - Comprehensive error handling
- 📝 Detailed Logging
  - Debug-level request/response logging
  - Rate limit tracking
  - Error tracing

## Installation

```bash
npm install @bigcommerce/translations-graphql-client
```

## Usage

### Basic Setup

```typescript
import { createGraphQLClient } from '@bigcommerce/translations-graphql-client';

const client = createGraphQLClient('your-access-token', 'store-hash');
```

### Advanced Configuration

```typescript
import { GraphQLClient } from '@bigcommerce/translations-graphql-client';

const client = new GraphQLClient({
  accessToken: 'your-access-token',
  storeHash: 'store-hash',
  maxRetries: 3,           // Optional: Default is 3
  failOnLimitReached: false // Optional: Default is false
});
```

## API Reference

### Product Localization

#### Fetching Product Translations

```typescript
const productData = await client.getProductLocaleData({
  pid: 'product-id',
  channelId: 'channel-id',
  availableLocales: [
    { code: 'en' },
    { code: 'es' },
    { code: 'fr' }
  ],
  defaultLocale: 'en'
});
```

#### Updating Product Translations

```typescript
const result = await client.updateProductLocaleData(
  {
    pid: 'product-id',
    channelId: 'channel-id',
    locale: 'es'
  },
  {
    input: {
      productId: 'product-id',
      channelId: 'channel-id',
      locale: 'es',
      data: {
        name: 'Nombre del producto',
        description: 'Descripción del producto'
      }
    },
    seoInput: {
      productId: 'product-id',
      channelId: 'channel-id',
      locale: 'es',
      data: {
        pageTitle: 'Título de la página',
        metaDescription: 'Meta descripción'
      }
    }
    // Additional inputs for modifiers, options, etc.
  }
);
```

### App Extensions

#### Listing Extensions

```typescript
const extensions = await client.getAppExtensions();
```

#### Creating an Extension

```typescript
const newExtensionId = await client.createAppExtension({
  context: 'PANEL',
  model: 'PRODUCTS',
  url: 'https://your-app.com/panel',
  label: {
    defaultValue: 'My Extension',
    locales: [
      { value: 'Mi Extensión', localeCode: 'es' },
      { value: 'Mon Extension', localeCode: 'fr' }
    ]
  }
});
```

#### Updating an Extension

```typescript
const updatedExtension = await client.updateAppExtension({
  id: 'extension-id',
  input: {
    label: {
      defaultValue: 'Updated Extension Name',
      locales: [
        { value: 'Nombre Actualizado', localeCode: 'es' }
      ]
    }
  }
});
```

#### Deleting an Extension

```typescript
const deletedId = await client.deleteAppExtension('extension-id');
```

#### Smart Extension Management

```typescript
// Creates if doesn't exist, updates if exists, removes duplicates
const extensionId = await client.upsertAppExtension({
  context: 'PANEL',
  model: 'PRODUCTS',
  url: 'https://your-app.com/panel',
  label: {
    defaultValue: 'My Extension'
  }
});
```

## Error Handling

The client includes comprehensive error handling:

```typescript
try {
  const result = await client.getProductLocaleData({...});
} catch (error) {
  if ('retryAfter' in error) {
    // Rate limit error
    console.log(`Rate limit reached. Retry after ${error.retryAfter} seconds`);
  } else if ('errors' in error) {
    // GraphQL error
    console.log('GraphQL errors:', error.errors);
  } else {
    // Other error
    console.error('Request failed:', error);
  }
}
```

## Debugging

The client uses the `debug` package for detailed logging. Enable it by setting the DEBUG environment variable:

```bash
# Enable all logs
DEBUG=bigcommerce:graphql* npm start

# Enable specific logs
DEBUG=bigcommerce:graphql:request npm start
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint
```

## Type Safety

The client is written in TypeScript and provides comprehensive type definitions for all operations. This includes:

- Request/response types for all operations
- Enum types for extension contexts and models
- Utility types for common patterns

## Contributing

Contributions are welcome! Please read our contributing guidelines for details.

## License

MIT 