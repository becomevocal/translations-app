# BigCommerce Translations App

This is a BigCommerce App built using [Next.js](https://nextjs.org/) that enables merchants to translate their catalog into multiple languages per storefront. It uses:
- App Extensions to create a native editing experience within the product list
- The BigCommerce GraphQL Admin API to fetch and update catalog localization data

<table>
      <td><img width="386" alt="Screenshot 2024-07-31 at 2 26 42 AM" src="https://github.com/user-attachments/assets/6c6a115a-f1a1-456a-92f7-cee38cf2b8ef"></td>
      <td><img width="560" alt="Screenshot 2024-07-31 at 2 26 31 AM" src="https://github.com/user-attachments/assets/bf3ffc0b-0ca1-49c6-90b7-7f27db908ee1"></td>
    </table>
<table>
  <td><img width="1624" alt="Screenshot 2024-07-31 at 2 18 27 AM" src="https://github.com/user-attachments/assets/31b0b65e-8cab-4f57-a9ce-0785049a041c"></td>
  <td><img width="1624" alt="Screenshot 2024-07-31 at 2 18 38 AM" src="https://github.com/user-attachments/assets/42575204-23d1-4d05-a2ca-6401a5313b61"></td>
</table>

# Todo

- [x] Ability to translate product name and description
- [x] Ability to translate SEO page title and meta description
- [x] Ability to translate dropdown variant option labels
- [x] Ability to translate custom fields
- [x] Add check for multi-lang functionality and fail gracefully if it's not enabled
- [x] Ability to translate non-dropdown variant option labels
- [x] Ability to translate pre-order settings
- [x] Ability to translate storefront details
- [x] Ability to translate modifier option labels
- [x] Ability to translate modifier initial / default values
- [x] Add remove mutations for all nodes
- [x] Improve UX of custom field editing (should use two column layout on mobile)
- [x] Add Sentry error tracking
- [x] Translate app strings (including API route responses and setting user locale via JWT)
- [x] Use default locale and available locales from channel locale settings instead of constant
- [x] Verify app extension is only added once after app is reinstalled 
- [x] Simplify multiple database support, setup, and deployment docs
- [x] Ability to explicitly set api token, store hash, and locale as env variables
- [x] Streamline types across callbacks, sessions, and db functions
- [x] Update uninstall and remove user routes
- [x] Separate auth and session code into client with it's own types so it can be a separate package
- [x] Separate out Admin GraphQL client (including app extensions) into a separate package
- [x] Improve global "failed to load" design
- [x] Split up graphql queries to reduce complexity limits
- [ ] Add import / export functionality (include ensuring uploads are private)
- [ ] Move server side locale transforms in api route into graphql client
- [ ] Add BC CP SDK to preview session timeouts
- [ ] Finish 'start translations' flow

## Getting Started

### Environment Variables Setup

1. Copy the sample environment file:
   ```bash
   cp .env.sample .env.local
   ```

2. Update the following required variables in `.env.local`:
   - `CLIENT_ID` and `CLIENT_SECRET`: Get these from the [BigCommerce Developer Portal](https://developer.bigcommerce.com/api-docs/apps/quick-start#register-a-draft-app)
   - `APP_ORIGIN`: Your app's URL (for local development, this will be your ngrok URL)
   - `JWT_KEY`: A secure random string of 32+ characters
   - `DATABASE_URL`: Your database connection string (see Database Setup below)
   - `BLOB_READ_WRITE_TOKEN`: Your Vercel Blob storage token (get this from your Vercel project settings)
   - `CRON_SECRET`: A secure random string for protecting the cron endpoint

### Database Setup

This app uses [Neon](https://vercel.com/marketplace/neon) (serverless Postgres) with [Drizzle ORM](https://orm.drizzle.team) for database management. It's also compatible with MySQL and SQLite with a tiny change to environment variables.

#### Option 1: Postgres via Neon (Recommended for Production)

1. Create a Neon database through Vercel's marketplace:
   - Visit [Neon on Vercel Marketplace](https://vercel.com/marketplace/neon)
   - Click "Add Integration"
   - Follow the setup instructions

2. Set up your environment variables:
   ```bash
   # Pull environment variables from Vercel
   vercel env pull .env.local
   ```
   This will populate your `.env.local` file with the necessary `DATABASE_URL` variable.

3. Ensure `DB_TYPE=postgres` is set in `.env.local`

#### Option 2: SQLite (Great for development)

1. Set your environment variables in `.env.local`:
   ```bash
   DB_TYPE=sqlite
   DATABASE_URL=sqlite:./local.db
   ```

#### Option 3: MySQL

1. Set your environment variables in `.env`:
   ```bash
   DB_TYPE=mysql
   DATABASE_URL=mysql://user:password@host:port/database
   ```

### Database Management

After setting up your database, run these commands:

1. Install dependencies:
   ```bash
   npm run dev
   ```

2. Create the required tables within your database:
   ```bash
   npm run db:push
   ```

3. (Optional) Use Drizzle Studio to manage your data:
   ```bash
   npm run db:studio
   ```

### Run the App Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


## Debugging

The app uses the `debug` package for detailed logging of API operations. Each client has its own namespace:

- `bigcommerce:admin` - Admin API client operations
- `bigcommerce:graphql` - GraphQL API client operations  
- `bigcommerce:auth` - Auth client operations

To enable debugging, set the DEBUG environment variable:

```bash
# Debug everything
DEBUG=bigcommerce:* npm run dev

# Debug specific clients
DEBUG=bigcommerce:auth,bigcommerce:admin npm run dev

# Debug with timestamps
DEBUG=bigcommerce:*,bigcommerce:admin:* npm run dev
```

The debug output includes:

- Request details (URL, method, headers)
- Response details (status, headers)
- Rate limit information
- GraphQL queries and variables
- JWT operations (encode, decode, verify)
- OAuth handshake details
- Error details with full context

Example debug output:
```
bigcommerce:admin Initialized BigCommerce Admin client with config: +0ms
bigcommerce:admin Making request: { url: "https://api.bigcommerce.com/stores/hash/v2/store.json" } +2ms
bigcommerce:admin Received response: { status: 200, headers: {...} } +150ms
bigcommerce:graphql Making GraphQL request: { query: "query { store { ... } }" } +0ms
bigcommerce:auth Verifying BigCommerce JWT +1ms
```

## Requirements

- Node.js 20 or later
  ```bash
  # Using nvm (Node Version Manager)
  nvm use
  ```
