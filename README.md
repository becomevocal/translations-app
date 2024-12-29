# Multi-lang Translations App

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
- [ ] Translate app strings
- [ ] Simplify multiple database support, setup, and deployment docs
- [ ] Pull out Admin GraphQL client into a separate package
- [ ] Add import / export functionality

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
