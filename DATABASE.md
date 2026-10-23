# Database Schema & Data Integrity
## TownSquare Control — PostgreSQL & Supabase Database Architecture

---

## 1. Schema Conventions & Design Principles

- **Primary Keys:** UUID v4 (`gen_random_uuid()`) for entities requiring non-enumerable IDs; integer IDs where sequential identification is strictly internal.
- **Timestamps:** All tables include `created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL` and `updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL`.
- **Concurrency Control:** Critical operational tables (`incidents`, `quotations`) include a `version INT DEFAULT 1 NOT NULL` column to prevent lost updates via optimistic concurrency control.
- **Monetary Storage:** Currency amounts are stored as `NUMERIC(12, 2)` (never floating point).
- **Row-Level Security:** RLS is enabled on all tables without exception. Default is fail-closed.
- **No Cascading Hard Deletes:** `ON DELETE RESTRICT` or soft-deactivation (`is_active = false`) is used for all operational, financial, and incident audit records.

---

## 2. Table Specifications

### 2.1 `profiles`
Maps 1:1 with `auth.users`.
- `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT`
- `full_name TEXT NOT NULL`
- `email TEXT NOT NULL`
- `role TEXT NOT NULL CHECK (role IN ('super_admin', 'control_room_operator', 'maintenance_manager', 'contractor'))`
- `is_active BOOLEAN NOT NULL DEFAULT true`
- `preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'ar'))`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`

### 2.2 `communities`
Initial record: Town Square.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `name TEXT NOT NULL UNIQUE`
- `slug TEXT NOT NULL UNIQUE`
- `is_active BOOLEAN NOT NULL DEFAULT true`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`

### 2.3 `zones`
Initial records: Zone 1, Zone 2, Zone 3, Zone 4.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `community_id UUID NOT NULL REFERENCES communities(id) ON DELETE RESTRICT`
- `zone_code TEXT NOT NULL`
- `name TEXT NOT NULL`
- `is_active BOOLEAN NOT NULL DEFAULT true`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `UNIQUE(community_id, zone_code)`

### 2.4 `sites`
Specific buildings, levels, or sub-locations within a zone.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `community_id UUID NOT NULL REFERENCES communities(id) ON DELETE RESTRICT`
- `zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE RESTRICT`
- `site_name TEXT NOT NULL`
- `location_code TEXT`
- `building_or_level TEXT`
- `is_active BOOLEAN NOT NULL DEFAULT true`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`

### 2.5 `equipment_categories`
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `category_name TEXT NOT NULL`
- `category_code TEXT NOT NULL UNIQUE`
- `description TEXT`
- `requires_camera_number BOOLEAN NOT NULL DEFAULT false`
- `is_active BOOLEAN NOT NULL DEFAULT true`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`

### 2.6 `service_providers`
Contractor companies assigned to incidents.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `provider_name TEXT NOT NULL UNIQUE`
- `provider_code TEXT NOT NULL UNIQUE`
- `primary_contact_name TEXT NOT NULL`
- `notification_email TEXT NOT NULL`
- `is_active BOOLEAN NOT NULL DEFAULT true`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`

### 2.7 `provider_memberships`
Links contractor users to their service provider company.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE RESTRICT`
- `user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT`
- `is_active BOOLEAN NOT NULL DEFAULT true`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `UNIQUE(provider_id, user_id)`

### 2.8 `category_provider_routing`
Automated routing rules mapping equipment category and zone to a provider.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `zone_id UUID REFERENCES zones(id) ON DELETE CASCADE` -- Nullable for global rule
- `category_id UUID NOT NULL REFERENCES equipment_categories(id) ON DELETE CASCADE`
- `provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE RESTRICT`
- `priority INT NOT NULL DEFAULT 1`
- `is_active BOOLEAN NOT NULL DEFAULT true`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`

### 2.9 `incidents`
Central operational incident record.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `ticket_number TEXT NOT NULL UNIQUE` -- Format: TS-YYYYMMDD-XXXX
- `community_id UUID NOT NULL REFERENCES communities(id) ON DELETE RESTRICT`
- `zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE RESTRICT`
- `site_id UUID REFERENCES sites(id) ON DELETE RESTRICT`
- `category_id UUID NOT NULL REFERENCES equipment_categories(id) ON DELETE RESTRICT`
- `camera_number TEXT`
- `exact_location TEXT NOT NULL`
- `priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high'))`
- `description TEXT NOT NULL`
- `status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending', 'resolved'))`
- `reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT`
- `assigned_provider_id UUID REFERENCES service_providers(id) ON DELETE RESTRICT`
- `reported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `resolved_at TIMESTAMPTZ`
- `resolution_summary TEXT`
- `version INT NOT NULL DEFAULT 1`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`

### 2.10 `incident_attachments`
Private incident photos and supporting files.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE`
- `uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT`
- `storage_path TEXT NOT NULL`
- `original_filename TEXT NOT NULL`
- `verified_content_type TEXT NOT NULL`
- `file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 15728640)` -- 15MB limit
- `attachment_type TEXT NOT NULL DEFAULT 'photo' CHECK (attachment_type IN ('photo', 'report_doc', 'quotation_doc', 'po_doc'))`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`

### 2.11 `incident_status_history`
Append-only log of every status transition.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE`
- `previous_status TEXT CHECK (previous_status IN ('open', 'in_progress', 'pending', 'resolved'))`
- `new_status TEXT NOT NULL CHECK (new_status IN ('open', 'in_progress', 'pending', 'resolved'))`
- `changed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT`
- `change_reason TEXT`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`

### 2.12 `incident_comments`
Operational discussions with strict visibility controls.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE`
- `author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT`
- `comment_body TEXT NOT NULL`
- `visibility TEXT NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal', 'provider_visible'))`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`

### 2.13 `service_reports`
Formal work logs submitted by contractors.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE RESTRICT`
- `provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE RESTRICT`
- `submitted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT`
- `report_reference TEXT`
- `findings TEXT NOT NULL`
- `work_performed TEXT NOT NULL`
- `recommended_action TEXT`
- `completion_status TEXT NOT NULL CHECK (completion_status IN ('work_completed', 'parts_required', 'further_investigation'))`
- `submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`

### 2.14 `quotations`
Financial estimates for repairs or replacement parts.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE RESTRICT`
- `provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE RESTRICT`
- `quotation_reference TEXT NOT NULL`
- `amount NUMERIC(12, 2) CHECK (amount >= 0)`
- `currency TEXT NOT NULL DEFAULT 'AED'`
- `status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'superseded'))`
- `quotation_document_path TEXT`
- `submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `reviewed_by UUID REFERENCES profiles(id) ON DELETE RESTRICT`
- `reviewed_at TIMESTAMPTZ`
- `review_notes TEXT`
- `version INT NOT NULL DEFAULT 1`

### 2.15 `purchase_orders`
Approved POs linked to maintenance incidents.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE RESTRICT`
- `purchase_order_number TEXT NOT NULL UNIQUE`
- `amount NUMERIC(12, 2) CHECK (amount >= 0)`
- `currency TEXT NOT NULL DEFAULT 'AED'`
- `issue_date DATE`
- `status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'fulfilled', 'cancelled'))`
- `document_path TEXT`
- `created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`

### 2.16 `notification_outbox`
Transactional queue for contractor dispatch emails.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE`
- `event_type TEXT NOT NULL CHECK (event_type IN ('incident_assigned', 'incident_reassigned', 'incident_status_changed', 'service_report_submitted', 'quotation_submitted'))`
- `recipient_provider_id UUID REFERENCES service_providers(id) ON DELETE SET NULL`
- `recipient_email_snapshot TEXT NOT NULL`
- `payload JSONB NOT NULL`
- `idempotency_key TEXT NOT NULL UNIQUE`
- `status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'failed', 'cancelled'))`
- `attempts INT NOT NULL DEFAULT 0`
- `next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `locked_at TIMESTAMPTZ`
- `last_error_code TEXT`
- `last_error_message TEXT`
- `provider_message_id TEXT`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `sent_at TIMESTAMPTZ`

### 2.17 `audit_logs`
Immutable record of system security and business mutations.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL`
- `action TEXT NOT NULL`
- `entity_type TEXT NOT NULL`
- `entity_id TEXT NOT NULL`
- `timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `request_id TEXT`
- `ip_address TEXT`
- `metadata JSONB`
- `before_state JSONB`
- `after_state JSONB`

---

## 3. High-Performance Indexing Strategy

```sql
-- Operational queries
CREATE INDEX idx_incidents_status_priority ON incidents(status, priority);
CREATE INDEX idx_incidents_zone_id ON incidents(zone_id);
CREATE INDEX idx_incidents_assigned_provider ON incidents(assigned_provider_id);
CREATE INDEX idx_incidents_reported_at ON incidents(reported_at DESC);
CREATE INDEX idx_incidents_reporter_id ON incidents(reporter_id);

-- Outbox worker indexing
CREATE INDEX idx_notification_outbox_queue ON notification_outbox(status, next_attempt_at) 
WHERE status IN ('queued', 'failed');

-- Audit logs indexing
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Provider lookup
CREATE INDEX idx_provider_memberships_user ON provider_memberships(user_id) WHERE is_active = true;
CREATE INDEX idx_comments_incident_visibility ON incident_comments(incident_id, visibility);
```
