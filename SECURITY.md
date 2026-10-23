# Security Architecture & Threat Model
## TownSquare Control — Security Implementation & Defense-in-Depth

---

## 1. Threat Model & Mitigations

| Threat | Target | Mitigation Strategy |
| :--- | :--- | :--- |
| **Cross-Provider Incident Snooping (IDOR)** | Incidents, Photos, Reports | PostgreSQL RLS strictly limits contractor SELECT and UPDATE to incidents where `assigned_provider_id` matches the user's active `provider_memberships`. All API routes re-verify server-side. |
| **Internal Comment Leakage** | `incident_comments` | RLS policy explicitly filters comments with `visibility = 'internal'` out of contractor queries (`role != 'contractor' OR visibility = 'provider_visible'`). |
| **Privilege Escalation** | `profiles.role` | Profiles table allows UPDATE only to users with role `'super_admin'`. RLS blocks self-promotion. Trigger prevents removing the last super admin. |
| **Malicious File Uploads** | Storage buckets | Magic bytes and MIME verification on the server. Non-executable filenames using UUIDs. Restricted content-types (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`). Max size 15MB. |
| **Public Attachment Exposure** | Storage URLs | Buckets are 100% private. Signed URLs expire in 15 minutes. No static public URLs generated. |
| **CSV Formula Injection** | Admin Exports | Any exported text cell starting with `=`, `+`, `-`, `@`, `\t`, or `\r` is prepended with a single quote (`'`) to neutralize Excel calculation execution. |
| **Email Bombing / Queue DoS** | Resend API / Outbox | Duplicate-submission protection with client idempotency tokens. Max retry cap (5 attempts) with exponential backoff and jitter. Strict input rate limiting. |
| **Webhook Forgery** | `/api/webhooks/resend` | HMAC cryptographic signature validation using Resend webhook secret (`svix` / `resend-signature`). |
| **Mass Assignment** | Incident / User APIs | Strict Zod schemas with `.strip()` or explicit keys. Role, status, and assignment cannot be injected through public payloads. |
| **Brute Force / Credential Stuffing** | Supabase Auth | Rate limiting, generic error responses without user enumeration, and optional MFA for administrators. |

---

## 2. Row-Level Security (RLS) Matrix

| Table | Super Admin | Control Room Operator | Maintenance Manager | Contractor |
| :--- | :--- | :--- | :--- | :--- |
| **profiles** | SELECT, INSERT, UPDATE, DELETE (cannot delete last admin) | SELECT self + internal staff | SELECT self + internal staff + contractors | SELECT self only |
| **communities** | ALL | SELECT only | SELECT only | SELECT (Town Square) |
| **zones** | ALL | SELECT only | SELECT only | SELECT (Town Square zones) |
| **sites** | ALL | SELECT only | SELECT only | SELECT assigned incident sites |
| **equipment_categories** | ALL | SELECT only | SELECT only | SELECT only |
| **service_providers** | ALL | SELECT only | SELECT only | SELECT own provider record |
| **provider_memberships** | ALL | NONE | SELECT only | SELECT own membership |
| **category_provider_routing** | ALL | SELECT only | SELECT only | NONE |
| **incidents** | ALL | INSERT, SELECT, UPDATE operational fields | ALL (assign, status, resolution) | SELECT assigned only; UPDATE status (limited) |
| **incident_attachments** | ALL | INSERT, SELECT authorized | ALL | SELECT & INSERT on assigned incidents |
| **incident_status_history** | ALL (append-only) | SELECT authorized; INSERT on status change | SELECT; INSERT on status change | SELECT assigned; INSERT permitted transition |
| **incident_comments** | ALL | ALL (internal + provider) | ALL | SELECT `visibility = 'provider_visible'`, INSERT `visibility = 'provider_visible'` |
| **service_reports** | ALL | SELECT authorized | ALL | INSERT, UPDATE, SELECT on assigned incidents |
| **quotations** | ALL | SELECT authorized | SELECT, UPDATE (review/approval) | INSERT, SELECT, UPDATE own quotation before review |
| **purchase_orders** | ALL | SELECT authorized | ALL | SELECT POs issued to own provider |
| **notification_outbox** | ALL (read-only for audit) | NONE | NONE | NONE (Processed by background service role) |
| **audit_logs** | SELECT only (immutable) | NONE | NONE | NONE |

---

## 3. Cryptographic & Storage Security Controls

### Private Supabase Buckets
Two dedicated private buckets:
1. `ts-incident-photos` (restricted to images: JPEG, PNG, WEBP; max 15MB)
2. `ts-maintenance-documents` (PDF, JPEG, PNG for service reports, quotations, and POs; max 25MB)

Storage policies restrict upload and download to users authorized on the referenced incident.

### Sanitization & Content Verification
- Server-side inspection of magic numbers (e.g. `0xFF, 0xD8, 0xFF` for JPEG; `0x89, 0x50, 0x4E, 0x47` for PNG; `%PDF` for PDF).
- File paths generated strictly server-side: `{incident_id}/{uuid}-{sanitized_basename}`.

---

## 4. Initial Administrator Bootstrap Procedure

1. Deploy database migrations to Supabase.
2. Run the secure bootstrap script:
   ```bash
   npm run seed:admin --workspace=server
   ```
   Or invoke the CLI setup tool which generates an administrative invitation link with a cryptographically secure token.
3. The first created user is assigned `role = 'super_admin'`.
4. Deactivate or lock down any initial bootstrapping keys once the primary administrator account is established.
