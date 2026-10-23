"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { useLanguage } from "@/lib/i18n/context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { ShieldCheck, Search, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AuditEntry {
  id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  details: string;
}

const SAMPLE_AUDIT_LOGS: AuditEntry[] = [
  {
    id: "a-101",
    actor_name: "Control-Room Shift Lead",
    action: "INCIDENT_CREATED",
    entity_type: "incident",
    entity_id: "TS-20261023-0101",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    details: "Logged High Priority CCTV fault at Gate A",
  },
  {
    id: "a-102",
    actor_name: "System Dispatcher",
    action: "NOTIFICATION_QUEUED",
    entity_type: "notification_outbox",
    entity_id: "ob-1",
    timestamp: new Date(Date.now() - 3600000 * 2 + 100).toISOString(),
    details: "Queued dispatch email to cctv-dispatch@apexsurv.demo",
  },
  {
    id: "a-103",
    actor_name: "Tariq Mansoor (Contractor)",
    action: "STATUS_CHANGED",
    entity_type: "incident",
    entity_id: "TS-20261023-0101",
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    details: "Transitioned from OPEN to IN_PROGRESS",
  },
  {
    id: "a-104",
    actor_name: "Head of Community Security",
    action: "ROUTING_RULE_UPDATED",
    entity_type: "routing",
    entity_id: "r-6",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    details: "Updated Zone 1 CCTV override to priority 2",
  },
];

export default function AuditLogsPage() {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = SAMPLE_AUDIT_LOGS.filter(
    (log) =>
      log.actor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("nav.auditLogs")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tamper-evident, immutable event log tracking all incident transitions, authorizations, and routing changes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 rtl:left-auto rtl:right-3" />
            <Input
              placeholder="Search audit records by actor, action, ticket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rtl:pl-3 rtl:pr-9 text-xs h-9"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-600" />
                <span>Immutable Security Event Journal</span>
              </span>
              <span className="text-xs text-slate-400 font-normal">{filteredLogs.length} verified records</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 rtl:text-right">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3.5 font-bold">Timestamp</th>
                    <th className="px-4 py-3.5 font-bold">Actor</th>
                    <th className="px-4 py-3.5 font-bold">Security Action</th>
                    <th className="px-4 py-3.5 font-bold">Target Entity</th>
                    <th className="px-4 py-3.5 font-bold">Event Audit Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {formatDateTime(log.timestamp, language)}
                      </td>
                      <td className="px-4 py-3 font-semibold font-sans text-slate-900 dark:text-slate-100">
                        {log.actor_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                        {log.entity_id}
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-600 dark:text-slate-300">
                        {log.details}
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
