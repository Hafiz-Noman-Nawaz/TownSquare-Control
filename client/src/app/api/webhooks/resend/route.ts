import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/server/supabase/admin";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("svix-signature") || req.headers.get("resend-signature");
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    // Verify cryptographic signature if secret configured
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      // Timing-safe comparison against forgery
      const valid = crypto.timingSafeEqual(
        Buffer.from(signature.slice(0, 64)),
        Buffer.from(expectedSignature.slice(0, 64))
      );

      if (!valid) {
        console.warn("[Webhook] Invalid Resend webhook signature rejected.");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    const { type, data } = event;

    if (!data?.email_id) {
      return NextResponse.json({ received: true });
    }

    const adminSupabase = createAdminClient();

    // Map Resend events to outbox state updates
    if (type === "email.delivered") {
      await adminSupabase
        .from("notification_outbox")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("provider_message_id", data.email_id);
    } else if (type === "email.bounced" || type === "email.complained") {
      await adminSupabase
        .from("notification_outbox")
        .update({
          status: "failed",
          last_error_code: type,
          last_error_message: `Resend event: ${type}`,
        })
        .eq("provider_message_id", data.email_id);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook processing error";
    console.error("[Webhook Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
