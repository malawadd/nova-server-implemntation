# NeuroFeedback — AI Mental Wellness Companion

A real-time voice therapy app with a retro 80s brain visualization. Users talk through thoughts and feelings while an AI companion guides them through evidence-based techniques (breathing, CBT, grounding, PMR) and a live brain-region heatmap reflects their cognitive state.

---

## Features

- **Voice sessions** — Free talk, guided technique, or structured program modes
- **Live brain map** — Animated retro visualization of active cognitive regions
- **Exercise library** — Curated breathing, CBT, grounding, PMR, and values exercises  
- **Insights dashboard** — Session history, streaks, mood trends, and top techniques
- **Onboarding** — Goal-setting wizard that saves a personalized profile to the backend
- **Privacy controls** — Granular consent: transcripts, voice data, local-only mode
- **Retro 80s aesthetic** — Full dark-mode design with neon glows and monospace type

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4, custom CSS variables |
| **Auth** | Clerk 6 (`@clerk/nextjs`) |
| **Backend / DB** | Convex 1.31 (real-time database + serverless functions) |
| **Deployment** | Vercel (frontend) + Convex Cloud (backend) |

---

## Project Structure

```
client/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx            # Root layout — ClerkProvider + ConvexClientProvider
│   ├── page.tsx              # Public landing page
│   ├── sign-in/              # Clerk hosted sign-in page
│   ├── sign-up/              # Clerk hosted sign-up page
│   ├── onboarding/           # Goal-setting wizard (auth-gated)
│   └── app/                  # Main app (auth-gated)
│       ├── layout.tsx        # Server-side auth gate → redirects to /sign-in
│       ├── page.tsx          # Dashboard (stats + recent sessions)
│       ├── sessions/         # Session list, new session, session cockpit
│       ├── library/          # Exercise browser
│       ├── insights/         # Mood charts and history
│       └── settings/         # Profile, privacy, account
│
├── components/
│   ├── AppShell.tsx          # Responsive shell: sidebar (desktop) + bottom nav (mobile)
│   ├── ConvexClientProvider.tsx  # ConvexProviderWithClerk (injects auth JWT)
│   ├── landing/              # Landing page section components
│   └── ui/                   # Shared UI — SessionCard, ExerciseCard, MoodSlider, etc.
│
├── convex/                   # Convex backend (deployed separately)
│   ├── schema.ts             # Database schema (all tables)
│   ├── auth.config.ts        # Clerk JWT issuer config
│   ├── sessions.ts           # Session CRUD + transcript mutations
│   ├── profile.ts            # User profile upsert + consent
│   └── exercises.ts          # Exercise library queries
│
└── lib/
    └── types.ts              # Shared TypeScript types
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` in the project root:

```env
# Convex
CONVEX_DEPLOYMENT=dev:<your-deployment-slug>
NEXT_PUBLIC_CONVEX_URL=https://<your-deployment-slug>.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 3. Set up Clerk JWT template (one-time)

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) → your app → **JWT Templates**
2. Click **New template** → select **Convex**
3. Keep template name as `convex` (lowercase) → **Save**

### 4. Set Clerk issuer domain in Convex

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<your-clerk-subdomain>.clerk.accounts.dev
```

Your subdomain is the part before `.clerk.accounts.dev` in your Clerk publishable key.

### 5. Run the dev server

```bash
npm run dev
```

This runs Next.js and `convex dev` in parallel. Visit [http://localhost:3000](http://localhost:3000).

---

## Auth Flow

```
User visits /app  →  server-side auth()  →  no session?  →  redirect /sign-in
                                          ↓ has session
                                       ClerkProvider sends JWT
                                          ↓
                                   ConvexProviderWithClerk
                                          ↓
                            Convex validates JWT via auth.config.ts
                                          ↓
                            ctx.auth.getUserIdentity() returns user
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system diagram and [docs/BACKEND.md](docs/BACKEND.md) for all Convex schema tables and API functions.

---

## Deployment

### Frontend (Vercel)

```bash
vercel deploy
```

Set the same env vars from `.env.local` in your Vercel project settings.

### Backend (Convex)

```bash
npx convex deploy
```

The `convex/` directory is deployed as a standalone Convex project on Convex Cloud. The `CONVEX_DEPLOYMENT` env var ties the frontend to the correct deployment.

---

## Further Reading

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System architecture and data flow
- [docs/BACKEND.md](docs/BACKEND.md) — Convex schema, functions, and auth pattern
- [Convex docs](https://docs.convex.dev)
- [Clerk + Convex integration](https://docs.convex.dev/auth/clerk)
2. Follow the steps to claim your application and link it to this app.
3. Follow step 3 in the [Convex Clerk onboarding guide](https://docs.convex.dev/auth/clerk#get-started) to create a Convex JWT template.
4. Uncomment the Clerk provider in `convex/auth.config.ts`
5. Paste the Issuer URL as `CLERK_JWT_ISSUER_DOMAIN` to your dev deployment environment variable settings on the Convex dashboard (see [docs](https://docs.convex.dev/auth/clerk#configuring-dev-and-prod-instances))

If you want to sync Clerk user data via webhooks, check out this [example repo](https://github.com/thomasballinger/convex-clerk-users-table/).

## Learn more

To learn more about developing your project with Convex, check out:

- The [Tour of Convex](https://docs.convex.dev/get-started) for a thorough introduction to Convex principles.
- The rest of [Convex docs](https://docs.convex.dev/) to learn about all Convex features.
- [Stack](https://stack.convex.dev/) for in-depth articles on advanced topics.

## Join the community

Join thousands of developers building full-stack apps with Convex:

- Join the [Convex Discord community](https://convex.dev/community) to get help in real-time.
- Follow [Convex on GitHub](https://github.com/get-convex/), star and contribute to the open-source implementation of Convex.
