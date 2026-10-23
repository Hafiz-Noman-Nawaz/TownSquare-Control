# Production Deployment & Operations Guide
## TownSquare Control — Security Operations & Incident Management Platform

---

## 1. Hosting Architecture & Prerequisites

- **Frontend & App Server:** Vercel (Next.js App Router)
- **Database & Storage:** Supabase (PostgreSQL 15+, Supabase Auth, Private Storage)
- **Email Service:** Resend (Transactional API + Signed Webhooks)
- **Monitoring & Telemetry:** Sentry (optional, configured with PII redaction)

---

## 2. Environment Variables Specification

The following variables must be configured in production environments. Never commit actual values to source control.

### Client / Server Environment (`client/.env.local` & Vercel Dashboard)
```env
# Public Supabase Config (Safe for browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...

# Server-Only Privileged Keys (NEVER expose to browser)
SUPABASE_SERVICE_ROLE_KEY=eyJh...

# Application Base URL
NEXT_PUBLIC_APP_URL=https://control.townsquare.ae

# Resend Transactional Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=notifications@control.townsquare.ae
RESEND_WEBHOOK_SECRET=whsec_...

# Security & Session Settings
NEXTAUTH_SECRET=super-secret-random-32-chars-minimum
NODE_ENV=production
```

### Worker Daemon Environment (`server/.env` or Hosted Background Service)
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=notifications@control.townsquare.ae
WORKER_POLL_INTERVAL_MS=5000
WORKER_BATCH_SIZE=10
WORKER_MAX_ATTEMPTS=5
```

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Supabase Setup
1. Create a new Supabase project in the target region (e.g. `me-central-1` or closest low-latency region).
2. Open the SQL Editor and apply the migrations in order from `server/migrations/` (or run `npm run migrate:up` from the `server` workspace).
3. Confirm all 17 tables and their RLS policies are active:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   ```
4. Create the two private storage buckets:
   - `ts-incident-photos` (Public: False, Allowed MIME: `image/jpeg`, `image/png`, `image/webp`, Max: 15MB)
   - `ts-maintenance-documents` (Public: False, Allowed MIME: `application/pdf`, `image/jpeg`, `image/png`, Max: 25MB)
5. Apply storage policies defined in `server/migrations/009_storage_policies.sql`.
6. Run the initial baseline seed:
   ```bash
   npm run seed:base --workspace=server
   ```

### Step 2: Bootstrap Initial Super Admin Account
1. Create an initial authenticated user via Supabase Auth CLI or script:
   ```bash
   npm run seed:admin --workspace=server
   ```
2. Verify in `profiles` table that the user has `role = 'super_admin'`.

### Step 3: Resend Email & Domain Verification
1. Add and verify your organizational sending domain (e.g., `control.townsquare.ae`) in Resend dashboard.
2. Configure SPF, DKIM, and DMARC DNS records.
3. Set up the inbound webhook pointing to `https://control.townsquare.ae/api/webhooks/resend` with events:
   - `email.sent`
   - `email.delivered`
   - `email.bounced`
   - `email.complained`
4. Copy the Webhook Signing Secret to `RESEND_WEBHOOK_SECRET`.

### Step 4: Deploy Next.js to Vercel
1. Link the repository to Vercel, pointing Root Directory to `client/`.
2. Configure environment variables in Project Settings.
3. Deploy! Verify custom domain SSL and security headers.

### Step 5: Notification Worker Deployment
The outbox processor can run as:
- Option A (Recommended): A dedicated Docker / Node container on Railway, Render, or a VM running `npm run worker` from `server/`.
- Option B: A scheduled Vercel Cron invoking `/api/cron/process-outbox` secured with a bearer token `CRON_SECRET`.

---

## 4. Disaster Recovery, Backups & SLA

- **Recovery Point Objective (RPO):** Maximum 1 hour of incident transactions (Supabase Point-in-Time Recovery enabled on Pro tier).
- **Recovery Time Objective (RTO):** Full application and database restoration within 2 hours.
- **Automated Daily Backups:** Retained for 30 days.
- **Rollback Procedure:** Every database migration is reversible via structured down scripts; Vercel provides instant one-click rollback to prior deployment commits.
