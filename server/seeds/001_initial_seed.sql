-- Seed 001: Town Square Initial Organizational Data
-- TownSquare Control Platform

-- 1. Insert Town Square Community
INSERT INTO public.communities (id, name, slug, is_active)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Town Square', 'town-square', true)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert 4 Configurable Zones
INSERT INTO public.zones (id, community_id, zone_code, name, is_active)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'ZONE-1', 'Zone 1 - Main Boulevard & Retail', true),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'ZONE-2', 'Zone 2 - Central Park & Recreation', true),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'ZONE-3', 'Zone 3 - Residential North (Zahra/Hayat)', true),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'ZONE-4', 'Zone 4 - Residential South (Noor/Rawda)', true)
ON CONFLICT (community_id, zone_code) DO NOTHING;

-- 3. Insert Common Sites/Locations
INSERT INTO public.sites (id, community_id, zone_id, site_name, location_code, building_or_level, is_active)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Main Entry Gatehouse A', 'GATE-A', 'Ground Level', true),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Retail Plaza IDF Room 1', 'IDF-RP-01', 'Basement Level B1', true),
    ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Central Park Pavilion', 'CP-PAV', 'Ground Level', true),
    ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Zahra Substation Perimeter', 'ZH-SUB-01', 'Outdoor Perimeter', true),
    ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'Noor Entry Barrier 2', 'BARRIER-N2', 'Ground Level', true)
ON CONFLICT DO NOTHING;

-- 4. Insert Standard Equipment Categories
INSERT INTO public.equipment_categories (id, category_name, category_code, description, requires_camera_number, is_active)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'CCTV Camera', 'CCTV', 'Fixed or PTZ surveillance cameras across community zones', true, true),
    ('d0000000-0000-0000-0000-000000000002', 'NVR Issue', 'NVR', 'Network Video Recorders, RAID storage, and storage matrix issues', false, true),
    ('d0000000-0000-0000-0000-000000000003', 'ANPR Issue', 'ANPR', 'Automatic Number Plate Recognition cameras and optical readers', true, true),
    ('d0000000-0000-0000-0000-000000000004', 'UPS', 'UPS', 'Uninterruptible Power Supply systems in IDF/MDF server rooms', false, true),
    ('d0000000-0000-0000-0000-000000000005', 'Barrier', 'BARRIER', 'Vehicle access control boom barriers and RFID card readers', false, true),
    ('d0000000-0000-0000-0000-000000000006', 'Other Security Equipment', 'OTHER', 'Emergency intercoms, panic buttons, and perimeter lighting', false, true)
ON CONFLICT (category_code) DO NOTHING;

-- 5. Insert Baseline Service Providers (Contractors)
INSERT INTO public.service_providers (id, provider_name, provider_code, primary_contact_name, notification_email, is_active)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'Apex CCTV & Surveillance Solutions', 'APEX-SURV', 'Tariq Mansoor', 'cctv-dispatch@apexsurv.demo', true),
    ('e0000000-0000-0000-0000-000000000002', 'SecureGate Automation & Barriers', 'SEC-GATE', 'Khalid Al-Nuaimi', 'support@securegate.demo', true),
    ('e0000000-0000-0000-0000-000000000003', 'ElectroPower Critical Systems (UPS/Power)', 'ELECTRO-PWR', 'Sarah Jenkins', 'dispatch@electropwr.demo', true)
ON CONFLICT (provider_code) DO NOTHING;

-- 6. Insert Category Routing Rules
INSERT INTO public.category_provider_routing (id, zone_id, category_id, provider_id, priority, is_active)
VALUES
    -- CCTV routed to Apex Surveillance
    ('f0000000-0000-0000-0000-000000000001', NULL, 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 1, true),
    -- NVR routed to Apex Surveillance
    ('f0000000-0000-0000-0000-000000000002', NULL, 'd0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 1, true),
    -- ANPR routed to Apex Surveillance
    ('f0000000-0000-0000-0000-000000000003', NULL, 'd0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 1, true),
    -- Barrier routed to SecureGate
    ('f0000000-0000-0000-0000-000000000004', NULL, 'd0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000002', 1, true),
    -- UPS routed to ElectroPower
    ('f0000000-0000-0000-0000-000000000005', NULL, 'd0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000003', 1, true)
ON CONFLICT DO NOTHING;
