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
- `POST /api/tenants/[tenant]/prayer-requests` stores a public prayer request and returns a
  single-use `contactToken`.
- `POST /api/tenants/[tenant]/prayer-requests/[requestId]/contact` adds optional contact data to a
  request, and requires the `contactToken` returned by the call above.
- `DELETE /api/account` deletes the owner account and owned tenant data.

### Public endpoint protection

The two prayer request routes are intentionally unauthenticated, so they carry their own limits:

- Requests are only accepted for a tenant that exists and is published.
- Messages are capped at 2.000 characters.
- Creating a request mints a `contactToken`, stored on the document only as a SHA-256 hash with a
  30 minute expiry. The contact route verifies it in constant time and burns it on use, so contact
  data can be attached exactly once, by the visitor who wrote the request.
- Both routes are rate limited by IP, and request creation is additionally limited per tenant. The
  counters live in the `rateLimits` Firestore collection (see Data Model) and return `429` with a
  `retry-after` header.

Logo uploads are limited to 2 MB and validated by magic bytes, so the accepted formats are PNG,
JPEG and WebP regardless of the `content-type` the client declares.

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
- `contactTokenHash`, `contactTokenExpiresAt`: single-use credential for the contact step, removed
  once the contact is saved.
- `createdAt`, `contactUpdatedAt`: timestamps.

Rate limit counters are kept in a top-level `rateLimits` collection, one document per fixed window:

- `count`: hits in the current window.
- `windowStartedAt`: window start, in milliseconds.
- `expiresAt`: window end. Configure a Firestore TTL policy on this field so old counters are
  collected automatically.

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

Admin access:

```bash
SUPERADMIN_EMAIL=
```

Alternatively, the server can use:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY=
GOOGLE_APPLICATION_CREDENTIALS=
FIREBASE_CONFIG=
```

## Firebase Configuration

Security rules and index settings are versioned in this repository and deployed with the Firebase
CLI. The project id lives in `.firebaserc`.

```bash
npm run firebase:rules            # deploys firestore.rules
npm run firebase:rules:storage    # deploys storage.rules (needs Storage provisioned first)
npm run firebase:indexes:export   # writes the live index config to firestore.indexes.json
npm run firebase:indexes          # deploys firestore.indexes.json
```

Storage rules deploy to the Firebase default bucket (`aamem-7df99.firebasestorage.app`). The
console provisioned it in locked mode with the same deny-all rules, so the deploy aligns the live
state with the versioned file.

The scripts call `npx firebase-tools`, so there is no global install to keep in sync. Run
`npx firebase-tools login` once before the first deploy.

Both rule files deny every direct client request. All data access goes through the Firebase Admin
SDK on the server, which bypasses security rules, and the client SDK is used only for
authentication. If browser-side Firestore or Storage access is ever added, these rules must be
opened deliberately.

> **Careful:** `npm run firebase:indexes` removes any index or field exemption that is not present
> in `firestore.indexes.json`. Always export before deploying for the first time.

### Storage bucket

The canonical bucket is `aamem-7df99.firebasestorage.app` (Firebase Storage, `us-east1`,
provisioned 2026-08-27 in locked mode). `FIREBASE_STORAGE_BUCKET` and
`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` must point at it.

Logos previously lived in `aamem-7df99-minisite-logos`, a plain GCS bucket in
`southamerica-east1` created outside the Firebase Storage product, which Firebase security rules
cannot govern. The five Firestore-referenced logos were copied to the Firebase bucket on
2026-08-27; the old bucket is kept temporarily as a fallback and can be deleted once production
has been verified on the new one.

Bucket region note: Vercel serverless functions run in `iad1` (us-east) by default, and every logo
read goes through the `/api/minisites/[tenant]/logo` proxy, so a `us-east1` bucket sits next to the
functions. If function regions ever move to `gru1`, revisit this.

### TTL policy

The `rateLimits` TTL policy (timestamp field `expiresAt`) **is** versioned: it appears in
`firestore.indexes.json` as `"ttl": true` on the field override, and `npm run firebase:indexes`
applies it. The same override disables all single-field indexes for `expiresAt`, which is
recommended for TTL fields (monotonically increasing timestamps hotspot their index, and nothing
queries this field).

The TTL policy only controls storage growth. The rate limiter decides windows by comparing
timestamps, so an expired document that has not been collected yet behaves exactly like a missing
one, and nothing depends on the deletion being timely. Deletion typically lags expiry by up to 24h.

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
