"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/shell";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, formatCurrencyAED } from "@/lib/utils";
import {
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  FileText,
  DollarSign,
  Clock,
  Eye,
  Send,
  Building,
} from "lucide-react";

interface ContractorIncident {
  id: string;
  ticket_number: string;
  zone_code: string;
  category_name: string;
  camera_number: string | null;
  exact_location: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "pending" | "resolved";
  reported_at: string;
  description: string;
  acknowledged: boolean;
}

const CONTRACTOR_ASSIGNED_INCIDENTS: ContractorIncident[] = [
  {
    id: "inc-001",
    ticket_number: "TS-20261023-0101",
    zone_code: "ZONE-1",
    category_name: "CCTV Camera",
    camera_number: "CAM-Z1-042",
    exact_location: "Main Boulevard Entry Gate A - West Pole",
    priority: "high",
    status: "in_progress",
    reported_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    description: "Camera feed offline and signal loss reported on video wall.",
    acknowledged: true,
  },
  {
    id: "inc-003",
    ticket_number: "TS-20261023-0103",
    zone_code: "ZONE-2",
    category_name: "ANPR Issue",
    camera_number: "ANPR-CP-01",
    exact_location: "Central Park East Perimeter Access",
    priority: "medium",
    status: "open",
    reported_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    description: "Optical license plate reader lens clouded; needs cleaning and calibration.",
    acknowledged: false,
  },
];

export default function ContractorPortalPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [incidents, setIncidents] = useState<ContractorIncident[]>(CONTRACTOR_ASSIGNED_INCIDENTS);
  const [selectedIncidentForReport, setSelectedIncidentForReport] = useState<ContractorIncident | null>(null);

  // Form states for service report
  const [findings, setFindings] = useState("");
  const [workPerformed, setWorkPerformed] = useState("");
  const [recommendedAction, setRecommendedAction] = useState("");
  const [completionStatus, setCompletionStatus] = useState<"work_completed" | "parts_required" | "further_investigation">("work_completed");
  const [reportSubmittedSuccess, setReportSubmittedSuccess] = useState(false);

  const handleAcknowledge = (id: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, acknowledged: true, status: "in_progress" } : inc))
    );
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmittedSuccess(true);
    setTimeout(() => {
      setSelectedIncidentForReport(null);
      setReportSubmittedSuccess(false);
      setFindings("");
      setWorkPerformed("");
      setRecommendedAction("");
    }, 2000);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Contractor Provider Banner */}
        <div className="rounded-xl border border-navy-800 bg-navy-900 p-6 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{t("contractor.portalTitle")}</h1>
                  <span className="rounded bg-emerald-950 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-800">
                    Active Provider
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assigned Company: <span className="text-white font-medium">Apex CCTV & Surveillance Solutions</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-300">
              <div className="rounded-lg bg-navy-950/80 p-3 text-center border border-navy-800">
                <span className="text-[10px] uppercase text-slate-500 font-semibold block">Assigned Tickets</span>
                <span className="text-lg font-bold text-white">{incidents.length}</span>
              </div>
              <div className="rounded-lg bg-navy-950/80 p-3 text-center border border-navy-800">
                <span className="text-[10px] uppercase text-slate-500 font-semibold block">Pending Action</span>
                <span className="text-lg font-bold text-amber-400">
                  {incidents.filter((i) => !i.acknowledged).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Incident Workspace Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>{t("contractor.assignedTickets")}</span>
              <span className="text-xs font-normal text-slate-500">
                Showing exclusively incidents assigned to your contractor account
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 rtl:text-right">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3.5 font-bold">Ticket #</th>
                    <th className="px-4 py-3.5 font-bold">Zone</th>
                    <th className="px-4 py-3.5 font-bold">Equipment Category</th>
                    <th className="px-4 py-3.5 font-bold">Location</th>
                    <th className="px-4 py-3.5 font-bold">Priority</th>
                    <th className="px-4 py-3.5 font-bold">Status</th>
                    <th className="px-4 py-3.5 font-bold">Reported Date</th>
                    <th className="px-4 py-3.5 font-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {inc.ticket_number}
                      </td>
                      <td className="px-4 py-3 font-medium">{inc.zone_code}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{inc.category_name}</span>
                        {inc.camera_number && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {inc.camera_number}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate">{inc.exact_location}</td>
                      <td className="px-4 py-3">
                        <Badge variant={inc.priority}>{inc.priority.toUpperCase()}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={inc.status}>{t(`status.${inc.status}`)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">
                        {formatDateTime(inc.reported_at, language)}
                      </td>
                      <td className="px-4 py-3 text-center space-x-1 rtl:space-x-reverse">
                        {!inc.acknowledged ? (
                          <Button
                            size="sm"
                            onClick={() => handleAcknowledge(inc.id)}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7"
                          >
                            {t("contractor.acknowledgeBtn")}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedIncidentForReport(inc)}
                            className="text-xs h-7 gap-1 border-blue-400 text-blue-600 hover:bg-blue-50"
                          >
                            <FileText className="h-3 w-3" />
                            <span>Submit Report</span>
                          </Button>
                        )}
                        <Link href={`/incidents/${inc.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="View details">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Service Report Submission Modal Dialog */}
        {selectedIncidentForReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>Submit Service Report: {selectedIncidentForReport.ticket_number}</span>
                </CardTitle>
                <CardDescription>
                  Document on-site diagnostic findings and work performed for Town Square operations review
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {reportSubmittedSuccess ? (
                  <div className="py-8 text-center space-y-3">
                    <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Service Report Transmitted
                    </h3>
                    <p className="text-xs text-slate-500">
                      The maintenance manager has been notified and the ticket status is updated.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleReportSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        {t("contractor.findings")} <span className="text-rose-500">*</span>
                      </label>
                      <Textarea
                        rows={3}
                        required
                        placeholder="Detail diagnostic check results, root cause of fault, circuit analysis..."
                        value={findings}
                        onChange={(e) => setFindings(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        {t("contractor.workPerformed")} <span className="text-rose-500">*</span>
                      </label>
                      <Textarea
                        rows={3}
                        required
                        placeholder="Describe exact repair actions, component replacements, firmware flashes..."
                        value={workPerformed}
                        onChange={(e) => setWorkPerformed(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        {t("contractor.completionStatus")}
                      </label>
                      <select
                        value={completionStatus}
                        onChange={(e) => setCompletionStatus(e.target.value as any)}
                        className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                      >
                        <option value="work_completed">Work Completed (Ready for Sign-Off)</option>
                        <option value="parts_required">Parts Required (Quotation Submitted)</option>
                        <option value="further_investigation">Further Diagnostic Investigation Required</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        {t("contractor.recommendedAction")}
                      </label>
                      <Input
                        placeholder="e.g. Schedule 30-day follow-up or replace secondary surge protector"
                        value={recommendedAction}
                        onChange={(e) => setRecommendedAction(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedIncidentForReport(null)}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                        Submit Official Report
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
