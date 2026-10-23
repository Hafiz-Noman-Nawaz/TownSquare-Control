"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { canTransitionStatus, type IncidentStatusEnum } from "@/lib/validations/incident";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrencyAED, formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  Shield,
  Clock,
  Camera,
  MessageSquare,
  FileCheck,
  DollarSign,
  AlertTriangle,
  Send,
  Lock,
  CheckCircle2,
} from "lucide-react";

export default function IncidentDetailPage() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const { role, isSuperAdmin, isManager, isContractor, user } = useAuth();

  // Simulated operational state for the incident
  const [currentStatus, setCurrentStatus] = useState<"open" | "in_progress" | "pending" | "resolved">("in_progress");
  const [statusReason, setStatusReason] = useState("");
  const [showStatusModal, setShowStatusModal] = useState<"in_progress" | "pending" | "resolved" | "open" | null>(null);

  // Comments state
  const [comments, setComments] = useState([
    {
      id: "c-1",
      author_name: "Control-Room Operator",
      author_role: "control_room_operator",
      body: "Security camera feed dropped abruptly after brief power spike on circuit 2A.",
      visibility: "internal" as const,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "c-2",
      author_name: "Tariq Mansoor (Apex Contractor)",
      author_role: "contractor",
      body: "Technician dispatched on-site to inspect POE injector and IDF patch panel.",
      visibility: "provider_visible" as const,
      created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
  ]);

  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentVisibility, setNewCommentVisibility] = useState<"internal" | "provider_visible">("provider_visible");

  // Quotation state
  const [quotation, setQuotation] = useState<{
    id: string;
    reference: string;
    amount: number;
    currency: string;
    status: "submitted" | "under_review" | "approved" | "rejected";
  }>({
    id: "q-101",
    reference: "QUO-APEX-2026-441",
    amount: 1450.0,
    currency: "AED",
    status: "submitted",
  });

  // Filter comments based on contractor isolation rules
  const visibleComments = isContractor
    ? comments.filter((c) => c.visibility === "provider_visible")
    : comments;

  const handleStatusChange = (newStatus: "open" | "in_progress" | "pending" | "resolved") => {
    const check = canTransitionStatus(currentStatus, newStatus, role || "guest");
    if (!check.allowed) {
      alert(check.reason);
      return;
    }
    setCurrentStatus(newStatus);
    setShowStatusModal(null);
    setStatusReason("");
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    // Contractors forced to provider_visible
    const visibility = isContractor ? "provider_visible" : newCommentVisibility;

    setComments((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        author_name: user?.full_name || "User",
        author_role: role || "user",
        body: newCommentText.trim(),
        visibility,
        created_at: new Date().toISOString(),
      },
    ]);
    setNewCommentText("");
  };

  const handleQuotationDecision = (decision: "approved" | "rejected") => {
    setQuotation((prev) => ({ ...prev, status: decision }));
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/incidents"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            <span>Back to All Incidents</span>
          </Link>

          <span className="text-xs text-slate-400 font-mono">Incident ID: {id}</span>
        </div>

        {/* Master Ticket Header */}
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                    TS-20261023-0101
                  </span>
                  <Badge variant="high">HIGH PRIORITY</Badge>
                  <Badge variant={currentStatus}>{t(`status.${currentStatus}`)}</Badge>
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">
                  CCTV Camera &bull; Camera CAM-Z1-042
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Main Boulevard Entry Gate A - West Pole &bull; Zone 1 - Main Boulevard & Retail
                </p>
              </div>

              {/* Status Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {currentStatus === "open" && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange("in_progress")}
                    className="bg-blue-600 hover:bg-blue-700 text-xs text-white"
                  >
                    Start Investigation
                  </Button>
                )}

                {currentStatus === "in_progress" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange("pending")}
                      className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      Hold (Parts Pending)
                    </Button>
                    {!isContractor && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange("resolved")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs text-white"
                      >
                        Sign Off & Resolve
                      </Button>
                    )}
                  </>
                )}

                {currentStatus === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange("in_progress")}
                      className="text-xs"
                    >
                      Resume Work
                    </Button>
                    {!isContractor && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange("resolved")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs text-white"
                      >
                        Sign Off & Resolve
                      </Button>
                    )}
                  </>
                )}

                {currentStatus === "resolved" && (isSuperAdmin || isManager) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange("open")}
                    className="text-xs border-rose-300 text-rose-700 hover:bg-rose-50"
                  >
                    Reopen Incident
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Details, Photos, Service Report (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fault Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fault Description & Observations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-4 rounded-md border border-slate-200 dark:border-slate-800">
                  Security camera feed dropped abruptly after brief power spike on circuit 2A. Video management system displays &quot;No Video Input&quot; error code VMS-404. Physical inspection showed camera status LED unlit.
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400 pt-2">
                  <div>
                    <span className="font-semibold block text-slate-400">Assigned Provider</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      Apex CCTV & Surveillance Solutions
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-400">Reported Timestamp</span>
                    <span>{formatDateTime(new Date(Date.now() - 7200000), language)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photo Attachments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="h-4 w-4 text-blue-600" />
                  <span>Evidence & Incident Photos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative group">
                    <div className="text-center p-3">
                      <Camera className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                      <span className="text-[11px] text-slate-500 font-mono">CAM-Z1-042-pole.jpg</span>
                    </div>
                  </div>
                  <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative group">
                    <div className="text-center p-3">
                      <Camera className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                      <span className="text-[11px] text-slate-500 font-mono">switch-port-status.jpg</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contractor Quotation Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span>Contractor Quotation & Estimation</span>
                  </span>
                  <Badge variant="outline" className="font-mono">{quotation.status.toUpperCase()}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800 gap-3">
                  <div>
                    <span className="text-xs text-slate-500 block">Reference Number</span>
                    <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                      {quotation.reference}
                    </span>
                    <span className="text-xs text-slate-500 block mt-1">Replacement POE Switch Module</span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-500 block">Total Amount</span>
                    <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrencyAED(quotation.amount)}
                    </span>
                  </div>
                </div>

                {/* Manager / Admin Quotation Review Controls */}
                {(isSuperAdmin || isManager) && quotation.status === "submitted" && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuotationDecision("rejected")}
                      className="text-xs border-rose-300 text-rose-700 hover:bg-rose-50"
                    >
                      Reject Quotation
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleQuotationDecision("approved")}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Approve Quotation
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Operational Comments / Discussion */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span>Operations Log & Discussion</span>
                  </span>
                  <span className="text-xs text-slate-400 font-normal">
                    {visibleComments.length} entries
                  </span>
                </CardTitle>
                <CardDescription>
                  Audit-recorded comments with strict internal vs contractor visibility control
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {visibleComments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                        comment.visibility === "internal"
                          ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50"
                          : "bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {comment.author_name}
                          </span>
                          {comment.visibility === "internal" ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-200/60 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-300">
                              <Lock className="h-2.5 w-2.5" /> INTERNAL ONLY
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
                              PROVIDER VISIBLE
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(comment.created_at, language)}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {comment.body}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Add Comment Input */}
                <form onSubmit={handleAddComment} className="pt-2 space-y-3 border-t border-slate-100 dark:border-slate-800">
                  <Textarea
                    rows={2}
                    placeholder="Enter operational note or contractor dispatch message..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    required
                  />

                  <div className="flex items-center justify-between">
                    {!isContractor ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">Visibility:</span>
                        <select
                          value={newCommentVisibility}
                          onChange={(e) => setNewCommentVisibility(e.target.value as any)}
                          className="rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                        >
                          <option value="provider_visible">Provider Visible (Contractor can see)</option>
                          <option value="internal">Internal Only (Town Square staff only)</option>
                        </select>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        All contractor replies are visible to Town Square operations staff.
                      </span>
                    )}

                    <Button type="submit" size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-xs text-white">
                      <Send className="h-3 w-3" />
                      <span>Post Note</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Timeline & Audit History (1 col) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>Status Audit Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {/* Event 1 */}
                  <div className="relative">
                    <span className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900" />
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Status changed to IN PROGRESS</p>
                    <p className="text-[11px] text-slate-500">By: Tariq Mansoor (Contractor)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Technician on-site inspection begun</p>
                    <span className="text-[10px] text-slate-400 block mt-1">1 hour ago</span>
                  </div>

                  {/* Event 2 */}
                  <div className="relative">
                    <span className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-amber-500 ring-4 ring-white dark:ring-slate-900" />
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Incident Created & Dispatched</p>
                    <p className="text-[11px] text-slate-500">By: Control-Room Operator</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Automatic routing to Apex Surveillance</p>
                    <span className="text-[10px] text-slate-400 block mt-1">2 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Community Context Card */}
            <Card className="bg-navy-900 text-white border-navy-800">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                  <Shield className="h-4 w-4" />
                  <span>SLA & Escalation Target</span>
                </div>
                <div className="text-xs space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span>Target Response:</span>
                    <span className="font-semibold text-white">4 Hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Resolution:</span>
                    <span className="font-semibold text-white">24 Hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Escalation Level:</span>
                    <span className="font-semibold text-amber-400">Level 1 (Contractor Lead)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
