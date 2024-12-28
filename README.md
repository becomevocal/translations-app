# Multi-lang Translations App
Using the GraphQL Admin API with support for multiple locales.

<table>
      <td><img width="386" alt="Screenshot 2024-07-31 at 2 26 42 AM" src="https://github.com/user-attachments/assets/6c6a115a-f1a1-456a-92f7-cee38cf2b8ef"></td>
      <td><img width="560" alt="Screenshot 2024-07-31 at 2 26 31 AM" src="https://github.com/user-attachments/assets/bf3ffc0b-0ca1-49c6-90b7-7f27db908ee1"></td>
    </table>
<table>
  <td><img width="1624" alt="Screenshot 2024-07-31 at 2 18 27 AM" src="https://github.com/user-attachments/assets/31b0b65e-8cab-4f57-a9ce-0785049a041c"></td>
  <td><img width="1624" alt="Screenshot 2024-07-31 at 2 18 38 AM" src="https://github.com/user-attachments/assets/42575204-23d1-4d05-a2ca-6401a5313b61"></td>
</table>



This is a [Next.js](https://nextjs.org/) project bootstrapped with [`c3`](https://developers.cloudflare.com/pages/get-started/c3), but it's deployed on Vercel.

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
- [ ] Add Sentry error tracking
- [ ] Translate app strings
- [ ] Simplify multiple database support & deployment docs
- [ ] Pull out Admin GraphQL client into a separate package
- [ ] Add import / export functionality

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Cloudflare integration

Besides the `dev` script mentioned above `c3` has added a few extra scripts that allow you to integrate the application with the [Cloudflare Pages](https://pages.cloudflare.com/) environment, these are:
  - `pages:build` to build the application for Pages using the [`@cloudflare/next-on-pages`](https://github.com/cloudflare/next-on-pages) CLI
  - `preview` to locally preview your Pages application using the [Wrangler](https://developers.cloudflare.com/workers/wrangler/) CLI
  - `deploy` to deploy your Pages application using the [Wrangler](https://developers.cloudflare.com/workers/wrangler/) CLI

> __Note:__ while the `dev` script is optimal for local development you should preview your Pages application as well (periodically or before deployments) in order to make sure that it can properly work in the Pages environment (for more details see the [`@cloudflare/next-on-pages` recommended workflow](https://github.com/cloudflare/next-on-pages/blob/05b6256/internal-packages/next-dev/README.md#recommended-workflow))

### Bindings

Cloudflare [Bindings](https://developers.cloudflare.com/pages/functions/bindings/) are what allows you to interact with resources available in the Cloudflare Platform.

You can use bindings during development, when previewing locally your application and of course in the deployed application:

- To use bindings in dev mode you need to define them in the `next.config.js` file under `setupDevBindings`, this mode uses the `next-dev` `@cloudflare/next-on-pages` submodule. For more details see its [documentation](https://github.com/cloudflare/next-on-pages/blob/05b6256/internal-packages/next-dev/README.md).

- To use bindings in the preview mode you need to add them to the `pages:preview` script accordingly to the `wrangler pages dev` command. For more details see its [documentation](https://developers.cloudflare.com/workers/wrangler/commands/#dev-1) or the [Pages Bindings documentation](https://developers.cloudflare.com/pages/functions/bindings/).

- To use bindings in the deployed application you will need to configure them in the Cloudflare [dashboard](https://dash.cloudflare.com/). For more details see the  [Pages Bindings documentation](https://developers.cloudflare.com/pages/functions/bindings/).

#### KV Example

`c3` has added for you an example showing how you can use a KV binding.

In order to enable the example:
- Search for javascript/typescript lines containing the following comment:
  ```ts
  // KV Example:
  ```
  and uncomment the commented lines below it.
- Do the same in the `wrangler.toml` file, where
  the comment is:
  ```
  # KV Example:
  ```
- If you're using TypeScript run the `cf-typegen` script to update the `env.d.ts` file:
  ```bash
  npm run cf-typegen
  # or
  yarn cf-typegen
  # or
  pnpm cf-typegen
  # or
  bun cf-typegen
  ```

After doing this you can run the `dev` or `preview` script and visit the `/api/hello` route to see the example in action.

Finally, if you also want to see the example work in the deployed application make sure to add a `MY_KV_NAMESPACE` binding to your Pages application in its [dashboard kv bindings settings section](https://dash.cloudflare.com/?to=/:account/pages/view/:pages-project/settings/functions#kv_namespace_bindings_section). After having configured it make sure to re-deploy your application.
