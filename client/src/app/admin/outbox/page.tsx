"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { useLanguage } from "@/lib/i18n/context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Send, RefreshCw, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

interface OutboxItem {
  id: string;
  ticket_number: string;
  event_type: string;
  recipient_email_snapshot: string;
  status: "queued" | "processing" | "sent" | "failed";
  attempts: number;
  last_error_message?: string;
  created_at: string;
  sent_at?: string;
}

const SAMPLE_OUTBOX: OutboxItem[] = [
  {
    id: "ob-1",
    ticket_number: "TS-20261023-0101",
    event_type: "incident_assigned",
    recipient_email_snapshot: "cctv-dispatch@apexsurv.demo",
    status: "sent",
    attempts: 1,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    sent_at: new Date(Date.now() - 3600000 * 2 + 1500).toISOString(),
  },
  {
    id: "ob-2",
    ticket_number: "TS-20261023-0102",
    event_type: "incident_assigned",
    recipient_email_snapshot: "support@securegate.demo",
    status: "sent",
    attempts: 1,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    sent_at: new Date(Date.now() - 3600000 * 5 + 2000).toISOString(),
  },
  {
    id: "ob-3",
    ticket_number: "TS-20261023-0103",
    event_type: "incident_assigned",
    recipient_email_snapshot: "dispatch@electropwr.demo",
    status: "queued",
    attempts: 0,
    created_at: new Date().toISOString(),
  },
];

export default function OutboxInspectionPage() {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<OutboxItem[]>(SAMPLE_OUTBOX);
  const [isRetrying, setIsRetrying] = useState<string | null>(null);

  const handleManualRetry = (id: string) => {
    setIsRetrying(id);
    setTimeout(() => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "sent", attempts: item.attempts + 1, sent_at: new Date().toISOString() } : item
        )
      );
      setIsRetrying(null);
    }, 1200);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("nav.outbox")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Transactional notification queue dispatching emails via Resend with exponential backoff & idempotency
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-600" />
                <span>Notification Queue Status</span>
              </span>
              <span className="text-xs text-slate-400 font-normal">
                {items.filter((i) => i.status === "sent").length} sent / {items.filter((i) => i.status !== "sent").length} in-queue
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 rtl:text-right">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3.5 font-bold">Ticket #</th>
                    <th className="px-4 py-3.5 font-bold">Event Type</th>
                    <th className="px-4 py-3.5 font-bold">Recipient Email</th>
                    <th className="px-4 py-3.5 font-bold">Status</th>
                    <th className="px-4 py-3.5 font-bold">Attempts</th>
                    <th className="px-4 py-3.5 font-bold">Dispatched At</th>
                    <th className="px-4 py-3.5 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {item.ticket_number}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{item.event_type}</td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-200">
                        {item.recipient_email_snapshot}
                      </td>
                      <td className="px-4 py-3">
                        {item.status === "sent" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" /> SENT
                          </span>
                        ) : item.status === "queued" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                            <Clock className="h-3 w-3" /> QUEUED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800">
                            <AlertTriangle className="h-3 w-3" /> FAILED
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono">{item.attempts} / 5</td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">
                        {item.sent_at ? formatDateTime(item.sent_at, language) : "Pending"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.status !== "sent" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isRetrying === item.id}
                            onClick={() => handleManualRetry(item.id)}
                            className="text-xs h-7 gap-1"
                          >
                            <RefreshCw className={`h-3 w-3 ${isRetrying === item.id ? "animate-spin" : ""}`} />
                            <span>Retry</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
