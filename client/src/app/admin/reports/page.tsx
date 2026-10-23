"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { useLanguage } from "@/lib/i18n/context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateSafeCsv } from "@/lib/security/csv";
import { FileSpreadsheet, Download, Calendar, BarChart3, TrendingUp, CheckCircle2 } from "lucide-react";

export default function ReportsPage() {
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState("30");

  const handleDownloadFullAuditReport = () => {
    const headers = [
      "Community",
      "Period",
      "Total Incidents",
      "Resolution Rate",
      "Average Response Hours",
      "Average Resolution Hours",
      "SLA Compliance %",
    ];

    const rows = [
      ["Town Square", "Last 30 Days", "42", "88%", "1.8", "16.4", "94.2%"],
      ["Zone 1 - Main Boulevard", "Last 30 Days", "16", "91%", "1.2", "14.1", "96.0%"],
      ["Zone 2 - Central Park", "Last 30 Days", "9", "85%", "2.1", "18.0", "92.5%"],
      ["Zone 3 - Zahra / Hayat", "Last 30 Days", "7", "86%", "1.9", "15.3", "93.0%"],
      ["Zone 4 - Noor / Rawda", "Last 30 Days", "10", "89%", "1.6", "17.2", "95.1%"],
    ];

    const csv = generateSafeCsv(headers, rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TownSquare_Operations_SLA_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("nav.reports")}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Operational performance analytics, contractor SLA compliance, and exportable reports
            </p>
          </div>

          <Button
            size="sm"
            onClick={handleDownloadFullAuditReport}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Executive Summary (CSV)</span>
          </Button>
        </div>

        {/* Executive Metric Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Avg. Contractor Response
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                1.8 Hours
              </span>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" /> 14% faster than last month
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Mean Time to Resolve (MTTR)
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                16.4 Hours
              </span>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                <CheckCircle2 className="h-3 w-3" /> Within 24-hour target
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Overall SLA Compliance
              </span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">
                94.2%
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Target: 90.0% Minimum
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Approved Quotations
              </span>
              <span className="text-2xl font-black text-blue-600 mt-1 block">
                AED 24,850
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                7 Purchase Orders Issued
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Performance by Service Provider */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Service Provider Operational Performance</span>
              <span className="text-xs font-normal text-slate-400">Past 30 Days Record</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 rtl:text-right">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3.5 font-bold">Service Provider</th>
                    <th className="px-4 py-3.5 font-bold">Primary Specialty</th>
                    <th className="px-4 py-3.5 font-bold">Total Assigned</th>
                    <th className="px-4 py-3.5 font-bold">Resolved</th>
                    <th className="px-4 py-3.5 font-bold">Avg. Response</th>
                    <th className="px-4 py-3.5 font-bold">SLA Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      Apex CCTV & Surveillance Solutions
                    </td>
                    <td className="px-4 py-3">CCTV / ANPR / NVR</td>
                    <td className="px-4 py-3 font-semibold">28</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">25</td>
                    <td className="px-4 py-3 font-mono">1.4 hrs</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        96.4%
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      SecureGate Automation & Barriers
                    </td>
                    <td className="px-4 py-3">Boom Barriers / RFID</td>
                    <td className="px-4 py-3 font-semibold">9</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">8</td>
                    <td className="px-4 py-3 font-mono">2.1 hrs</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        92.0%
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      ElectroPower Critical Systems
                    </td>
                    <td className="px-4 py-3">Server Room UPS & Power</td>
                    <td className="px-4 py-3 font-semibold">5</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">5</td>
                    <td className="px-4 py-3 font-mono">2.6 hrs</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        94.0%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
