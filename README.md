<p align="center">
  <img src="public/brand/aamem-logo.png" alt="aamem" width="180" />
</p>

# aamem

aamem is a minisite builder for churches and faith communities. The product lets a church create a simple public bio page, publish a prayer request form, collect requests from visitors, and manage everything from a private admin area.

## Product Goal

The site is designed to make church publishing feel lightweight:

- A visitor can choose a public slug and create an account.
- An authenticated admin can edit the minisite name, description, logo, and theme.
- A published minisite exposes a public bio page and a prayer request page.
- Prayer requests are stored for the church owner and can be reviewed or printed from the admin area.

## Storybook

Storybook is used to review the visual system and template states without navigating the full app.

- Local Storybook: [http://localhost:6006](http://localhost:6006)
- Published Storybook URL: [https://aamem-ds.vercel.app/](https://aamem-ds.vercel.app/)

Run it locally with:

```bash
npm run storybook
```

Build the static Storybook output with:

```bash
npm run build-storybook
```

The main stories live in `src/stories/` and cover brand assets, UI primitives, creation/editing templates, prayer request templates, and the not found page.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui-style primitives
- Firebase Authentication
- Firebase Admin SDK
- Firestore
- Firebase Storage
- Storybook 10
- Vitest
- Playwright-backed Storybook tests

## Frontend Architecture

The app uses the Next.js App Router under `src/app/`.

Primary routes:

- `/` renders the public minisite creation flow.
- `/admin` renders the admin home with summary cards.
- `/admin/dados` renders account and owner data.
- `/admin/pedidos` renders prayer request management.
- `/admin/link-da-bio` renders the minisite editor.
- `/[tenant]` renders a published church bio page.
- `/[tenant]/pedido-de-oracao` renders the public prayer request form.

UI is organized around reusable templates:

- `src/components/templates/create-your-own-flow.tsx` contains the public creation, minisite editor, and published bio templates.
- `src/components/templates/create-your-own-home-flow.tsx` owns the interactive home creation flow.
- `src/components/templates/admin-minisite-flow.tsx` owns the authenticated minisite editor state and save/publish behavior.
- `src/components/templates/prayer-request-form-flow.tsx` owns the public prayer request submission flow.
- `src/components/templates/prayer-request-page.tsx` renders the prayer request form UI.
- `src/components/ui/` contains shared UI primitives.

Server Components are used for route-level data loading. Client Components are pushed down to the interactive flows that need browser state, form events, Firebase client auth, or fetch mutations.

## Backend Architecture

The backend is implemented with Next.js Route Handlers and Firebase services.

Authentication:

- The browser signs in with Google through the Firebase client SDK.
- `/api/auth/session` receives the Firebase ID token and creates an HTTP-only `__session` cookie through the Firebase Admin SDK.
- Server routes call `getCurrentUser()` from `src/lib/auth/session.ts` to verify the session cookie.

Tenant and minisite data:

- Firestore stores tenant documents in `tenants/{tenant}`.
- Each tenant has nested page documents under `tenants/{tenant}/pages`.
- Prayer requests are stored under `tenants/{tenant}/prayerRequests`.
- Logos are uploaded to Firebase Storage under `tenants/{tenant}/logo.{ext}`.

Important API routes:

- `POST /api/minisites` creates a draft tenant and returns the admin editor redirect.
- `PATCH /api/minisites/[tenant]` saves minisite draft changes.
- `POST /api/minisites/[tenant]/publish` publishes the tenant pages and revalidates the public routes.
- `POST /api/tenants/[tenant]/prayer-requests` stores a public prayer request.
- `POST /api/tenants/[tenant]/prayer-requests/[requestId]/contact` adds optional contact data to a request.
- `DELETE /api/account` deletes the owner account and owned tenant data.

Public pages use cached Firestore reads with tenant cache tags. Publishing revalidates the tenant and path tags so the public minisite updates after admin changes.

## Data Model

Core tenant fields:

- `tenant`: public slug.
- `status`: `draft` or `published`.
- `ownerUid`: Firebase Auth user id.
- `institutionName`: church or institution name.
- `description`: bio copy shown on the public page.
- `themeId`: selected minisite theme.
- `logoPath`: optional Firebase Storage path.
- `createdAt`, `updatedAt`, `publishedAt`: lifecycle timestamps.

Core page fields:

- `path`: public path, such as `/` or `/pedido-de-oracao`.
- `status`: `draft` or `published`.
- `title`, `description`: public metadata/content.
- `blocks`: page block descriptors.

Prayer request fields:

- `message`: request text.
- `status`: request state, currently created as `new`.
- `wantsContact`: whether the visitor requested follow-up.
- `contactName`, `contactWhatsapp`: optional follow-up fields.
- `createdAt`, `contactUpdatedAt`: timestamps.

## Environment Variables

Client Firebase variables:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Server Firebase variables:

```bash
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_STORAGE_BUCKET=
```

Alternatively, the server can use:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY=
GOOGLE_APPLICATION_CREDENTIALS=
FIREBASE_CONFIG=
```

## Development Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:storybook
npm run storybook
npm run build-storybook
```

## Testing

Unit tests use Vitest in the `unit` project:

```bash
npm run test
```

Current unit coverage focuses on:

- Template rendering states.
- Public prayer request UI states.
- Phone normalization.
- Tenant slug and path helpers.
- Cache tag helpers.
- Revalidation route behavior.

Storybook tests use the Storybook Vitest addon with a headless Chromium browser:

```bash
npm run test:storybook
```

These tests validate that stories compile and render in the browser. The Vitest config pre-optimizes `next/link` for stable Storybook test runs.

## Brand

- Primary logo: `public/brand/aamem-logo.png`
- Font: Adamina
- Brand colors:
  - Indigo: `#231169`
  - Cocoa: `#2b1d1d`
  - Lavender: `#5a527c`
  - Rose: `#9e6c6c`
  - White: `#ffffff`
