-- Migration 005: Supabase Storage Buckets and Private Access Policies
-- TownSquare Control Platform

-- 1. Create Private Storage Buckets
-- Note: 'ts-incident-photos' and 'ts-maintenance-documents' are 100% PRIVATE.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'ts-incident-photos', 
        'ts-incident-photos', 
        false, 
        15728640, -- 15MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp']
    ),
    (
        'ts-maintenance-documents', 
        'ts-maintenance-documents', 
        false, 
        26214400, -- 25MB limit
        ARRAY['application/pdf', 'image/jpeg', 'image/png']
    )
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Policies for 'ts-incident-photos'
-- Internal staff can upload and view all incident photos
CREATE POLICY "Internal staff manage incident photos"
    ON storage.objects FOR ALL
    USING (
        bucket_id = 'ts-incident-photos' AND 
        public.is_internal_staff()
    );

-- Contractors can view photos belonging to incidents assigned to their provider
CREATE POLICY "Contractors view assigned incident photos"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'ts-incident-photos' AND 
        EXISTS (
            SELECT 1 FROM public.incident_attachments a
            JOIN public.incidents i ON a.incident_id = i.id
            WHERE a.storage_path = name
            AND i.assigned_provider_id IN (SELECT public.current_contractor_provider_ids())
        )
    );

-- Contractors can upload photos for incidents assigned to their provider
CREATE POLICY "Contractors upload photos for assigned incidents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'ts-incident-photos' AND
        auth.uid() IS NOT NULL AND
        (public.current_user_role() = 'contractor' OR public.is_internal_staff())
    );

-- 3. Storage Policies for 'ts-maintenance-documents'
CREATE POLICY "Internal staff manage maintenance documents"
    ON storage.objects FOR ALL
    USING (
        bucket_id = 'ts-maintenance-documents' AND 
        public.is_internal_staff()
    );

CREATE POLICY "Contractors view and upload maintenance documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'ts-maintenance-documents' AND
        (
            public.is_internal_staff() OR
            public.current_user_role() = 'contractor'
        )
    );

CREATE POLICY "Contractors insert maintenance documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'ts-maintenance-documents' AND
        (
            public.is_internal_staff() OR
            public.current_user_role() = 'contractor'
        )
    );
