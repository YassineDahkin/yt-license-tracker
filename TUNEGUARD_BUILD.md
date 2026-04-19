# TuneGuard — Build Status & Implementation Guide

> **Purpose**: Persistent context file. Read this at session start to restore full project context without re-deriving from code history.

---

## What This App Does

YouTube Music License Tracker. Creators lose revenue when paid music licenses expire silently across old videos. TuneGuard:
1. Connects YouTube channel via OAuth
2. Syncs all videos
3. Scans each video for music (AudD API + description parsing)
4. Tracks license expiry (CSV upload from Epidemic Sound / Artlist)
5. Alerts creator 30/14/3 days before license expires
6. Suggests dispute text if a copyright claim hits

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Auth | NextAuth.js v5 beta (`next-auth@5.0.0-beta.31`) |
| DB | Neon serverless Postgres + Prisma 7 + `@prisma/adapter-pg` |
| Background jobs | Inngest v4 (fan-out, cron, retries, rate limiting) |
| Email | Resend + React Email |
| Billing | Stripe (Checkout Sessions + webhooks) |
| Music detection | AudD API |
| UI | Tailwind CSS + shadcn/ui |

---

## Stage Progress

| Stage | Status | Description |
|---|---|---|
| 1 — Foundation | ✅ DONE | Auth, DB, channel connect, video sync |
| 2 — Music Detection | ✅ DONE | AudD scan, Inngest fan-out, description parsing |
| 3 — License Tracking | ⏳ TODO | CSV upload, expiry calc, risk scoring |
| 4 — Alerts | ⏳ TODO | Nightly cron, Resend emails, revenue monitoring |
| 5 — Billing + Dispute | ⏳ TODO | Stripe 3-tier, dispute assistant |
| 6 — Polish | ⏳ TODO | Error boundaries, skeletons, Chrome extension (optional) |

---

## Critical Architecture Decisions

### DB Adapter: `@prisma/adapter-pg` (standard pg.Pool)

Tried and rejected:
- `PrismaNeonHttp` → "Transactions not supported in HTTP mode" (Prisma `upsert` requires transactions)
- `PrismaNeon` WebSocket → "No database host" error (Pool created at module load before env vars loaded)

Final choice: `@prisma/adapter-pg` with `pg.Pool` — supports transactions, works with Neon over TLS.

### Inngest v4 API Change

v4 changed `createFunction` from 3-arg to 2-arg. Triggers are now in the config object:
```typescript
// v3 (broken):
inngest.createFunction({ id }, { event: "..." }, async ({ event, step }) => {})

// v4 (correct):
inngest.createFunction({ id, triggers: [{ event: "..." }] }, async ({ event, step }) => {})
```

### YouTube Quota Strategy

Use `playlistItems.list` (1 quota unit per 50 videos) NOT `search.list` (100 units per call) for video sync.

### Env Vars: Two Files

- `.env` — Direct Neon URL (`DIRECT_URL`) only for `prisma migrate`. Not loaded at runtime.
- `.env.local` — All runtime vars including pooler `DATABASE_URL`.

---

## Files Created (Stages 1–2)

### Database
- `prisma/schema.prisma` — Full schema (see schema section below)
- `prisma.config.ts` — Prisma 7 datasource config (URL not in schema)

### Core Lib
- `src/lib/db.ts` — Prisma singleton with `@prisma/adapter-pg`
- `src/lib/youtube.ts` — YouTube Data API helpers
- `src/lib/utils.ts` — `cn()`, `formatNumber()`, `chunk()`, `daysUntil()`
- `src/lib/audd.ts` — AudD music recognition API client
- `src/lib/description-parser.ts` — Regex parser for Epidemic Sound / Artlist credits in descriptions

### Auth
- `src/auth.ts` — NextAuth v5 with Google OAuth + YouTube scopes
- `src/middleware.ts` — Route protection (dashboard → login redirect)
- `src/app/api/auth/[...nextauth]/route.ts` — Auth handler

### API Routes
- `src/app/api/channels/route.ts` — POST connect channel, GET list channels
- `src/app/api/channels/[channelId]/videos/route.ts` — POST sync videos, GET list videos
- `src/app/api/scans/route.ts` — POST trigger bulk scan, GET scan progress
- `src/app/api/inngest/route.ts` — Inngest `serve()` handler

### Inngest Functions
- `src/inngest/client.ts` — `new Inngest({ id: "tuneguard" })`
- `src/inngest/functions/bulk-scan.ts` — Fan-out: one event → N scan events
- `src/inngest/functions/scan-video.ts` — Per-video: AudD + description parse → save tracks

### UI
- `src/app/login/page.tsx` — Login page
- `src/app/dashboard/page.tsx` — Dashboard overview
- `src/app/layout.tsx` — Root layout
- `src/components/dashboard/sync-videos-button.tsx` — POST /api/channels/[id]/videos
- `src/components/dashboard/scan-button.tsx` — POST /api/scans + polls progress

### Config
- `next.config.mjs` — remotePatterns for Google avatars + YouTube thumbnails
- `.env.local` — Runtime env vars (see env section below)

---

## Env Vars (`.env.local`)

```bash
# Database (Neon) — use POOLER URL for runtime
DATABASE_URL="postgresql://...pooler.../neondb?sslmode=require&channel_binding=require"

# Auth
AUTH_SECRET="<random base64 string — openssl rand -base64 32>"
AUTH_URL="http://localhost:3000"

# Google OAuth (GCP Console)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Stripe (empty until Stage 5)
STRIPE_SECRET_KEY=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_CREATOR_PRICE_ID=""
STRIPE_PRO_PRICE_ID=""

# Inngest
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="signkey-prod-..."   # Use the ACTIVE key, not the new inactive one
INNGEST_DEV=1                            # Use local dev server, not cloud

# Resend (empty until Stage 4)
RESEND_API_KEY=""

# AudD
AUDD_API_KEY="99572a6ea9066a35ea515d95bc5a13ea"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### `.env` (migrations only)
```bash
DATABASE_URL="postgresql://...direct.../neondb?sslmode=require"   # Direct URL, not pooler
```

---

## Running Locally

```bash
# Terminal 1: Inngest dev server
npx inngest-cli@latest dev

# Terminal 2: Next.js
npm run dev
```

Then visit `http://localhost:3000`. Inngest UI at `http://localhost:8288`.

---

## Prisma Schema (Full)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  accounts      Account[]
  sessions      Session[]
  channels      Channel[]
  alerts        Alert[]
  subscription  Subscription?
  licenses      License[]
  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime
  @@unique([identifier, token])
  @@map("verification_tokens")
}

model Channel {
  id               String    @id @default(cuid())
  userId           String
  youtubeChannelId String    @unique
  title            String
  thumbnailUrl     String?
  subscriberCount  Int?
  lastSyncedAt     DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  user             User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  videos           Video[]
  revenueSnapshots RevenueSnapshot[]
  @@map("channels")
}

model Video {
  id             String     @id @default(cuid())
  channelId      String
  youtubeVideoId String     @unique
  title          String
  description    String?    @db.Text
  publishedAt    DateTime?
  thumbnailUrl   String?
  viewCount      Int?
  scanStatus     ScanStatus @default(PENDING)
  scannedAt      DateTime?
  riskScore      RiskLevel  @default(UNKNOWN)
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  channel        Channel      @relation(fields: [channelId], references: [id], onDelete: Cascade)
  videoTracks    VideoTrack[]
  @@map("videos")
}

enum ScanStatus { PENDING SCANNING COMPLETED FAILED SKIPPED }
enum RiskLevel  { SAFE AT_RISK EXPIRED UNKNOWN }

model Track {
  id          String   @id @default(cuid())
  title       String
  artist      String
  isrc        String?  @unique
  label       String?
  createdAt   DateTime @default(now())
  videoTracks VideoTrack[]
  licenses    License[]
  @@map("tracks")
}

model VideoTrack {
  id         String      @id @default(cuid())
  videoId    String
  trackId    String
  source     TrackSource @default(AUDD)
  confidence Float?
  video      Video  @relation(fields: [videoId], references: [id], onDelete: Cascade)
  track      Track  @relation(fields: [trackId], references: [id])
  @@unique([videoId, trackId])
  @@map("video_tracks")
}

enum TrackSource { AUDD DESCRIPTION_PARSE MANUAL }

model License {
  id          String          @id @default(cuid())
  userId      String
  trackId     String
  platform    LicensePlatform
  licenseType String?
  purchasedAt DateTime?
  expiresAt   DateTime?
  metadata    Json?
  createdAt   DateTime        @default(now())
  user        User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  track       Track @relation(fields: [trackId], references: [id])
  @@map("licenses")
}

enum LicensePlatform { EPIDEMIC_SOUND ARTLIST MUSICBED POND5 OTHER MANUAL }

model RevenueSnapshot {
  id               String   @id @default(cuid())
  channelId        String
  date             DateTime @db.Date
  estimatedRevenue Float?
  rpm              Float?
  views            Int?
  createdAt        DateTime @default(now())
  channel          Channel @relation(fields: [channelId], references: [id], onDelete: Cascade)
  @@unique([channelId, date])
  @@map("revenue_snapshots")
}

model Alert {
  id          String    @id @default(cuid())
  userId      String
  type        AlertType
  title       String
  body        String    @db.Text
  metadata    Json?
  read        Boolean   @default(false)
  emailSentAt DateTime?
  createdAt   DateTime  @default(now())
  user        User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("alerts")
}

enum AlertType {
  LICENSE_EXPIRY_30
  LICENSE_EXPIRY_14
  LICENSE_EXPIRY_3
  LICENSE_EXPIRED
  REVENUE_DROP
  SCAN_COMPLETE
}

model Subscription {
  id                   String             @id @default(cuid())
  userId               String             @unique
  stripeCustomerId     String             @unique
  stripeSubscriptionId String?            @unique
  stripePriceId        String?
  plan                 SubscriptionPlan   @default(FREE)
  status               SubscriptionStatus @default(ACTIVE)
  currentPeriodEnd     DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
  user                 User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("subscriptions")
}

enum SubscriptionPlan   { FREE CREATOR PRO }
enum SubscriptionStatus { ACTIVE PAST_DUE CANCELLED TRIALING }
```

---

## Stage 3: License Tracking (Next)

### Goal
CSV upload (Epidemic Sound + Artlist) → license expiry → risk score per video → color-coded dashboard.

### Files to Create
```
src/app/api/licenses/route.ts
src/app/dashboard/licenses/page.tsx
src/app/dashboard/licenses/upload/page.tsx
src/lib/csv-parsers/epidemic-sound.ts
src/lib/csv-parsers/artlist.ts
src/lib/csv-parsers/index.ts
src/lib/risk-scoring.ts
src/inngest/functions/score-videos.ts     # Background risk scoring after CSV upload
src/components/licenses/upload-zone.tsx
src/components/licenses/risk-badge.tsx
```

### Risk Scoring Rules
- Per video: worst-case risk across all its tracks wins
- Priority: `EXPIRED` > `AT_RISK` > `SAFE` > `UNKNOWN`
- `AT_RISK`: license expires within 30 days
- Run as Inngest background job after CSV upload (can be O(n×m))

### Platform Quirks
- **Epidemic Sound**: subscription-based, no per-track expiry. Store user's renewal date; all ES licenses expire on that date.
- **Artlist pre-2021**: perpetual licenses → `null` expiry = `SAFE`
- CSV headers change without notice → fail gracefully, show which column was missing
- Track matching without ISRC: fuzzy match `title + artist` case-insensitive

### Plans
```typescript
FREE:    { price: 0,  videoLimit: 50,       channelLimit: 1, hasDisputeAssistant: false }
CREATOR: { price: 19, videoLimit: Infinity, channelLimit: 1, hasDisputeAssistant: true  }
PRO:     { price: 49, videoLimit: Infinity, channelLimit: 3, hasDisputeAssistant: true  }
```

---

## Stage 4: Alerts + Monitoring

### Files to Create
```
src/inngest/functions/nightly-check.ts     # Cron: "0 8 * * *"
src/inngest/functions/check-license-expiry.ts
src/inngest/functions/check-revenue-drops.ts
src/inngest/functions/fetch-analytics.ts
src/lib/resend.ts
src/lib/analytics.ts
src/emails/license-expiry-warning.tsx
src/emails/revenue-drop-alert.tsx
src/app/api/alerts/route.ts
src/app/dashboard/alerts/page.tsx
```

### Revenue Drop Algorithm
Compare avg RPM last 7 days vs 30-day baseline. Alert if drop ≥ 25%.
Use `endDate = today - 2 days` (Analytics has 48–72h lag).

### Gotchas
- Alert deduplication: check for existing alert with same type created within 24h
- Resend from domain must be verified. Use `onboarding@resend.dev` for testing only
- Register `nightlyCheck` in `serve()` in `/api/inngest/route.ts`

---

## Stage 5: Dispute Assistant + Billing

### Files to Create
```
src/lib/stripe.ts
src/lib/dispute-generator.ts
src/lib/plan-gate.ts
src/app/api/stripe/checkout/route.ts
src/app/api/stripe/portal/route.ts
src/app/api/stripe/webhook/route.ts     # CRITICAL: raw body, no JSON middleware
src/app/dashboard/billing/page.tsx
src/app/dashboard/disputes/[videoId]/page.tsx
src/components/billing/pricing-table.tsx
src/components/billing/upgrade-gate.tsx
src/components/disputes/dispute-option-card.tsx
```

### Dispute Options (ranked)
1. Submit license proof (if valid license found) — confidence: high
2. Subscription license claim — confidence: medium
3. Fair use dispute — confidence: low

### Critical Webhook Gotcha
```typescript
// MUST read raw body before any parsing
const body = await req.text()
// JSON middleware silently breaks Stripe signature verification
```

---

## Known Gotchas / Lessons Learned

| Issue | Fix |
|---|---|
| `PrismaNeonHttp` "Transactions not supported" | Use `@prisma/adapter-pg` instead |
| Inngest v4 `createFunction` 3-arg error | Triggers go in config object, not 2nd arg |
| Google OAuth `redirect_uri_mismatch` | GCP redirect URI must be `.../api/auth/callback/google` |
| Google `access_denied` 403 | App in Testing mode — add email as test user in GCP OAuth consent |
| `next/image` hostname error | Add to `remotePatterns` in `next.config.mjs` |
| Inngest `PUT 400` + `ENETUNREACH` | Use active signing key + set `INNGEST_DEV=1` |
| `prisma migrate` connecting to localhost | `.env` must have direct (non-pooler) Neon URL |
| Google no `refresh_token` | Need `access_type: "offline"` + `prompt: "consent"` in auth config |
| YouTube quota burn | Use `playlistItems.list` (1 unit/50) not `search.list` (100 units/call) |
| Stripe webhook signature fail | Raw body ONLY — `req.text()` before any parsing |

---

## Vercel Deploy Checklist (When Ready)

- Use Vercel Neon integration → auto-provisions `DATABASE_URL`
- Use Vercel Inngest integration → auto-provisions `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY`
- Remove `INNGEST_DEV=1` from production env
- Function region: `iad1` (matches Neon `us-east-1`)
- Register Stripe webhook for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- `"vercel-build": "prisma generate && next build"` already in `package.json`
