import { NextRequest } from 'next/server';
import { dbClient as db } from '@/lib/db';
import { put, list, del } from '@vercel/blob';
import { createGraphQLClient } from '@bigcommerce/translations-graphql-client';
import type { GraphQLClient } from '@bigcommerce/translations-graphql-client';
import type { TranslationJob } from '@/lib/db/clients/types';
import { createRestClient, BigCommerceRestClient } from '@bigcommerce/translations-rest-client';
import { getSessionFromContext } from '@/lib/auth';

// CSV record type
interface TranslationRecord {
  productId: number;
  [key: string]: string | number; // Allow dynamic locale-based column names
}

// Helper function to parse CSV using Web APIs
async function parseCSV(text: string): Promise<TranslationRecord[]> {
  const rows = text.split('\n');
  const headers = rows[0].split(',').map(h => h.trim());
  
  return rows.slice(1)
    .filter(row => row.trim())
    .map(row => {
      const values = row.split(',').map(v => v.trim());
      const record: any = {};
      headers.forEach((header, i) => {
        if (header === 'productId') {
          record[header] = parseInt(values[i], 10);
        } else {
          record[header] = values[i];
        }
      });
      return record as TranslationRecord;
    });
}

// Helper function to stringify CSV using Web APIs
function stringifyCSV(records: TranslationRecord[], defaultLocale: string, targetLocale: string): string {
  const headers = [
    'productId',
    `name_${defaultLocale}`,
    `name_${targetLocale}`,
    `description_${defaultLocale}`,
    `description_${targetLocale}`
  ];
  
  // Helper to escape and quote CSV cell content
  const escapeCsvCell = (str: string | number): string => {
    if (typeof str === 'number') return String(str);
    if (!str) return '""';
    // Escape quotes by doubling them and wrap the entire cell in quotes
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headerRow = headers.join(',');
  const rows = records.map(record => 
    headers.map(header => escapeCsvCell(record[header as keyof TranslationRecord])).join(',')
  );
  
  return [headerRow, ...rows].join('\n');
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

// Updated verification function to check either secret or context
async function verifyAuthorization(request: NextRequest) {
  // Check for Authorization header (secret)
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const [type, token] = authHeader.split(' ');
    if (type === 'Bearer' && token === process.env.CRON_SECRET) {
      return;
    }
  }

  // Check for context parameter
  const context = request.nextUrl.searchParams.get('context');
  if (context) {
    try {
      await getSessionFromContext(context);
      return;
    } catch (error) {
      console.error('Invalid context:', error);
    }
  }

  throw new Error('Unauthorized: Valid authorization header or context required');
}

// Process an import job
async function processImportJob(job: TranslationJob, graphqlClient: GraphQLClient) {
  console.log(`[Import] Starting import job ${job.id} for channel ${job.channelId} and locale ${job.locale}`);
  
  try {
    if (!job.fileUrl) {
      throw new Error('No file URL provided for import job');
    }

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
        await graphqlClient.updateProductLocaleData(
          {
            input: {
              productId: `bc/store/product/${record.productId}`,
              localeContext: {
                channelId: `bc/store/channel/${job.channelId}`,
                locale: job.locale,
              },
              data: {
                name: record.name,
                description: record.description,
              },
            },
          }
        );
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

// Process an export job
async function processExportJob(job: TranslationJob, graphqlClient: GraphQLClient, restClient: BigCommerceRestClient) {
  console.log(`[Export] Starting export job ${job.id} for channel ${job.channelId} and locale ${job.locale}`);
  
  try {
    // Get products from channel
    console.log(`[Export] Fetching products for channel ${job.channelId}`);
    const productsResponse = await graphqlClient.getAllProducts(CONFIG.PRODUCTS_PER_PAGE);

    const productAssignments = await restClient.getChannelProductAssignments(job.channelId);
    console.log("\n\nproductAssignments\n\n", JSON.stringify(productAssignments, null, 2));
    const products = productsResponse?.data?.store?.products?.edges;  
    
    console.log(`[Export] Found ${products?.length || 0} products`);

    if (!products?.length) {
      throw new Error('No products found for export');
    }

    // Get translations for each product
    console.log(`[Export] Fetching translations for ${products.length} products in locale ${job.locale}`);

    // TODO: Get default locale from channel
    const defaultLocale = 'en'

    const translatedProducts = await Promise.all(
      productAssignments.data.map(async (assignment: { channel_id: number, product_id: number }) => {
        const productId = assignment.product_id;
        
        try {
          const translation = await graphqlClient.getProductLocaleData({
            pid: productId,
            channelId: job.channelId,
            availableLocales: [{ code: job.locale }],
            defaultLocale: defaultLocale
          });
          
          console.log(`[Export] Got translation for product ${productId}`);

          const productNode = translation.data.store.products.edges[0].node;
          const localeNode = productNode[job.locale];

          // TODO: make a shared function for this that proudcts GET route also can use
        // const options =
        //   gqlData.data.store.products.edges[0].node?.options?.edges;
        // const modifiers =
        //   gqlData.data.store.products.edges[0].node?.modifiers?.edges;
        // const customFields =
        //   gqlData.data.store.products.edges[0].node?.customFields?.edges;

          return {
            productId: productId,
            [`name_${defaultLocale}`]: productNode?.basicInformation?.name,
            [`name_${job.locale}`]: localeNode?.basicInformation?.name,
            [`description_${defaultLocale}`]: productNode?.basicInformation?.description,
            [`description_${job.locale}`]: localeNode?.basicInformation?.description
          };
        } catch (error) {
          console.error(`[Export] Error fetching translation for product ${productId}:`, error);
          return {
            // TODO: fetch default product info from rest client
            productId: productId,
            [`name_${defaultLocale}`]: "",
            [`name_${job.locale}`]: "",
            [`description_${defaultLocale}`]: "",
            [`description_${job.locale}`]: ""
          };
        }
      })
    );

    console.log(`[Export] Creating CSV for ${translatedProducts.length} products`);
    // Create CSV content
    const csvContent = stringifyCSV(translatedProducts, defaultLocale, job.locale);

    // Upload to blob storage
    console.log('[Export] Uploading CSV to blob storage');
    const { url } = await put(`exports/${job.id}.csv`, csvContent, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log(`[Export] Upload complete. File URL: ${url}`);
    return url;
  } catch (error) {
    console.error('[Export] Job failed:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Updated verification
    await verifyAuthorization(request);

    // Get context if available (for filtering jobs)
    const context = request.nextUrl.searchParams.get('context');
    
    // Get pending jobs (filtered by store if context provided)
    const pendingJobs = context 
      ? await db.getPendingTranslationJobsByStore((await getSessionFromContext(context)).storeHash)
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