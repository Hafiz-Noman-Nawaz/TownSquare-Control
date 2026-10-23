"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/shell";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { generateSafeCsv } from "@/lib/security/csv";
import { formatDateTime } from "@/lib/utils";
import {
  Search,
  Filter,
  Download,
  PlusCircle,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Clock,
  ArrowUpDown,
} from "lucide-react";

export interface IncidentRecord {
  id: string;
  ticket_number: string;
  zone_name: string;
  zone_code: string;
  category_name: string;
  camera_number: string | null;
  exact_location: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "pending" | "resolved";
  reported_at: string;
  assigned_provider_name: string | null;
  description: string;
}

// Initial operational incident dataset
const SAMPLE_INCIDENTS: IncidentRecord[] = [
  {
    id: "inc-001",
    ticket_number: "TS-20261023-0101",
    zone_name: "Zone 1 - Main Boulevard & Retail",
    zone_code: "ZONE-1",
    category_name: "CCTV Camera",
    camera_number: "CAM-Z1-042",
    exact_location: "Main Boulevard Entry Gate A - West Pole",
    priority: "high",
    status: "open",
    reported_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    assigned_provider_name: "Apex CCTV & Surveillance Solutions",
    description: "Camera feed offline and signal loss reported on video wall.",
  },
  {
    id: "inc-002",
    ticket_number: "TS-20261023-0102",
    zone_name: "Zone 4 - Residential South (Noor/Rawda)",
    zone_code: "ZONE-4",
    category_name: "Barrier",
    camera_number: null,
    exact_location: "Noor Entry Barrier Gate 2",
    priority: "high",
    status: "in_progress",
    reported_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    assigned_provider_name: "SecureGate Automation & Barriers",
    description: "Boom barrier arm is failing to lower automatically after vehicle passes.",
  },
  {
    id: "inc-003",
    ticket_number: "TS-20261023-0103",
    zone_name: "Zone 2 - Central Park & Recreation",
    zone_code: "ZONE-2",
    category_name: "ANPR Issue",
    camera_number: "ANPR-CP-01",
    exact_location: "Central Park East Perimeter Access",
    priority: "medium",
    status: "pending",
    reported_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    assigned_provider_name: "Apex CCTV & Surveillance Solutions",
    description: "Optical license plate reader lens clouded; needs cleaning and calibration.",
  },
  {
    id: "inc-004",
    ticket_number: "TS-20261023-0104",
    zone_name: "Zone 1 - Main Boulevard & Retail",
    zone_code: "ZONE-1",
    category_name: "UPS",
    camera_number: null,
    exact_location: "Retail Plaza IDF Room 1 - Basement B1",
    priority: "medium",
    status: "resolved",
    reported_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    assigned_provider_name: "ElectroPower Critical Systems",
    description: "UPS unit alarm sounded battery service alert. Battery pack replaced.",
  },
  {
    id: "inc-005",
    ticket_number: "TS-20261023-0105",
    zone_name: "Zone 3 - Residential North (Zahra/Hayat)",
    zone_code: "ZONE-3",
    category_name: "Other Security Equipment",
    camera_number: null,
    exact_location: "Zahra Community Substation Perimeter Fence",
    priority: "low",
    status: "open",
    reported_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    assigned_provider_name: "Apex CCTV & Surveillance Solutions",
    description: "Emergency lighting beacon loose on mounting bracket.",
  },
];

export default function IncidentsPage() {
  const { t, language } = useLanguage();
  const { isContractor } = useAuth();

  const [incidents, setIncidents] = useState<IncidentRecord[]>(SAMPLE_INCIDENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");

  // Filtering
  const filteredIncidents = incidents.filter((item) => {
    const matchesSearch =
      item.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.exact_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.camera_number && item.camera_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.category_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesZone = selectedZone === "all" || item.zone_code === selectedZone;
    const matchesStatus = selectedStatus === "all" || item.status === selectedStatus;
    const matchesPriority = selectedPriority === "all" || item.priority === selectedPriority;

    return matchesSearch && matchesZone && matchesStatus && matchesPriority;
  });

  // Secure CSV Export (with Formula-Injection Defense)
  const handleExportCsv = () => {
    const headers = [
      "Ticket Number",
      "Zone",
      "Category",
      "Camera Ref",
      "Location",
      "Priority",
      "Status",
      "Assigned Provider",
      "Reported Date",
      "Description",
    ];

    const rows = filteredIncidents.map((inc) => [
      inc.ticket_number,
      inc.zone_name,
      inc.category_name,
      inc.camera_number || "-",
      inc.exact_location,
      inc.priority.toUpperCase(),
      inc.status.toUpperCase(),
      inc.assigned_provider_name || "Unassigned",
      inc.reported_at,
      inc.description,
    ]);

    const csvContent = generateSafeCsv(headers, rows);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `TownSquare_Incidents_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("nav.incidents")}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Town Square active operational security faults and maintenance tracking
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="gap-2 text-xs h-9 border-slate-300 dark:border-slate-700"
            >
              <Download className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
              <span>Export CSV</span>
            </Button>

            {!isContractor && (
              <Link href="/incidents/new">
                <Button size="sm" className="gap-2 text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  <PlusCircle className="h-4 w-4" />
                  <span>{t("nav.reportNew")}</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 rtl:left-auto rtl:right-3" />
                <Input
                  placeholder={t("common.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rtl:pl-3 rtl:pr-9 text-xs h-9"
                />
              </div>

              {/* Zone Filter */}
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="all">All Zones (Town Square 1–4)</option>
                <option value="ZONE-1">Zone 1 - Main Boulevard</option>
                <option value="ZONE-2">Zone 2 - Central Park</option>
                <option value="ZONE-3">Zone 3 - Zahra / Hayat</option>
                <option value="ZONE-4">Zone 4 - Noor / Rawda</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>

              {/* Priority Filter */}
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Operational Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 rtl:text-right">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3.5 font-bold">{t("common.ticketNumber")}</th>
                  <th className="px-4 py-3.5 font-bold">{t("common.zone")}</th>
                  <th className="px-4 py-3.5 font-bold">{t("common.category")}</th>
                  <th className="px-4 py-3.5 font-bold">Location</th>
                  <th className="px-4 py-3.5 font-bold">Priority</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-4 py-3.5 font-bold">{t("common.provider")}</th>
                  <th className="px-4 py-3.5 font-bold">{t("common.date")}</th>
                  <th className="px-4 py-3.5 font-bold text-center">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No matching operational incidents found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((incident) => (
                    <tr
                      key={incident.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        <Link href={`/incidents/${incident.id}`} className="hover:underline">
                          {incident.ticket_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {incident.zone_code}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-semibold">{incident.category_name}</span>
                          {incident.camera_number && (
                            <span className="block text-[10px] text-slate-400 font-mono">
                              {incident.camera_number}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate" title={incident.exact_location}>
                        {incident.exact_location}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={incident.priority}>{incident.priority.toUpperCase()}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={incident.status}>{t(`status.${incident.status}`)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {incident.assigned_provider_name || <span className="text-rose-500 italic">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">
                        {formatDateTime(incident.reported_at, language)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link href={`/incidents/${incident.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="View details">
                            <Eye className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
