# GYMPRO — Gym Management System

A production-oriented gym operations portal built with React 19, TypeScript, Vite, Tailwind CSS, and Firebase (Auth + Cloud Firestore). It handles the full staff workflow: members, memberships, classes, bookings, attendance, trainers, workout and diet programming, equipment maintenance, payments, and reporting — with a role-based capability model enforced on both the client and by Firestore security rules.

## Tech Stack

- **React 19** + **TypeScript** (~5.8, strict mode)
- **Vite 7** (build tool) with route-level code splitting
- **Tailwind CSS 3** (+ tailwindcss-animate, tailwind-merge)
- **Firebase 12** — Authentication (email/password, Google) and Cloud Firestore
- **react-router-dom 7** — HashRouter, protected routes
- **recharts** — dashboard and report visualizations
- **lucide-react** — icon set
- **Vitest** + **@testing-library/react** — unit and component test runner

## Prerequisites

- Node.js 20+ (LTS)
- A Firebase project with **Authentication (Email/Password + optional Google provider)** and **Cloud Firestore** enabled
- Firestore rules deployed from `firestore.rules` and indexes from `firestore.indexes.json`

## Getting Started

1. **Install dependencies** (uses the committed `package-lock.json`):
   ```bash
   npm ci
   ```
2. **Configure Firebase**:
   ```bash
   cp .env.example .env
   # then fill in the six VITE_FIREBASE_* values from
   # Firebase console → Project settings → General → Your apps
   ```
3. **Deploy security rules and indexes** (one-time setup, requires the `firebase` CLI):
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules,firestore:indexes
   ```
4. **Seed an initial owner** — the deployed rules only permit self-signup with role `user`, so a bootstrap owner must be provisioned once:
   ```bash
   node scripts/create-temp-admin.mjs <email> <password>
   ```
5. **Start the dev server**:
   ```bash
   npm run dev
   ```

## Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) then production bundle (`vite build`) |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | ESLint across the repo |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Coverage report (v8) |

## Architecture

The app is organised around four surfaces, each with a distinct responsibility:

- **Dashboard** — read-only overview (KPIs derived from Firestore queries; no hardcoded values).
- **Admin Panel** (`/admin`) — privileged workspace for account provisioning, role assignment, gym-wide configuration, audit logs, and data backup. Route is gated by the `admin` capability.
- **Operations** — daily pages: Members, Classes, Attendance, Trainers, Workout Plans, Diet Plans, Equipment, Membership Plans, Payments, Reports. Each is gated by a specific capability.
- **Profile & Settings** (`/settings`) — personal account preferences (name, contact, notification toggles, password change). Distinct from gym-wide configuration, which lives under Admin → Gym.

### Capability-Based Authorization

Roles are `owner | admin | manager | staff | user`. Rather than sprinkling `role === 'admin'` checks through the UI, every route, sidebar entry, and action button is gated by a **capability** from `src/lib/permissions.ts`:

```ts
roleHas(user.role, 'payments')   // used by ProtectedRoute
can('members.create')            // exposed via AuthContext
```

The same capability names appear in Firestore rules (`isStaff()`, `isManager()`, `isOwner()`), so the client-side boundary and the server-side boundary stay aligned. The `users/{uid}.role` field is currently client-writable; see "Known limitations" below.

### Data Model

Firestore collections (see `src/types/index.ts` for the TypeScript shapes):

`users` · `members` · `trainers` · `classes` · `class_bookings` · `attendance` · `equipment` · `membership_plans` · `workout_plans` · `diet_plans` · `payments` · `settings` · `system_logs`

Business rules that derive state (plan lifecycle, membership expiry, equipment availability, adherence percentages) live in `src/lib/plans.ts`, `src/lib/workouts.ts`, `src/lib/notifications.ts`, and `src/utils/dates.ts` so the UI, tests, and any future backend all share one source of truth.

### Project Layout

```
src/
  components/     Reusable UI primitives (Button, Card, Modal, Layout, Sidebar, Header, …)
  contexts/       AuthContext — Firebase session, role resolution, `can(capability)`
  lib/            firebase.ts · permissions.ts · plans.ts · workouts.ts · notifications.ts
  pages/          One file per route (Dashboard, Members, Payments, Admin, Settings, …)
  types/          Domain interfaces
  utils/          dates.ts · export.ts (CSV/JSON helpers)
  App.tsx         Route table with lazy/Suspense + ProtectedRoute guards
firestore.rules       Server-side capability enforcement
firestore.indexes.json  Composite indexes required by production queries
```

## Testing

Run `npm test` to execute the Vitest suite. Coverage lives alongside source in `__tests__/` folders:

- `src/lib/__tests__/permissions.test.ts` — role/capability matrix, `assignableRoles` boundaries
- `src/utils/__tests__/dates.test.ts` — `toISO`, `planDurationDays`, `addDays`, `expiryStatus`
- `src/lib/__tests__/plans.test.ts` — plan validation, active/inactive lifecycle
- `src/lib/__tests__/workouts.test.ts` — adherence stats derived from completion log
- `src/lib/__tests__/notifications.test.ts` — membership-expiry and equipment-maintenance notification derivation

Firestore emulator security tests (allowed/denied operations per role) are a planned follow-up: they require the Firebase emulator (`firebase emulator:firestore`) and are intentionally not run in `npm test` today.

## Deployment

Two hosting targets are configured:

- **Netlify** — `netlify.toml` builds with `npm run build` and publishes `dist/`, with SPA rewrites.
- **Firebase Hosting** — `firebase.json` serves `dist/` with SPA rewrites.

Pick one canonical path per environment. Rules and indexes must be deployed from `firestore.rules` / `firestore.indexes.json` regardless of host.

## Known Limitations

- **Roles are stored in a client-writable `users/{uid}` document.** Firestore rules read this document for `isStaff()` / `isManager()` / `isOwner()` checks, which stops casual tampering but is not a hard trust boundary. Migrating to **Firebase custom claims** (or a Cloud Function writing an `idToken` claim) requires the Blaze plan and is scheduled as a follow-up.
- **Two-factor authentication is not implemented.** The Settings page shows an honest "Coming soon" notice rather than a fake toggle — the workspace relies on Firebase email/password + Google sign-in only until a Phone Auth flow is wired.
- **Payments are manual records**, not a real provider integration. Card, UPI, cash etc. are logged as free-form records; there is no webhook, no idempotency, no refund flow. Do not use the "revenue" figures as accounting truth until a provider is connected.

## Environment Variables

Set in `.env` (gitignored; template in `.env.example`):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

These values are **public** by design — the Firebase Web SDK exposes them in the browser bundle. Firestore security rules are what actually protect data; a caller with these keys but no valid Auth session (and no matching role document) cannot read or write anything.

## License

MIT
