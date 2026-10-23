-- Migration 003: High-Performance Database Indexes
-- TownSquare Control Platform

-- 1. Incident Search, Filtering, and Operational Queries
CREATE INDEX IF NOT EXISTS idx_incidents_status_priority ON public.incidents(status, priority);
CREATE INDEX IF NOT EXISTS idx_incidents_zone_id ON public.incidents(zone_id);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_provider ON public.incidents(assigned_provider_id);
CREATE INDEX IF NOT EXISTS idx_incidents_reported_at ON public.incidents(reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_reporter_id ON public.incidents(reporter_id);
CREATE INDEX IF NOT EXISTS idx_incidents_category_id ON public.incidents(category_id);
CREATE INDEX IF NOT EXISTS idx_incidents_ticket_number ON public.incidents(ticket_number);

-- 2. Notification Outbox Worker Indexing
CREATE INDEX IF NOT EXISTS idx_outbox_queue_processing 
ON public.notification_outbox(status, next_attempt_at) 
WHERE status IN ('queued', 'failed');

-- 3. Audit Logs Fast Querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- 4. Provider Membership Lookups
CREATE INDEX IF NOT EXISTS idx_provider_memberships_user ON public.provider_memberships(user_id) 
WHERE is_active = true;

-- 5. Comments Visibility Filtering
CREATE INDEX IF NOT EXISTS idx_comments_incident_visibility ON public.incident_comments(incident_id, visibility);

-- 6. Attachments Lookup
CREATE INDEX IF NOT EXISTS idx_attachments_incident_id ON public.incident_attachments(incident_id);

-- 7. Service Reports and Quotations Lookup
CREATE INDEX IF NOT EXISTS idx_service_reports_incident ON public.service_reports(incident_id);
CREATE INDEX IF NOT EXISTS idx_quotations_incident ON public.quotations(incident_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_incident ON public.purchase_orders(incident_id);
