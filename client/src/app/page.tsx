"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/shell";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  PlusCircle,
  Briefcase,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const ZONE_METRICS = [
  { name: "Zone 1", incidents: 8, fill: "#2563EB" },
  { name: "Zone 2", incidents: 5, fill: "#3B82F6" },
  { name: "Zone 3", incidents: 4, fill: "#60A5FA" },
  { name: "Zone 4", incidents: 7, fill: "#93C5FD" },
];

const CATEGORY_METRICS = [
  { name: "CCTV", count: 12, color: "#2563EB" },
  { name: "Barrier", count: 5, color: "#10B981" },
  { name: "ANPR", count: 4, color: "#F59E0B" },
  { name: "UPS", count: 2, color: "#8B5CF6" },
  { name: "NVR", count: 1, color: "#EC4899" },
];

export default function DashboardPage() {
  const { t } = useLanguage();
  const { isContractor, role } = useAuth();

  return (
    <AppShell>
      <div className="space-y-5 sm:space-y-6">
        {/* Welcome Operational Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("nav.dashboard")}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Town Square Community Security Command &bull; 4 Configured Operational Zones
            </p>
          </div>

          <div className="flex w-full sm:w-auto">
            {!isContractor ? (
              <Link href="/incidents/new">
                <Button size="sm" className="h-9 w-full gap-2 bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 sm:w-auto">
                  <PlusCircle className="h-4 w-4" />
                  <span>{t("nav.reportNew")}</span>
                </Button>
              </Link>
            ) : (
              <Link href="/contractor">
                <Button size="sm" className="h-9 w-full gap-2 bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 sm:w-auto">
                  <Briefcase className="h-4 w-4" />
                  <span>{t("contractor.portalTitle")}</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* 6 Key Operational Metrics Cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Card className="border-l-4 border-l-slate-800">
            <CardContent className="p-3 sm:p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                Total Logged
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                24
              </span>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-3 sm:p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 block">
                Open / Dispatched
              </span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">
                6
              </span>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600">
            <CardContent className="p-3 sm:p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block">
                In Progress
              </span>
              <span className="text-2xl font-black text-blue-600 mt-1 block">
                8
              </span>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600">
            <CardContent className="p-3 sm:p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 block">
                Pending Parts
              </span>
              <span className="text-2xl font-black text-purple-600 mt-1 block">
                3
              </span>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-600">
            <CardContent className="p-3 sm:p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 block">
                Resolved
              </span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">
                7
              </span>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-rose-600 bg-rose-50/20 dark:bg-rose-950/10">
            <CardContent className="p-3 sm:p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 block">
                High Priority
              </span>
              <span className="text-2xl font-black text-rose-600 mt-1 block">
                4
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Operational Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incidents by Zone Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-start justify-between gap-3 text-base">
                <span>Incidents by Town Square Zone</span>
                <span className="hidden text-right text-xs font-normal text-slate-400 sm:block">Live Operational Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ZONE_METRICS}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                    <Bar dataKey="incidents" radius={[4, 4, 0, 0]} fill="#2563EB" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Incidents by Equipment Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-start justify-between gap-3 text-base">
                <span>Equipment Category Breakdown</span>
                <span className="hidden text-right text-xs font-normal text-slate-400 sm:block">Asset Fault Share</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={CATEGORY_METRICS}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="count"
                    >
                      {CATEGORY_METRICS.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs mt-2">
                {CATEGORY_METRICS.map((c) => (
                  <div key={c.name} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span>{c.name}: {c.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Triage Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>High Priority & Critical Incidents Requiring Attention</span>
              <Link href="/incidents" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <span>View Full Queue</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-rose-200 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    TS-20261023-0101
                  </span>
                  <Badge variant="high">HIGH</Badge>
                  <Badge variant="open">OPEN</Badge>
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1">
                  CCTV Camera CAM-Z1-042 Offline &bull; Main Boulevard Entry Gate A
                </p>
                <p className="text-[11px] text-slate-500">
                  Assigned Provider: Apex CCTV & Surveillance Solutions
                </p>
              </div>
              <Link href="/incidents/inc-001">
                <Button size="sm" variant="outline" className="text-xs h-8 border-rose-300 text-rose-700">
                  Investigate
                </Button>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-amber-200 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    TS-20261023-0102
                  </span>
                  <Badge variant="high">HIGH</Badge>
                  <Badge variant="in_progress">IN PROGRESS</Badge>
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1">
                  Barrier Sensor Failure &bull; Noor Entry Barrier Gate 2
                </p>
                <p className="text-[11px] text-slate-500">
                  Assigned Provider: SecureGate Automation & Barriers
                </p>
              </div>
              <Link href="/incidents/inc-002">
                <Button size="sm" variant="outline" className="text-xs h-8 border-amber-300 text-amber-700">
                  Investigate
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
