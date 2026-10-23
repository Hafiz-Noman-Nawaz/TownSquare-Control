-- Migration 004: Row Level Security (RLS) Policies
-- TownSquare Control Platform

-- 1. Enable RLS on all 17 public tables
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_provider_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Helper Security Functions (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_contractor_provider_ids()
RETURNS SETOF UUID AS $$
    SELECT provider_id FROM public.provider_memberships 
    WHERE user_id = auth.uid() AND is_active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_internal_staff()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND is_active = true 
        AND role IN ('super_admin', 'control_room_operator', 'maintenance_manager')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Profiles Policies
CREATE POLICY "Super admins can manage all profiles"
    ON public.profiles FOR ALL
    USING (public.current_user_role() = 'super_admin');

CREATE POLICY "Internal staff can view active profiles"
    ON public.profiles FOR SELECT
    USING (public.is_internal_staff());

CREATE POLICY "Users can view and update their own profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update their own preferred language"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- 4. Organizational Tables (communities, zones, sites, categories)
CREATE POLICY "Super admins manage communities" ON public.communities FOR ALL USING (public.current_user_role() = 'super_admin');
CREATE POLICY "Authenticated users view communities" ON public.communities FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins manage zones" ON public.zones FOR ALL USING (public.current_user_role() = 'super_admin');
CREATE POLICY "Authenticated users view zones" ON public.zones FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins manage sites" ON public.sites FOR ALL USING (public.current_user_role() = 'super_admin');
CREATE POLICY "Authenticated users view sites" ON public.sites FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins manage categories" ON public.equipment_categories FOR ALL USING (public.current_user_role() = 'super_admin');
CREATE POLICY "Authenticated users view categories" ON public.equipment_categories FOR SELECT USING (auth.uid() IS NOT NULL);

-- 5. Service Providers & Memberships
CREATE POLICY "Super admins manage service providers" ON public.service_providers FOR ALL USING (public.current_user_role() = 'super_admin');
CREATE POLICY "Internal staff view service providers" ON public.service_providers FOR SELECT USING (public.is_internal_staff());
CREATE POLICY "Contractors view their own provider record" ON public.service_providers FOR SELECT USING (id IN (SELECT public.current_contractor_provider_ids()));

CREATE POLICY "Super admins manage provider memberships" ON public.provider_memberships FOR ALL USING (public.current_user_role() = 'super_admin');
CREATE POLICY "Internal staff view provider memberships" ON public.provider_memberships FOR SELECT USING (public.is_internal_staff());
CREATE POLICY "Contractors view their own memberships" ON public.provider_memberships FOR SELECT USING (user_id = auth.uid());

-- 6. Routing Configuration
CREATE POLICY "Super admins manage routing rules" ON public.category_provider_routing FOR ALL USING (public.current_user_role() = 'super_admin');
CREATE POLICY "Internal staff view routing rules" ON public.category_provider_routing FOR SELECT USING (public.is_internal_staff());

-- 7. Incidents
CREATE POLICY "Internal staff have full operational access to incidents"
    ON public.incidents FOR ALL
    USING (public.is_internal_staff())
    WITH CHECK (public.is_internal_staff());

CREATE POLICY "Contractors can view assigned incidents"
    ON public.incidents FOR SELECT
    USING (assigned_provider_id IN (SELECT public.current_contractor_provider_ids()));

CREATE POLICY "Contractors can update permitted status on assigned incidents"
    ON public.incidents FOR UPDATE
    USING (assigned_provider_id IN (SELECT public.current_contractor_provider_ids()))
    WITH CHECK (assigned_provider_id IN (SELECT public.current_contractor_provider_ids()));

-- 8. Incident Attachments
CREATE POLICY "Internal staff manage all attachments"
    ON public.incident_attachments FOR ALL
    USING (public.is_internal_staff());

CREATE POLICY "Contractors view attachments for assigned incidents"
    ON public.incident_attachments FOR SELECT
    USING (incident_id IN (
        SELECT id FROM public.incidents 
        WHERE assigned_provider_id IN (SELECT public.current_contractor_provider_ids())
    ));

CREATE POLICY "Contractors upload attachments for assigned incidents"
    ON public.incident_attachments FOR INSERT
    WITH CHECK (
        uploaded_by = auth.uid() AND
        incident_id IN (
            SELECT id FROM public.incidents 
            WHERE assigned_provider_id IN (SELECT public.current_contractor_provider_ids())
        )
    );

-- 9. Status History
CREATE POLICY "Internal staff view all status history"
    ON public.incident_status_history FOR SELECT
    USING (public.is_internal_staff());

CREATE POLICY "Internal staff insert status history"
    ON public.incident_status_history FOR INSERT
    WITH CHECK (public.is_internal_staff());

CREATE POLICY "Contractors view status history of assigned incidents"
    ON public.incident_status_history FOR SELECT
    USING (incident_id IN (
        SELECT id FROM public.incidents 
        WHERE assigned_provider_id IN (SELECT public.current_contractor_provider_ids())
    ));

CREATE POLICY "Contractors insert status history on assigned incidents"
    ON public.incident_status_history FOR INSERT
    WITH CHECK (
        changed_by = auth.uid() AND
        incident_id IN (
            SELECT id FROM public.incidents 
            WHERE assigned_provider_id IN (SELECT public.current_contractor_provider_ids())
        )
    );

-- 10. Comments (Visibility Enforced)
CREATE POLICY "Internal staff manage comments"
    ON public.incident_comments FOR ALL
    USING (public.is_internal_staff());

CREATE POLICY "Contractors view provider_visible comments on assigned incidents"
    ON public.incident_comments FOR SELECT
    USING (
        visibility = 'provider_visible' AND
        incident_id IN (
            SELECT id FROM public.incidents 
            WHERE assigned_provider_id IN (SELECT public.current_contractor_provider_ids())
        )
    );

CREATE POLICY "Contractors insert provider_visible comments on assigned incidents"
    ON public.incident_comments FOR INSERT
    WITH CHECK (
        author_id = auth.uid() AND
        visibility = 'provider_visible' AND
        incident_id IN (
            SELECT id FROM public.incidents 
            WHERE assigned_provider_id IN (SELECT public.current_contractor_provider_ids())
        )
    );

-- 11. Service Reports
CREATE POLICY "Internal staff view and manage all service reports"
    ON public.service_reports FOR ALL
    USING (public.is_internal_staff());

CREATE POLICY "Contractors view reports for their provider"
    ON public.service_reports FOR SELECT
    USING (provider_id IN (SELECT public.current_contractor_provider_ids()));

CREATE POLICY "Contractors submit reports for their assigned incidents"
    ON public.service_reports FOR INSERT
    WITH CHECK (
        submitted_by = auth.uid() AND
        provider_id IN (SELECT public.current_contractor_provider_ids()) AND
        incident_id IN (
            SELECT id FROM public.incidents 
            WHERE assigned_provider_id = provider_id
        )
    );

-- 12. Quotations
CREATE POLICY "Internal staff view and review quotations"
    ON public.quotations FOR ALL
    USING (public.is_internal_staff());

CREATE POLICY "Contractors view quotations for their provider"
    ON public.quotations FOR SELECT
    USING (provider_id IN (SELECT public.current_contractor_provider_ids()));

CREATE POLICY "Contractors submit quotations for assigned incidents"
    ON public.quotations FOR INSERT
    WITH CHECK (
        provider_id IN (SELECT public.current_contractor_provider_ids()) AND
        incident_id IN (
            SELECT id FROM public.incidents 
            WHERE assigned_provider_id = provider_id
        )
    );

-- 13. Purchase Orders
CREATE POLICY "Internal staff manage purchase orders"
    ON public.purchase_orders FOR ALL
    USING (public.is_internal_staff());

CREATE POLICY "Contractors view purchase orders for their assigned incidents"
    ON public.purchase_orders FOR SELECT
    USING (incident_id IN (
        SELECT id FROM public.incidents 
        WHERE assigned_provider_id IN (SELECT public.current_contractor_provider_ids())
    ));

-- 14. Notification Outbox (Strictly system/admin readable)
CREATE POLICY "Super admins view notification outbox"
    ON public.notification_outbox FOR SELECT
    USING (public.current_user_role() = 'super_admin');

-- 15. Audit Logs (Immutable and restricted to Super Admins)
CREATE POLICY "Super admins view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.current_user_role() = 'super_admin');
