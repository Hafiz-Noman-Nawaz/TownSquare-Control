import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Town Square Security <notifications@townsquare.ae>";
const POLL_INTERVAL_MS = parseInt(process.env.WORKER_POLL_INTERVAL_MS || "5000", 10);
const MAX_ATTEMPTS = parseInt(process.env.WORKER_MAX_ATTEMPTS || "5", 10);

export interface OutboxItem {
  id: string;
  incident_id: string;
  event_type: string;
  recipient_provider_id: string | null;
  recipient_email_snapshot: string;
  payload: {
    ticket_number: string;
    zone_name: string;
    category_name: string;
    camera_number?: string;
    exact_location: string;
    priority: string;
    description: string;
    portal_link: string;
  };
  idempotency_key: string;
  status: "queued" | "processing" | "sent" | "failed" | "cancelled";
  attempts: number;
  next_attempt_at: string;
}

let isRunning = true;

export function calculateBackoffMs(attempt: number): number {
  // Exponential backoff: 2^attempt * 1000ms + random jitter up to 1000ms
  const baseDelay = Math.pow(2, Math.min(attempt, 6)) * 1000;
  const jitter = Math.floor(Math.random() * 1000);
  return baseDelay + jitter;
}

export function buildNotificationEmailHtml(payload: OutboxItem["payload"], language: "en" | "ar" = "en"): { subject: string; html: string; text: string } {
  const isArabic = language === "ar";
  const priorityColor = payload.priority === "high" ? "#EF4444" : payload.priority === "medium" ? "#F59E0B" : "#10B981";

  const subject = isArabic
    ? `[تاون سكوير] بلاغ عطل أمني جديد: ${payload.ticket_number} (${payload.priority.toUpperCase()})`
    : `[Town Square Control] Security Incident Dispatch: ${payload.ticket_number} (${payload.priority.toUpperCase()})`;

  const html = `
    <!DOCTYPE html>
    <html dir="${isArabic ? "rtl" : "ltr"}" lang="${language}">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
        .card { background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 8px; border: 1px solid #cbd5e1; overflow: hidden; }
        .header { background-color: #0B132B; color: #ffffff; padding: 20px 24px; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; color: #ffffff; background-color: ${priorityColor}; }
        .content { padding: 24px; }
        .row { margin-bottom: 12px; }
        .label { font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase; margin-bottom: 2px; }
        .value { font-size: 15px; color: #0f172a; }
        .cta { display: inline-block; margin-top: 20px; background-color: #2563EB; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; }
        .footer { padding: 16px 24px; background-color: #f8fafc; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2 style="margin: 0; font-size: 20px;">TOWN SQUARE CONTROL</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #93c5fd;">Security Operations & Incident Dispatch</p>
        </div>
        <div class="content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="margin: 0; font-size: 18px;">Ticket: ${payload.ticket_number}</h3>
            <span class="badge">${payload.priority.toUpperCase()} PRIORITY</span>
          </div>

          <div class="row">
            <div class="label">Operational Zone</div>
            <div class="value">${payload.zone_name}</div>
          </div>

          <div class="row">
            <div class="label">Category / Asset</div>
            <div class="value">${payload.category_name} ${payload.camera_number ? `(Camera: ${payload.camera_number})` : ""}</div>
          </div>

          <div class="row">
            <div class="label">Exact Location</div>
            <div class="value">${payload.exact_location}</div>
          </div>

          <div class="row">
            <div class="label">Fault Description</div>
            <div class="value" style="background-color: #f8fafc; padding: 12px; border-radius: 4px; border: 1px solid #e2e8f0;">
              ${payload.description}
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${payload.portal_link}" class="cta">
              ${isArabic ? "فتح البوابة لتقديم التقرير" : "Access Incident & Submit Report"}
            </a>
          </div>
        </div>
        <div class="footer">
          Town Square Security Operations Center &bull; Automated Dispatch Notification &bull; Confidential
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
TOWN SQUARE CONTROL - INCIDENT DISPATCH
Ticket: ${payload.ticket_number}
Priority: ${payload.priority.toUpperCase()}
Zone: ${payload.zone_name}
Category: ${payload.category_name}
Location: ${payload.exact_location}
Description: ${payload.description}

Access ticket in contractor portal: ${payload.portal_link}
  `.trim();

  return { subject, html, text };
}

export async function processOutboxBatch() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[Worker] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured. Skipping worker poll.");
    return { processed: 0, failed: 0 };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

  // 1. Claim queued items using optimistic locking
  const nowUtc = new Date().toISOString();
  const { data: queueItems, error: fetchErr } = await supabase
    .from("notification_outbox")
    .select("*")
    .in("status", ["queued", "failed"])
    .lte("next_attempt_at", nowUtc)
    .lt("attempts", MAX_ATTEMPTS)
    .limit(10);

  if (fetchErr) {
    console.error("[Worker] Error polling outbox queue:", fetchErr);
    return { processed: 0, failed: 0 };
  }

  if (!queueItems || queueItems.length === 0) {
    return { processed: 0, failed: 0 };
  }

  let processedCount = 0;
  let failedCount = 0;

  for (const item of queueItems as OutboxItem[]) {
    // 2. Mark as processing
    const { error: lockErr } = await supabase
      .from("notification_outbox")
      .update({
        status: "processing",
        locked_at: new Date().toISOString(),
      })
      .eq("id", item.id)
      .eq("status", item.status);

    if (lockErr) {
      // Row was locked or modified by another worker instance
      continue;
    }

    try {
      const emailContent = buildNotificationEmailHtml(item.payload);

      let providerMsgId = `mock-msg-${Date.now()}`;

      if (resend) {
        const sendResult = await resend.emails.send({
          from: RESEND_FROM_EMAIL,
          to: item.recipient_email_snapshot,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          headers: {
            "X-Idempotency-Key": item.idempotency_key,
            "X-Ticket-Number": item.payload.ticket_number,
          },
        });

        if (sendResult.error) {
          throw new Error(sendResult.error.message);
        }
        providerMsgId = sendResult.data?.id || providerMsgId;
      } else {
        console.log(`[Worker - Simulated Resend] Sent email to ${item.recipient_email_snapshot} for Ticket ${item.payload.ticket_number}`);
      }

      // Mark sent successfully
      await supabase
        .from("notification_outbox")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          provider_message_id: providerMsgId,
          last_error_code: null,
          last_error_message: null,
        })
        .eq("id", item.id);

      processedCount++;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const nextAttemptNumber = item.attempts + 1;
      const backoffDelay = calculateBackoffMs(nextAttemptNumber);
      const nextAttemptDate = new Date(Date.now() + backoffDelay).toISOString();

      console.error(`[Worker] Failed dispatching item ${item.id}:`, errorMessage);

      await supabase
        .from("notification_outbox")
        .update({
          status: nextAttemptNumber >= MAX_ATTEMPTS ? "failed" : "queued",
          attempts: nextAttemptNumber,
          next_attempt_at: nextAttemptDate,
          last_error_code: "DELIVERY_ERROR",
          last_error_message: errorMessage,
        })
        .eq("id", item.id);

      failedCount++;
    }
  }

  return { processed: processedCount, failed: failedCount };
}

async function startWorkerLoop() {
  console.log(`🚀 TownSquare Control Notification Worker Daemon started (Polling every ${POLL_INTERVAL_MS}ms)`);

  while (isRunning) {
    try {
      await processOutboxBatch();
    } catch (loopErr) {
      console.error("[Worker] Error in worker processing loop:", loopErr);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

if (require.main === module || process.argv[1]?.includes("worker/index")) {
  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping notification worker...");
    isRunning = false;
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    console.log("\n🛑 Terminating notification worker...");
    isRunning = false;
    process.exit(0);
  });

  startWorkerLoop();
}
