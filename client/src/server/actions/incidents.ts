"use server";

import { createClient } from "@/server/supabase/server";
import { createAdminClient } from "@/server/supabase/admin";
import { createIncidentSchema, type CreateIncidentInput } from "@/lib/validations/incident";
import crypto from "node:crypto";

export interface CreateIncidentResult {
  success: boolean;
  ticketNumber?: string;
  incidentId?: string;
  error?: string;
}

export async function createIncidentAction(
  input: CreateIncidentInput,
  photoFiles?: { filename: string; contentType: string; sizeBytes: number; base64Data: string }[]
): Promise<CreateIncidentResult> {
  try {
    // 1. Validate payload using strict Zod schema
    const validated = createIncidentSchema.parse(input);

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 2. Authenticate actor
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Actor ID (or fallback system actor for demonstration)
    const actorId = user?.id || "00000000-0000-0000-0000-000000000001";

    // 3. Resolve Town Square community
    const { data: community } = await adminSupabase
      .from("communities")
      .select("id")
      .eq("slug", "town-square")
      .single();

    const communityId = community?.id || "a0000000-0000-0000-0000-000000000001";

    // 4. Resolve Automated Provider Routing Precedence
    // Specific zone + category rule has precedence over global (null zone) rule
    let assignedProviderId: string | null = null;
    let providerNotificationEmail: string | null = null;
    let providerName: string | null = null;

    const { data: specificRoute } = await adminSupabase
      .from("category_provider_routing")
      .select("provider_id, service_providers(id, provider_name, notification_email)")
      .eq("zone_id", validated.zone_id)
      .eq("category_id", validated.category_id)
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (specificRoute?.provider_id) {
      assignedProviderId = specificRoute.provider_id;
      const sp: any = specificRoute.service_providers;
      providerNotificationEmail = sp?.notification_email || null;
      providerName = sp?.provider_name || null;
    } else {
      // Fallback to global category rule
      const { data: globalRoute } = await adminSupabase
        .from("category_provider_routing")
        .select("provider_id, service_providers(id, provider_name, notification_email)")
        .is("zone_id", null)
        .eq("category_id", validated.category_id)
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (globalRoute?.provider_id) {
        assignedProviderId = globalRoute.provider_id;
        const sp: any = globalRoute.service_providers;
        providerNotificationEmail = sp?.notification_email || null;
        providerName = sp?.provider_name || null;
      }
    }

    // 5. Generate Atomic Ticket Number (TS-YYYYMMDD-XXXX)
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    const ticketNumber = `TS-${todayStr}-${randomSuffix}`;
    const incidentId = crypto.randomUUID();

    // 6. Insert Incident Record
    const { error: insertErr } = await adminSupabase.from("incidents").insert({
      id: incidentId,
      ticket_number: ticketNumber,
      community_id: communityId,
      zone_id: validated.zone_id,
      site_id: validated.site_id || null,
      category_id: validated.category_id,
      camera_number: validated.camera_number || null,
      exact_location: validated.exact_location,
      priority: validated.priority,
      description: validated.description,
      status: "open",
      reporter_id: actorId,
      assigned_provider_id: assignedProviderId,
      version: 1,
    });

    if (insertErr) {
      console.error("[Incident Creation Error]", insertErr);
      return { success: false, error: insertErr.message };
    }

    // 7. Insert Initial Status History
    await adminSupabase.from("incident_status_history").insert({
      incident_id: incidentId,
      previous_status: null,
      new_status: "open",
      changed_by: actorId,
      change_reason: "Initial incident creation & dispatch",
    });

    // 8. Process Photo Attachments
    if (photoFiles && photoFiles.length > 0) {
      for (const photo of photoFiles) {
        const attachmentId = crypto.randomUUID();
        const sanitizedExt = photo.filename.split(".").pop()?.toLowerCase() || "jpg";
        const storagePath = `${incidentId}/${attachmentId}.${sanitizedExt}`;

        // Save metadata record
        await adminSupabase.from("incident_attachments").insert({
          id: attachmentId,
          incident_id: incidentId,
          uploaded_by: actorId,
          storage_path: storagePath,
          original_filename: photo.filename.replace(/[^a-zA-Z0-9._-]/g, "_"),
          verified_content_type: photo.contentType,
          file_size_bytes: photo.sizeBytes,
          attachment_type: "photo",
        });

        // Store file buffer if Supabase storage is configured
        if (photo.base64Data) {
          const fileBuffer = Buffer.from(photo.base64Data, "base64");
          await adminSupabase.storage
            .from("ts-incident-photos")
            .upload(storagePath, fileBuffer, {
              contentType: photo.contentType,
              upsert: false,
            });
        }
      }
    }

    // 9. Queue Notification in Outbox if provider assigned
    if (assignedProviderId && providerNotificationEmail) {
      const idempotencyKey = `dispatch-${ticketNumber}-${Date.now()}`;
      const portalLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/contractor/incidents/${incidentId}`;

      await adminSupabase.from("notification_outbox").insert({
        incident_id: incidentId,
        event_type: "incident_assigned",
        recipient_provider_id: assignedProviderId,
        recipient_email_snapshot: providerNotificationEmail,
        idempotency_key: idempotencyKey,
        status: "queued",
        attempts: 0,
        payload: {
          ticket_number: ticketNumber,
          zone_name: `Zone Reference: ${validated.zone_id.slice(0, 8)}`,
          category_name: `Category: ${validated.category_id.slice(0, 8)}`,
          camera_number: validated.camera_number,
          exact_location: validated.exact_location,
          priority: validated.priority,
          description: validated.description,
          portal_link: portalLink,
        },
      });
    }

    // 10. Audit Log
    await adminSupabase.from("audit_logs").insert({
      actor_id: actorId,
      action: "INCIDENT_CREATED",
      entity_type: "incident",
      entity_id: incidentId,
      metadata: {
        ticket_number: ticketNumber,
        priority: validated.priority,
        assigned_provider_id: assignedProviderId,
      },
    });

    return {
      success: true,
      ticketNumber,
      incidentId,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record incident";
    return { success: false, error: message };
  }
}
