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
  - Query complexity tracking
- 📝 Detailed Logging
  - Debug-level request/response logging
  - Rate limit tracking
  - Complexity monitoring
  - Error tracing

## Installation

```bash
npm install bigcommerce-translations-admin-graphql-client
```

## Usage

### Basic Setup

```typescript
import { createGraphQLClient } from 'bigcommerce-translations-admin-graphql-client';

const client = createGraphQLClient('your-access-token', 'store-hash');
```

### Advanced Configuration

```typescript
import { GraphQLClient } from 'bigcommerce-translations-admin-graphql-client';

const client = new GraphQLClient({
  accessToken: 'your-access-token',
  storeHash: 'store-hash',
  maxRetries: 3,           // Optional: Default is 3
  failOnLimitReached: false, // Optional: Default is false
  complexity: {
    onComplexityUpdate: (complexity) => {
      // Monitor query complexity
      console.log(`Query complexity: ${complexity}/10000`);
    }
  }
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
// Basic product information
const result = await client.updateProductLocaleData({
  locale: 'es',
  channelId: 123,
  productId: 456,
  productData: {
    name: 'Producto Nuevo',
    description: 'Descripción del producto',
    pageTitle: 'Título de la página',
    metaDescription: 'Meta descripción',
    warranty: 'Garantía',
    availabilityDescription: 'Disponibilidad',
    searchKeywords: 'palabras clave',
    preOrderMessage: 'Mensaje de pre-orden'
  }
});

// With options and modifiers
const result = await client.updateProductLocaleData({
  locale: 'es',
  channelId: 123,
  productId: 456,
  productData: {
    name: 'Producto Nuevo',
    // Options
    options: {
      'option-id-1': {
        displayName: 'Color',
        values: [
          { valueId: 'value-1', label: 'Rojo' },
          { valueId: 'value-2', label: 'Azul' }
        ],
        removeValues: ['value-3'] // Remove this value's translation
      }
    },
    // Modifiers
    modifiers: {
      'modifier-id-1': {
        displayName: 'Texto personalizado',
        defaultValue: 'Escriba aquí'
      },
      'modifier-id-2': {
        displayName: 'Opciones',
        values: [
          { valueId: 'value-1', label: 'Opción 1' },
          { valueId: 'value-2', label: 'Opción 2' }
        ]
      }
    },
    // Custom fields
    customFields: {
      'custom-field-1': {
        customFieldId: 'custom-field-1',
        name: 'Campo personalizado',
        value: 'Valor personalizado'
      }
    },
    // Remove translations
    remove: {
      options: ['option-id-2'],        // Remove all translations for this option
      modifiers: ['modifier-id-3'],    // Remove all translations for this modifier
      customFields: ['custom-field-2'] // Remove all translations for this custom field
    }
  }
});
```

Any fields that are undefined will be ignored. Empty strings will remove the translation override.

For advanced usage with more complex scenarios, you can still use the legacy format:

```typescript
const result = await client.updateProductLocaleData({
  input: {
    productId: 'bc/store/product/123',
    localeContext: {
      channelId: 'bc/store/channel/456',
      locale: 'es'
    },
    data: {
      name: 'Producto',
      description: 'Descripción'
    }
  },
  // ... other mutation inputs
});
```

#### `getAllProducts(limit: number, cursor?: string)`
Fetches all products with pagination support.

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

#### App Extension Upsert

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

## Query Complexity

As of January 2025, BigCommerce's GraphQL API has a complexity limit of 10,000 per request. The client provides complexity monitoring to help you stay within this limit:

```typescript
const client = new GraphQLClient({
  // ... other config
  complexity: {
    onComplexityUpdate: (complexity) => {
      // Monitor and log query complexity
      console.log(`Query complexity: ${complexity}/10000`);
      
      // Example: Alert on high complexity queries
      if (complexity > 8000) {
        console.warn('High complexity query detected');
      }
    }
  }
});
```

Tips for managing complexity:
- Limit collections to smaller page sizes (e.g., `first:10` instead of `first:50`)
- Reduce nested collection depths
- Request only needed fields
- Consider splitting large queries into smaller ones

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