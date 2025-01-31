import { NextRequest } from 'next/server';
import { dbClient as db } from '@/lib/db';
import { put } from '@vercel/blob';
import { createGraphQLClient } from '@bigcommerce/translations-graphql-client';
import type { GraphQLClient } from '@bigcommerce/translations-graphql-client';
import { formatChannelId, formatProductId } from '@bigcommerce/translations-graphql-client/src/utils';
import type { TranslationJob } from '@/lib/db/clients/types';
import { createRestClient, BigCommerceRestClient } from '@bigcommerce/translations-rest-client';
import { getSessionFromContext } from '@/lib/auth';
import crypto from 'crypto';
import Papa, { ParseResult, ParseError, UnparseConfig } from 'papaparse';
import { fallbackLocale } from '@/lib/constants';

// CSV record type
interface TranslationRecord {
  productId: number;
  [key: string]: string | number; // Allow dynamic locale-based column names
}


// Helper function to get locale-specific field
function getLocaleField(record: TranslationRecord, fieldPrefix: string, locale: string): string {
  const key = `${fieldPrefix}_${locale}`;
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

// Helper function to prepare product data for update
function prepareProductData(record: TranslationRecord, locale: string, channelId: number) {
  const getValue = (value: string, shouldParseJson: boolean = false) => {
    if (!shouldParseJson) return value;
    // Only try to parse JSON for fields that should be JSON
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  };

  // Helper to transform options data structure
  const transformOptionsData = (options: any[]) => {
    if (!Array.isArray(options)) return [];
    
    return options.map(option => ({
      optionId: option.id, // Transform id to optionId
      data: {
        dropdown: {
          displayName: option.displayName,
          values: option.values?.map((value: any) => ({
            valueId: value.id, // Transform id to valueId
            label: value.label
          })) || []
        }
      }
    }));
  };

  // Helper to transform modifiers data structure
  const transformModifiersData = (modifiers: any[]) => {
    if (!Array.isArray(modifiers)) return [];
    
    return modifiers.map(modifier => {
      const baseData = {
        modifierId: modifier.id, // Transform id to modifierId
        data: {
          displayName: modifier.displayName
        }
      };

      // Handle different modifier types based on the type field
      const type = modifier.type as 'CheckboxProductModifier' | 'TextFieldProductModifier' | 'MultilineTextFieldProductModifier' | 'NumbersOnlyTextFieldProductModifier' | 'DropdownProductModifier' | 'RadioButtonsProductModifier' | 'RectangleListProductModifier' | 'SwatchProductModifier' | 'PickListProductModifier';

      switch (type) {
        case 'CheckboxProductModifier':
          return {
            ...baseData,
            data: {
              ...baseData.data,
              checkbox: {
                fieldValue: modifier.fieldValue
              }
            }
          };
        case 'TextFieldProductModifier':
        case 'MultilineTextFieldProductModifier':
          return {
            ...baseData,
            data: {
              ...baseData.data,
              [type === 'TextFieldProductModifier' ? 'textField' : 'multiLineTextField']: {
                defaultValue: modifier.defaultValue
              }
            }
          };
        case 'NumbersOnlyTextFieldProductModifier':
          return {
            ...baseData,
            data: {
              ...baseData.data,
              numberField: {
                defaultValue: modifier.defaultValue
              }
            }
          };
        case 'DropdownProductModifier':
        case 'RadioButtonsProductModifier':
        case 'RectangleListProductModifier':
        case 'SwatchProductModifier':
        case 'PickListProductModifier':
          const typeKey = {
            'DropdownProductModifier': 'dropdown',
            'RadioButtonsProductModifier': 'radioButtons',
            'RectangleListProductModifier': 'rectangleList',
            'SwatchProductModifier': 'swatch',
            'PickListProductModifier': 'pickList'
          }[type] as 'dropdown' | 'radioButtons' | 'rectangleList' | 'swatch' | 'pickList';
          
          return {
            ...baseData,
            data: {
              ...baseData.data,
              [typeKey]: {
                values: modifier.values?.map((value: any) => ({
                  valueId: value.id, // Transform id to valueId
                  label: value.label
                })) || []
              }
            }
          };
        default:
          return baseData;
      }
    });
  };

  // Helper to transform custom fields data structure
  const transformCustomFieldsData = (customFields: any[], channelId: string, locale: string) => {
    if (!Array.isArray(customFields)) return [];
    
    const formattedChannelId = formatChannelId(parseInt(channelId, 10));
    
    return customFields.map(field => ({
      customFieldId: field.id,
      overrides: [
        {
          channelLocaleOverrides: {
            context: {
              channelId: formattedChannelId,
              locale: locale,
            },
            data: {
              name: field.name || null,
              value: field.value || null,
            },
          },
        },
      ],
    }));
  };

  return {
    // Basic Information - Don't parse as JSON
    name: getValue(getLocaleField(record, 'name', locale)),
    description: getValue(getLocaleField(record, 'description', locale)),
    
    // SEO Information - Don't parse as JSON
    pageTitle: getValue(getLocaleField(record, 'pageTitle', locale)),
    metaDescription: getValue(getLocaleField(record, 'metaDescription', locale)),
    
    // Storefront Details - Don't parse as JSON
    warranty: getValue(getLocaleField(record, 'warranty', locale)),
    availabilityDescription: getValue(getLocaleField(record, 'availabilityDescription', locale)),
    searchKeywords: getValue(getLocaleField(record, 'searchKeywords', locale)),
    
    // Pre-order Settings - Don't parse as JSON
    preOrderMessage: getValue(getLocaleField(record, 'preOrderMessage', locale)),
    
    // Complex Data - Parse as JSON and transform
    options: transformOptionsData(getValue(getLocaleField(record, 'options', locale), true)),
    modifiers: transformModifiersData(getValue(getLocaleField(record, 'modifiers', locale), true)),
    customFields: transformCustomFieldsData(
      getValue(getLocaleField(record, 'customFields', locale), true),
      channelId.toString(),
      locale
    )
  };
}

// Helper function to parse CSV using PapaParse
async function parseCSV(text: string): Promise<TranslationRecord[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<TranslationRecord>(text, {
      header: true,
      skipEmptyLines: 'greedy',
      delimiter: ',',
      quoteChar: '"',
      escapeChar: '"',
      transformHeader: (header) => header.trim(),
      transform: (value: string, field: string) => {
        // Transform productId to number
        if (field === 'productId') {
          const parsed = parseInt(value.trim(), 10);
          if (isNaN(parsed)) {
            throw new Error(`Invalid product ID in CSV: ${value}`);
          }
          return parsed;
        }
        return value.trim();
      },
      complete: (results: ParseResult<TranslationRecord>) => {
        if (results.errors.length > 0) {
          console.error('CSV parsing errors:', results.errors);
          reject(new Error('Failed to parse CSV: ' + results.errors.map(e => e.message).join(', ')));
          return;
        }
        if (!results.data.length) {
          reject(new Error('CSV file is empty'));
          return;
        }
        resolve(results.data);
      },
      error: (error: Error) => {
        console.error('CSV parsing error:', error);
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  });
}

// Helper function to stringify CSV using PapaParse
function stringifyCSV(records: TranslationRecord[], defaultLocale: string, targetLocale: string): string {
  const headers = [
    'productId',
    // Basic Information
    `name_${defaultLocale}`,
    `name_${targetLocale}`,
    `description_${defaultLocale}`,
    `description_${targetLocale}`,
    // SEO Information
    `pageTitle_${defaultLocale}`,
    `pageTitle_${targetLocale}`,
    `metaDescription_${defaultLocale}`,
    `metaDescription_${targetLocale}`,
    // Storefront Details
    `warranty_${defaultLocale}`,
    `warranty_${targetLocale}`,
    `availabilityDescription_${defaultLocale}`,
    `availabilityDescription_${targetLocale}`,
    `searchKeywords_${defaultLocale}`,
    `searchKeywords_${targetLocale}`,
    // Pre-order Settings
    `preOrderMessage_${defaultLocale}`,
    `preOrderMessage_${targetLocale}`,
    // Options
    `options_${defaultLocale}`,
    `options_${targetLocale}`,
    // Modifiers
    `modifiers_${defaultLocale}`,
    `modifiers_${targetLocale}`,
    // Custom Fields
    `customFields_${defaultLocale}`,
    `customFields_${targetLocale}`
  ];

  const config: UnparseConfig = {
    quotes: true,
    quoteChar: '"',
    escapeChar: '"',
    delimiter: ',',
    header: true,
    newline: '\n',
    skipEmptyLines: true
  };

  try {
    const csvData = records.map(record => {
      const row: Record<string, any> = {};
      headers.forEach(header => {
        // Handle null/undefined values
        const value = record[header];
        row[header] = value === null || value === undefined ? '' : value;
      });
      return row;
    });

    return Papa.unparse({
      fields: headers,
      data: csvData
    }, config);
  } catch (error) {
    console.error('Error generating CSV:', error);
    throw new Error('Failed to generate CSV file');
  }
}

// Configuration from environment variables with defaults
const CONFIG = {
  // Rate limiting settings
  CONCURRENT_REQUESTS: Number(process.env.TRANSLATION_CONCURRENT_REQUESTS) || 3,
  REQUESTS_PER_SECOND: Number(process.env.TRANSLATION_REQUESTS_PER_SECOND) || 5,
  
  // Pagination settings
  PRODUCTS_PER_PAGE: Number(process.env.TRANSLATION_PRODUCTS_PER_PAGE) || 100,
  
  // Batch processing settings
  IMPORT_BATCH_SIZE: Number(process.env.TRANSLATION_IMPORT_BATCH_SIZE) || 3,
  EXPORT_BATCH_SIZE: Number(process.env.TRANSLATION_EXPORT_BATCH_SIZE) || 3,
  
  // Delay settings (in milliseconds)
  MIN_DELAY_BETWEEN_PAGES: Number(process.env.TRANSLATION_PAGE_DELAY_MS) || 200,
};

// Validate configuration
Object.entries(CONFIG).forEach(([key, value]) => {
  if (typeof value !== 'number' || value <= 0) {
    throw new Error(`Invalid configuration for ${key}: ${value}. Must be a positive number.`);
  }
});

// Helper function to process items in batches with rate limiting
async function processBatch<T, R>(
  items: T[],
  processItem: (item: T) => Promise<R>,
  { batchSize = CONFIG.CONCURRENT_REQUESTS } = {}
): Promise<R[]> {
  const results: R[] = [];
  const errors: Error[] = [];

  // Process items in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchStartTime = Date.now();

    // Process batch concurrently
    const batchResults = await Promise.allSettled(
      batch.map(item => processItem(item))
    );

    // Handle results and errors
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        errors.push(result.reason);
        console.error(`Error processing item ${i + index}:`, result.reason);
      }
    });

    // Rate limiting delay
    const batchDuration = Date.now() - batchStartTime;
    const minBatchTime = (batch.length / CONFIG.REQUESTS_PER_SECOND) * 1000;
    if (batchDuration < minBatchTime) {
      await new Promise(resolve => setTimeout(resolve, minBatchTime - batchDuration));
    }
  }

  if (errors.length > 0) {
    throw new AggregateError(errors, `${errors.length} items failed to process`);
  }

  return results;
}

async function verifyAuthorization(request: NextRequest) {
  // Check for Authorization header (secret)
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const [type, token] = authHeader.split(' ');
    if (type === 'Bearer' && token === process.env.CRON_SECRET) {
      return { type: 'cron' as const };
    }
  }

  // Check for context parameter
  const context = request.nextUrl.searchParams.get('context');
  if (context) {
    try {
      const session = await getSessionFromContext(context);
      return { type: 'user' as const, storeHash: session.storeHash };
    } catch (error) {
      console.error('Invalid context:', error);
    }
  }

  throw new Error('Unauthorized: Valid authorization header or context required');
}

// Interface for the mutation variables
interface ProductLocaleUpdateVariables {
  channelId: string;
  locale: string;
  input: {
    productId: string;
    localeContext: {
      channelId: string;
      locale: string;
    };
    data: {
      name: string;
      description: string;
    };
  };
  seoInput: {
    productId: string;
    localeContext: {
      channelId: string;
      locale: string;
    };
    data: {
      pageTitle: string;
      metaDescription: string;
    };
  };
  preOrderInput: {
    productId: string;
    localeContext: {
      channelId: string;
      locale: string;
    };
    data: {
      message: string;
    };
  };
  storefrontInput: {
    productId: string;
    localeContext: {
      channelId: string;
      locale: string;
    };
    data: {
      warranty: string;
      availabilityDescription: string;
      searchKeywords: string;
    };
  };
  optionsInput?: {
    productId: string;
    localeContext: {
      channelId: string;
      locale: string;
    };
    data: {
      options: any[];
    };
  };
  modifiersInput?: {
    productId: string;
    localeContext: {
      channelId: string;
      locale: string;
    };
    data: {
      modifiers: any[];
    };
  };
  customFieldsInput?: {
    productId: string;
    data: any[];
  };
  removedBasicInfoInput?: {
    productId: string;
    localeContext: {
      channelId: string;
      locale: string;
    };
    overridesToRemove: string[];
  };
  removedSeoInput?: {
    productId: string;
    localeContext: {
      channelId: string;
      locale: string;
    };
    overridesToRemove: string[];
  };
  removedStorefrontDetailsInput?: {
    productId: string;
    localeContext: {
      channelId: string;
      locale: string;
    };
    overridesToRemove: string[];
  };
  removedPreOrderInput?: {
    productId: string;
    localeContext: {
      channelId: string;
      locale: string;
    };
    overridesToRemove: string[];
  };
}

// Process an import job
async function processImportJob(job: TranslationJob, graphqlClient: GraphQLClient) {
  console.log(`[Import] Starting import job ${job.id} for channel ${job.channelId} and locale ${job.locale}`);
  
  try {
    if (!job.fileUrl) {
      throw new Error('No file URL provided for import job');
    }

    // Get store token and create REST client
    const accessToken = await db.getStoreToken(job.storeHash);
    if (!accessToken) {
      throw new Error('Store token not found');
    }
    const restClient = createRestClient({accessToken, storeHash: job.storeHash});

    // Fetch channel locales to get default locale
    console.log(`[Import] Fetching channel locales for channel ${job.channelId}`);
    const { data: localesData } = await restClient.getChannelLocales(job.channelId);
    const defaultLocale = localesData.find(locale => locale.is_default)?.code || fallbackLocale.code;
    console.log(`[Import] Using default locale: ${defaultLocale}`);

    // Fetch CSV file
    console.log(`[Import] Fetching CSV from ${job.fileUrl}`);
    const response = await fetch(job.fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV file: ${response.statusText}`);
    }

    const csvContent = await response.text();
    console.log('[Import] Parsing CSV content');
    const records = await parseCSV(csvContent);
    console.log(`[Import] Found ${records.length} records to import`);

    // Process records in batches with rate limiting
    console.log('[Import] Starting batch processing of records');
    await processBatch(records, async (record: TranslationRecord) => {
      try {
        console.log(`[Import] Updating product ${record.productId}`);
        
        const productData = prepareProductData(record, job.locale, job.channelId);
        const defaultData = prepareProductData(record, defaultLocale, job.channelId);

        // Format IDs for GraphQL
        const formattedChannelId = formatChannelId(job.channelId);
        const formattedProductId = formatProductId(record.productId);

        // Prepare input variables for the mutation
        const variables: ProductLocaleUpdateVariables = {
          channelId: formattedChannelId,
          locale: job.locale,
          
          // Basic Information
          input: {
            productId: formattedProductId,
            localeContext: {
              channelId: formattedChannelId,
              locale: job.locale
            },
            data: {
              name: productData.name,
              description: productData.description
            }
          },
          
          // SEO Information
          seoInput: {
            productId: formattedProductId,
            localeContext: {
              channelId: formattedChannelId,
              locale: job.locale
            },
            data: {
              pageTitle: productData.pageTitle,
              metaDescription: productData.metaDescription
            }
          },
          
          // Pre-order Settings
          preOrderInput: {
            productId: formattedProductId,
            localeContext: {
              channelId: formattedChannelId,
              locale: job.locale
            },
            data: {
              message: productData.preOrderMessage
            }
          },
          
          // Storefront Details
          storefrontInput: {
            productId: formattedProductId,
            localeContext: {
              channelId: formattedChannelId,
              locale: job.locale
            },
            data: {
              warranty: productData.warranty,
              availabilityDescription: productData.availabilityDescription,
              searchKeywords: productData.searchKeywords
            }
          }
        };

        // Add options if present
        if (productData.options?.length > 0) {
          variables.optionsInput = {
            productId: formattedProductId,
            localeContext: {
              channelId: formattedChannelId,
              locale: job.locale
            },
            data: {
              options: productData.options
            }
          };
        }

        // Add modifiers if present
        if (productData.modifiers?.length > 0) {
          variables.modifiersInput = {
            productId: formattedProductId,
            localeContext: {
              channelId: formattedChannelId,
              locale: job.locale
            },
            data: { modifiers: productData.modifiers }
          };
        }

        // Add custom fields if present
        if (productData.customFields?.length > 0) {
          variables.customFieldsInput = {
            productId: formattedProductId,
            data: productData.customFields
          };
        }

        // Add removal inputs for empty fields that exist in default locale
        if (defaultData.name && !productData.name) {
          variables.removedBasicInfoInput = {
            productId: formattedProductId,
            localeContext: {
              channelId: formattedChannelId,
              locale: job.locale
            },
            overridesToRemove: ['name']
          };
        }

        if (defaultData.description && !productData.description) {
          if (!variables.removedBasicInfoInput) {
            variables.removedBasicInfoInput = {
              productId: formattedProductId,
              localeContext: {
                channelId: formattedChannelId,
                locale: job.locale
              },
              overridesToRemove: []
            };
          }
          variables.removedBasicInfoInput.overridesToRemove.push('description');
        }

        // Similar removal logic for other fields...
        // SEO
        const seoRemovals: string[] = [];
        if (defaultData.pageTitle && !productData.pageTitle) seoRemovals.push('pageTitle');
        if (defaultData.metaDescription && !productData.metaDescription) seoRemovals.push('metaDescription');
        if (seoRemovals.length > 0) {
          variables.removedSeoInput = {
            productId: formattedProductId,
            localeContext: {
              channelId: formattedChannelId,
              locale: job.locale
            },
            overridesToRemove: seoRemovals
          };
        }

        // Storefront
        const storefrontRemovals: string[] = [];
        if (defaultData.warranty && !productData.warranty) storefrontRemovals.push('warranty');
        if (defaultData.availabilityDescription && !productData.availabilityDescription) storefrontRemovals.push('availabilityDescription');
        if (defaultData.searchKeywords && !productData.searchKeywords) storefrontRemovals.push('searchKeywords');
        if (storefrontRemovals.length > 0) {
          variables.removedStorefrontDetailsInput = {
            productId: formattedProductId,
            localeContext: {
              channelId: formattedChannelId,
              locale: job.locale
            },
            overridesToRemove: storefrontRemovals
          };
        }

        // Pre-order
        if (defaultData.preOrderMessage && !productData.preOrderMessage) {
          variables.removedPreOrderInput = {
            productId: formattedProductId,
            localeContext: {
              channelId: formattedChannelId,
              locale: job.locale
            },
            overridesToRemove: ['message']
          };
        }

        // Call the mutation
        await graphqlClient.NOTADA_updateProductLocaleData(variables);
        console.log(`[Import] Successfully updated product ${record.productId}`);
      } catch (error) {
        console.error(`[Import] Error updating product ${record.productId}:`, error);
        throw error;
      }
    });

    console.log(`[Import] Job ${job.id} completed successfully`);
  } catch (error) {
    console.error('[Import] Job failed:', error);
    throw error;
  }
}

// Helper function to format options data for export
function formatOptionsData(options: any) {
  if (!options?.edges) return [];
  
  return options.edges.map((edge: any) => {
    const node = edge.node;
    return {
      id: node.id,
      displayName: node.displayName,
      values: node.values?.map((value: any) => ({
        id: value.id,
        label: value.label
      }))
    };
  });
}

// Helper function to format modifiers data
function formatModifiersData(modifiers: any) {
  if (!modifiers?.edges) return '';
  
  return modifiers.edges.map((edge: any) => {
    const node = edge.node;
    const baseData = {
      id: node.id,
      displayName: node.displayName,
      type: node.__typename
    };

    // Handle different modifier types
    switch (node.__typename) {
      case 'CheckboxProductModifier':
        return {
          ...baseData,
          fieldValue: node.fieldValue
        };
      case 'TextFieldProductModifier':
      case 'MultilineTextFieldProductModifier':
        return {
          ...baseData,
          defaultValue: node.defaultValue
        };
      case 'NumbersOnlyTextFieldProductModifier':
        return {
          ...baseData,
          defaultValue: node.defaultValueFloat
        };
      case 'DropdownProductModifier':
      case 'RadioButtonsProductModifier':
      case 'RectangleListProductModifier':
      case 'SwatchProductModifier':
      case 'PickListProductModifier':
        return {
          ...baseData,
          values: node.values?.map((value: any) => ({
            id: value.id,
            label: value.label
          }))
        };
      default:
        return baseData;
    }
  });
}

// Helper function to format custom fields data
function formatCustomFieldsData(customFields: any) {
  if (!customFields?.edges) return '';
  
  return customFields.edges.map((edge: any) => {
    const node = edge.node;
    return {
      id: node.id,
      name: node.name,
      value: node.value
    };
  });
}

// Helper to generate a unique filename for exports
function generateUniqueExportFilename(jobId: number, storeHash: string, locale: string, channelName: string): string {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  // Sanitize the channel name to remove any potentially unsafe characters
  const sanitizedChannelName = channelName.replace(/[^a-zA-Z0-9.-]/g, '_');
  // Create a descriptive filename that includes job ID, channel, and locale
  const descriptiveFilename = `${jobId}-${sanitizedChannelName}-${locale}.csv`;
  return `exports/${storeHash}/${timestamp}-${randomBytes}-${descriptiveFilename}`;
}

// Process an export job
async function processExportJob(job: TranslationJob, graphqlClient: GraphQLClient, restClient: BigCommerceRestClient) {
  console.log(`[Export] Starting export job ${job.id} for channel ${job.channelId} and locale ${job.locale}`);
  
  try {
    // Get channel details first
    console.log(`[Export] Fetching channel details for channel ${job.channelId}`);
    const channelResponse = await restClient.getChannel(job.channelId);
    const channelName = channelResponse.data?.name || `channel-${job.channelId}`;

    // Get channel locales to determine default locale
    console.log(`[Export] Fetching channel locales for channel ${job.channelId}`);
    const { data: localesData } = await restClient.getChannelLocales(job.channelId);
    const defaultLocale = localesData.find(locale => locale.is_default)?.code || fallbackLocale.code;
    console.log(`[Export] Using default locale: ${defaultLocale}`);

    // Get products from channel
    console.log(`[Export] Fetching products for channel ${job.channelId}`);

    const productAssignments = await restClient.getChannelProductAssignments(job.channelId); 
    
    console.log(`[Export] Found ${productAssignments.data?.length || 0} products`);

    if (!productAssignments.data?.length) {
      throw new Error('No products found for export');
    }

    // Get translations for each product
    console.log(`[Export] Fetching translations for ${productAssignments.data?.length} products in locale ${job.locale}`);

    const translatedProducts = await Promise.all(
      productAssignments.data.map(async (assignment: { channel_id: number, product_id: number }) => {
        const productId = assignment.product_id;
        
        try {
          const translation = await graphqlClient.getProductLocaleData({
            pid: productId,
            channelId: job.channelId,
            locale: job.locale,
            availableLocales: [{ code: job.locale }],
            defaultLocale: defaultLocale
          });
          
          console.log(`[Export] Got translation for product ${productId}`);

          const productNode = translation;
          const localeNode = productNode.overridesForLocale;

          // TODO: make a shared function for this that products GET route also can use
        const options =
          productNode?.options?.edges;
        const modifiers =
          productNode?.modifiers?.edges;
        const customFields =
          productNode?.customFields?.edges;

          return {
            productId: productId,
            // Basic Information
            [`name_${defaultLocale}`]: productNode?.basicInformation?.name || '',
            [`name_${job.locale}`]: localeNode?.basicInformation?.name || '',
            [`description_${defaultLocale}`]: productNode?.basicInformation?.description || '',
            [`description_${job.locale}`]: localeNode?.basicInformation?.description || '',
            
            // SEO Information
            [`pageTitle_${defaultLocale}`]: productNode?.seoInformation?.pageTitle || '',
            [`pageTitle_${job.locale}`]: localeNode?.seoInformation?.pageTitle || '',
            [`metaDescription_${defaultLocale}`]: productNode?.seoInformation?.metaDescription || '',
            [`metaDescription_${job.locale}`]: localeNode?.seoInformation?.metaDescription || '',
            
            // Storefront Details
            [`warranty_${defaultLocale}`]: productNode?.storefrontDetails?.warranty || '',
            [`warranty_${job.locale}`]: localeNode?.storefrontDetails?.warranty || '',
            [`availabilityDescription_${defaultLocale}`]: productNode?.storefrontDetails?.availabilityDescription || '',
            [`availabilityDescription_${job.locale}`]: localeNode?.storefrontDetails?.availabilityDescription || '',
            [`searchKeywords_${defaultLocale}`]: productNode?.storefrontDetails?.searchKeywords || '',
            [`searchKeywords_${job.locale}`]: localeNode?.storefrontDetails?.searchKeywords || '',
            
            // Pre-order Settings
            [`preOrderMessage_${defaultLocale}`]: productNode?.preOrderSettings?.message || '',
            [`preOrderMessage_${job.locale}`]: localeNode?.preOrderSettings?.message || '',

            // Options
            [`options_${defaultLocale}`]: JSON.stringify(formatOptionsData(productNode?.options)),
            [`options_${job.locale}`]: JSON.stringify(formatOptionsData(options)),

            // Modifiers
            [`modifiers_${defaultLocale}`]: JSON.stringify(formatModifiersData(productNode?.modifiers)),
            [`modifiers_${job.locale}`]: JSON.stringify(formatModifiersData(modifiers)),

            // Custom Fields
            [`customFields_${defaultLocale}`]: JSON.stringify(formatCustomFieldsData(productNode?.customFields)),
            [`customFields_${job.locale}`]: JSON.stringify(formatCustomFieldsData(customFields))
          };
        } catch (error) {
          console.error(`[Export] Error fetching translation for product ${productId}:`, error);
          return {
            productId: productId,
            [`name_${defaultLocale}`]: "",
            [`name_${job.locale}`]: "",
            [`description_${defaultLocale}`]: "",
            [`description_${job.locale}`]: "",
            [`pageTitle_${defaultLocale}`]: "",
            [`pageTitle_${job.locale}`]: "",
            [`metaDescription_${defaultLocale}`]: "",
            [`metaDescription_${job.locale}`]: "",
            [`warranty_${defaultLocale}`]: "",
            [`warranty_${job.locale}`]: "",
            [`availabilityDescription_${defaultLocale}`]: "",
            [`availabilityDescription_${job.locale}`]: "",
            [`searchKeywords_${defaultLocale}`]: "",
            [`searchKeywords_${job.locale}`]: "",
            [`preOrderMessage_${defaultLocale}`]: "",
            [`preOrderMessage_${job.locale}`]: "",
            [`options_${defaultLocale}`]: "",
            [`options_${job.locale}`]: "",
            [`modifiers_${defaultLocale}`]: "",
            [`modifiers_${job.locale}`]: "",
            [`customFields_${defaultLocale}`]: "",
            [`customFields_${job.locale}`]: ""
          };
        }
      })
    );

    console.log(`[Export] Creating CSV for ${translatedProducts.length} products`);
    // Create CSV content
    const csvContent = stringifyCSV(translatedProducts, defaultLocale, job.locale);

    // Upload to blob storage with unique filename including channel name
    console.log('[Export] Uploading CSV to blob storage');
    const uniqueFilename = generateUniqueExportFilename(job.id, job.storeHash, job.locale, channelName);
    const { url } = await put(uniqueFilename, csvContent, {
      access: 'public',
      contentType: 'text/csv',
      addRandomSuffix: false // We handle uniqueness ourselves
    });

    console.log(`[Export] Upload complete. File URL: ${url}`);
    return url;
  } catch (error) {
    console.error('[Export] Job failed:', error);
    throw error;
  }
}

// Remove POST handler and keep only GET handler
export async function GET(request: NextRequest) {
  try {
    // Updated verification
    const auth = await verifyAuthorization(request);

    // Get pending jobs (filtered by store if user auth)
    const pendingJobs = auth.type === 'user'
      ? await db.getPendingTranslationJobsByStore(auth.storeHash)
      : await db.getPendingTranslationJobs();

    // Process each job
    for (const job of pendingJobs) {
      try {
        // Get store token
        const accessToken = await db.getStoreToken(job.storeHash);
        if (!accessToken) {
          throw new Error('Store token not found');
        }

        // Create GraphQL client
        const graphqlClient = createGraphQLClient(accessToken, job.storeHash);
        // Create Rest client
        const restClient = createRestClient({accessToken, storeHash: job.storeHash});

        // Update job status to processing
        await db.updateTranslationJob(job.id, { status: 'processing' });

        // Process based on job type
        if (job.jobType === 'import') {
          await processImportJob(job, graphqlClient);
        } else {
          const fileUrl = await processExportJob(job, graphqlClient, restClient);
          job.fileUrl = fileUrl;
        }

        // Update job status to completed
        await db.updateTranslationJob(job.id, { 
          status: 'completed',
          fileUrl: job.fileUrl,
        });
      } catch (error: any) {
        // Update job status to failed
        await db.updateTranslationJob(job.id, { 
          status: 'failed',
          error: error.message,
        });
      }
    }

    return new Response('Jobs processed successfully', { status: 200 });
  } catch (error: any) {
    console.error('Error processing jobs:', error);
    return new Response(error.message || 'Internal Server Error', { 
      status: error.status || 500 
    });
  }
} 