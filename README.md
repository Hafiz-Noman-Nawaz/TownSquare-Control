# TownSquare Control
## Security Operations & Incident Management Platform for Town Square

TownSquare Control is an internal security operations, equipment maintenance, and contractor management platform designed specifically for the Town Square community. It replaces manual spreadsheet tracking and unstructured email exchanges with a centralized, auditable, and role-enforced incident lifecycle.

---

## 1. Project Overview

- **Organization:** Town Square Community
- **Application Name:** TownSquare Control
- **Scope:** 4 Operational Zones (Zone 1, Zone 2, Zone 3, Zone 4) covering CCTV, NVRs, ANPR cameras, UPS units, physical barriers, and other security infrastructure.
- **Key Roles:**
  - **Super Admin:** Master system configuration, user accounts, contractor assignments, SLAs, audit logs, routing rules.
  - **Control-Room Operator:** Fast incident triage and reporting, photo upload, priority assessment, operational notes.
  - **Maintenance Manager:** Verification, contractor assignment/reassignment, quotation review, PO tracking, resolution sign-off.
  - **Service Provider / Contractor:** Isolated portal access strictly limited to assigned incidents, service report submission, quotation upload.

---

## 2. Monorepo Architecture & Folder Structure

```
TownSquare Control/
├── client/                     # Next.js App Router (Frontend + App API routes)
│   ├── public/                 # Static assets, PWA icons, manifest.json
│   ├── src/
│   │   ├── app/                # Next.js App Router routes (admin, operator, contractor, api)
│   │   ├── components/         # Reusable UI & operational components (shadcn/ui + custom)
│   │   │   ├── ui/             # Core atomic design system components
│   │   │   ├── layout/         # Shell, sidebar, header, navigation drawers
│   │   │   ├── incident/       # Reporting form, details view, timeline, status actions
│   │   │   ├── contractor/     # Contractor portal views, service reports, quotations
│   │   │   └── admin/          # Config tables, routing matrix, user management, metrics
│   │   ├── lib/                # Utilities, Supabase client/server helpers, validations
│   │   ├── locales/            # English (en) and Arabic (ar) translation dictionaries
│   │   └── styles/             # Tailwind CSS tokens and base styles
│   ├── package.json
│   └── tsconfig.json
│
├── server/                     # Backend engine, database tools & worker
│   ├── migrations/             # Versioned PostgreSQL SQL migrations
│   ├── seeds/                  # Baseline seed data (Town Square zones, categories, initial admin)
│   ├── worker/                 # Outbox notification processor (Resend email delivery engine)
│   ├── tests/                  # Database, RLS, security integration & unit tests
│   ├── package.json
│   └── tsconfig.json
│
├── ARCHITECTURE.md             # System architecture & trust boundaries
├── DATABASE.md                 # Full database schema, indexes, constraints, and RLS policies
├── SECURITY.md                 # Threat model, RLS matrix, and defense-in-depth controls
├── IMPLEMENTATION_PLAN.md      # Multi-phase engineering roadmap & progress checklist
├── DEPLOYMENT.md               # Production deployment guide (Vercel + Supabase + Resend)
└── README.md                   # This file
```

---

## 3. Technology Stack

- **Frontend & Web Framework:** Next.js 14+ (App Router), React 18/19, TypeScript (strict mode), Tailwind CSS, shadcn/ui
- **Icons & Data Visualization:** Lucide Icons, Recharts, TanStack Table v8
- **Form Management & Validation:** React Hook Form + Zod
- **Database & Storage:** Supabase PostgreSQL with Row Level Security (RLS), Supabase Auth, Supabase Private Storage Buckets
- **Email Delivery:** Resend transactional email API with React Email templates and signed webhooks
- **Bilingual & Localization:** Full English (`en` - LTR) and Arabic (`ar` - RTL) support with Noto Sans Arabic typography
- **PWA:** Installable web application with strict network-first caching for operational security
- **Testing:** Vitest, Playwright, automated RLS policy validation

---

## 4. Getting Started

### Prerequisites
- Node.js >= 20.0.0 (Tested on Node v24)
- npm >= 10.0.0
- Supabase Project (PostgreSQL database, Auth, and Storage)
- Resend Account & API key (for production transactional notifications)

### Environment Configuration
1. Copy `.env.example` in `client/` to `client/.env.local`
2. Fill in your Supabase URL, Anon Key, Service Role Key (server-only), and Resend API key.

```bash
# Install dependencies across all workspaces
npm run install:all

# Run the development server
npm run dev

# Run the background notification worker
npm run worker:dev

# Run automated tests
npm run test
```

---

## 5. Security & Operational Policy

- **Fail-Closed Authorization:** PostgreSQL Row-Level Security (RLS) is enabled on all tables. Ordinary users and contractors cannot query data outside their explicit scope even if client-side controls are bypassed.
- **Private Attachments:** Incident photos and contractor quotations are stored in private Supabase Storage buckets, accessible solely via short-lived authenticated URLs.
- **No Client Secrets:** Service-role keys and email API tokens are strictly server-side and never exposed to the browser.
