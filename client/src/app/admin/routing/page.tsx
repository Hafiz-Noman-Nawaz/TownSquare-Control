"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { useLanguage } from "@/lib/i18n/context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Route, Plus, Trash2, ShieldCheck, AlertCircle } from "lucide-react";

interface RoutingRule {
  id: string;
  category_name: string;
  zone_code: string | null;
  provider_name: string;
  notification_email: string;
  priority: number;
  is_active: boolean;
}

const INITIAL_ROUTING_RULES: RoutingRule[] = [
  {
    id: "r-1",
    category_name: "CCTV Camera",
    zone_code: null, // Global
    provider_name: "Apex CCTV & Surveillance Solutions",
    notification_email: "cctv-dispatch@apexsurv.demo",
    priority: 1,
    is_active: true,
  },
  {
    id: "r-2",
    category_name: "NVR Issue",
    zone_code: null,
    provider_name: "Apex CCTV & Surveillance Solutions",
    notification_email: "cctv-dispatch@apexsurv.demo",
    priority: 1,
    is_active: true,
  },
  {
    id: "r-3",
    category_name: "ANPR Issue",
    zone_code: null,
    provider_name: "Apex CCTV & Surveillance Solutions",
    notification_email: "cctv-dispatch@apexsurv.demo",
    priority: 1,
    is_active: true,
  },
  {
    id: "r-4",
    category_name: "Barrier",
    zone_code: null,
    provider_name: "SecureGate Automation & Barriers",
    notification_email: "support@securegate.demo",
    priority: 1,
    is_active: true,
  },
  {
    id: "r-5",
    category_name: "UPS",
    zone_code: null,
    provider_name: "ElectroPower Critical Systems",
    notification_email: "dispatch@electropwr.demo",
    priority: 1,
    is_active: true,
  },
  {
    id: "r-6",
    category_name: "CCTV Camera",
    zone_code: "ZONE-1", // Zone override
    provider_name: "Apex CCTV & Surveillance Solutions",
    notification_email: "zone1-priority@apexsurv.demo",
    priority: 2,
    is_active: true,
  },
];

export default function RoutingMatrixPage() {
  const { t } = useLanguage();
  const [rules, setRules] = useState<RoutingRule[]>(INITIAL_ROUTING_RULES);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("nav.routing")}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Deterministic routing rules dispatching faults to authorized service provider organizations
            </p>
          </div>
        </div>

        {/* Precedence Policy Alert */}
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          <ShieldCheck className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Automated Dispatch Resolution Hierarchy</span>
            <p className="leading-relaxed">
              Rules with a specific Town Square zone assignment take precedence over global category fallback rules.
              If no matching provider rule is found, the incident is securely saved with an unassigned status and internal staff are alerted.
            </p>
          </div>
        </div>

        {/* Routing Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Active Contractor Routing Rules</span>
              <span className="text-xs font-normal text-slate-400">{rules.length} configured rules</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 rtl:text-right">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3.5 font-bold">Equipment Category</th>
                    <th className="px-4 py-3.5 font-bold">Zone Scope</th>
                    <th className="px-4 py-3.5 font-bold">Assigned Provider</th>
                    <th className="px-4 py-3.5 font-bold">Dispatch Email Snapshot</th>
                    <th className="px-4 py-3.5 font-bold">Precedence</th>
                    <th className="px-4 py-3.5 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                        {rule.category_name}
                      </td>
                      <td className="px-4 py-3">
                        {rule.zone_code ? (
                          <Badge variant="outline" className="font-mono bg-blue-50 text-blue-700 border-blue-300">
                            {rule.zone_code} Override
                          </Badge>
                        ) : (
                          <span className="text-slate-500">Global (All Zones)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{rule.provider_name}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{rule.notification_email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold">
                          Priority {rule.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                          Active
                        </span>
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
