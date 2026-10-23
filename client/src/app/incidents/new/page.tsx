"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { useLanguage } from "@/lib/i18n/context";
import { createIncidentAction } from "@/server/actions/incidents";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Camera,
  Upload,
  CheckCircle2,
  X,
  FileText,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface InitialOption {
  id: string;
  name: string;
  code?: string;
  requires_camera_number?: boolean;
  zone_id?: string;
}

const INITIAL_ZONES: InitialOption[] = [
  { id: "b0000000-0000-0000-0000-000000000001", name: "Zone 1 - Main Boulevard & Retail", code: "ZONE-1" },
  { id: "b0000000-0000-0000-0000-000000000002", name: "Zone 2 - Central Park & Recreation", code: "ZONE-2" },
  { id: "b0000000-0000-0000-0000-000000000003", name: "Zone 3 - Residential North (Zahra/Hayat)", code: "ZONE-3" },
  { id: "b0000000-0000-0000-0000-000000000004", name: "Zone 4 - Residential South (Noor/Rawda)", code: "ZONE-4" },
];

const INITIAL_SITES: InitialOption[] = [
  { id: "c0000000-0000-0000-0000-000000000001", name: "Main Entry Gatehouse A", zone_id: "b0000000-0000-0000-0000-000000000001" },
  { id: "c0000000-0000-0000-0000-000000000002", name: "Retail Plaza IDF Room 1", zone_id: "b0000000-0000-0000-0000-000000000001" },
  { id: "c0000000-0000-0000-0000-000000000003", name: "Central Park Pavilion", zone_id: "b0000000-0000-0000-0000-000000000002" },
  { id: "c0000000-0000-0000-0000-000000000004", name: "Zahra Substation Perimeter", zone_id: "b0000000-0000-0000-0000-000000000003" },
  { id: "c0000000-0000-0000-0000-000000000005", name: "Noor Entry Barrier 2", zone_id: "b0000000-0000-0000-0000-000000000004" },
];

const INITIAL_CATEGORIES: InitialOption[] = [
  { id: "d0000000-0000-0000-0000-000000000001", name: "CCTV Camera", requires_camera_number: true },
  { id: "d0000000-0000-0000-0000-000000000002", name: "NVR Issue", requires_camera_number: false },
  { id: "d0000000-0000-0000-0000-000000000003", name: "ANPR Issue", requires_camera_number: true },
  { id: "d0000000-0000-0000-0000-000000000004", name: "UPS", requires_camera_number: false },
  { id: "d0000000-0000-0000-0000-000000000005", name: "Barrier", requires_camera_number: false },
  { id: "d0000000-0000-0000-0000-000000000006", name: "Other Security Equipment", requires_camera_number: false },
];

export default function NewIncidentPage() {
  const { t } = useLanguage();

  const [zoneId, setZoneId] = useState<string>(INITIAL_ZONES[0].id);
  const [siteId, setSiteId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>(INITIAL_CATEGORIES[0].id);
  const [cameraNumber, setCameraNumber] = useState<string>("");
  const [exactLocation, setExactLocation] = useState<string>("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [description, setDescription] = useState<string>("");

  const [photos, setPhotos] = useState<{ name: string; preview: string; size: number; base64: string; type: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<{ ticketNumber: string; incidentId: string } | null>(null);

  // Filter sites based on selected zone
  const availableSites = INITIAL_SITES.filter((site) => site.zone_id === zoneId);
  const selectedCategory = INITIAL_CATEGORIES.find((c) => c.id === categoryId);
  const requiresCamera = selectedCategory?.requires_camera_number ?? false;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validMimes = ["image/jpeg", "image/png", "image/webp"];
    const maxSizeBytes = 15 * 1024 * 1024; // 15MB

    Array.from(files).forEach((file) => {
      if (!validMimes.includes(file.type)) {
        alert(`Unsupported file format (${file.type}). Only JPG, PNG, and WEBP allowed.`);
        return;
      }
      if (file.size > maxSizeBytes) {
        alert(`File ${file.name} exceeds 15MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1];
        setPhotos((prev) => [
          ...prev.slice(0, 4), // max 5 photos
          {
            name: file.name,
            preview: URL.createObjectURL(file),
            size: file.size,
            base64: base64String,
            type: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    // Camera validation
    if (requiresCamera && !cameraNumber.trim()) {
      setErrorMsg("Camera reference number is mandatory for this equipment category.");
      setIsSubmitting(false);
      return;
    }

    try {
      const formattedPhotos = photos.map((p) => ({
        filename: p.name,
        contentType: p.type,
        sizeBytes: p.size,
        base64Data: p.base64,
      }));

      const res = await createIncidentAction(
        {
          zone_id: zoneId,
          site_id: siteId || undefined,
          category_id: categoryId,
          camera_number: cameraNumber.trim() || undefined,
          exact_location: exactLocation.trim(),
          priority,
          description: description.trim(),
          requires_camera_number: requiresCamera,
        },
        formattedPhotos
      );

      if (!res.success || !res.ticketNumber) {
        setErrorMsg(res.error || "Failed to submit incident");
      } else {
        setCreatedTicket({
          ticketNumber: res.ticketNumber,
          incidentId: res.incidentId || "",
        });
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Submission error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <span>Town Square</span>
            <span>/</span>
            <span>Security Operations Center</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            {t("incidentForm.title")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("incidentForm.subtitle")}
          </p>
        </div>

        {/* Success Confirmation Modal / Card */}
        {createdTicket ? (
          <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <CardContent className="p-8 text-center space-y-5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t("incidentForm.successTitle")}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {t("incidentForm.successMsg")}
                </p>
              </div>

              <div className="inline-block rounded-lg border border-emerald-300 bg-white px-6 py-3 shadow-sm dark:border-emerald-800 dark:bg-slate-900">
                <span className="text-xs uppercase tracking-wider text-slate-400 block font-semibold">
                  Official Reference
                </span>
                <span className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                  {createdTicket.ticketNumber}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <Link href="/incidents">
                  <Button variant="default" className="gap-2">
                    <span>View All Incidents</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreatedTicket(null);
                    setDescription("");
                    setPhotos([]);
                    setCameraNumber("");
                  }}
                >
                  Log Another Incident
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="flex items-center gap-3 rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Location & Equipment Classification Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-blue-600" />
                  <span>Equipment & Location Classification</span>
                </CardTitle>
                <CardDescription>
                  Specify the Town Square operational zone and security hardware asset
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Zone Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      {t("incidentForm.zoneLabel")} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={zoneId}
                      onChange={(e) => {
                        setZoneId(e.target.value);
                        setSiteId("");
                      }}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      {INITIAL_ZONES.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Site Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      {t("incidentForm.siteLabel")}
                    </label>
                    <select
                      value={siteId}
                      onChange={(e) => setSiteId(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="">-- General Zone Area --</option>
                      {availableSites.map((site) => (
                        <option key={site.id} value={site.id}>
                          {site.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      {t("incidentForm.categoryLabel")} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      {INITIAL_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Camera / Asset Reference Number */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        {t("incidentForm.cameraNumberLabel")}
                        {requiresCamera && <span className="text-rose-500"> *</span>}
                      </label>
                      {requiresCamera && (
                        <span className="text-[10px] text-amber-600 font-medium">Mandatory for CCTV/ANPR</span>
                      )}
                    </div>
                    <Input
                      placeholder={t("incidentForm.cameraNumberPlaceholder")}
                      value={cameraNumber}
                      onChange={(e) => setCameraNumber(e.target.value)}
                      required={requiresCamera}
                    />
                  </div>
                </div>

                {/* Exact Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {t("incidentForm.exactLocationLabel")} <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder={t("incidentForm.exactLocationPlaceholder")}
                    value={exactLocation}
                    onChange={(e) => setExactLocation(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Incident Details & Priority Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>Fault Details & Priority</span>
                </CardTitle>
                <CardDescription>
                  Describe the diagnostic observations and urgency level for dispatch
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Priority Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {t("incidentForm.priorityLabel")}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPriority("low")}
                      className={`flex flex-col items-center justify-center p-3 rounded-md border text-center transition-all ${
                        priority === "low"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 font-bold dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                      }`}
                    >
                      <span className="text-sm">Low</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Non-critical / Routine</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPriority("medium")}
                      className={`flex flex-col items-center justify-center p-3 rounded-md border text-center transition-all ${
                        priority === "medium"
                          ? "border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20 font-bold dark:bg-amber-950/40 dark:text-amber-300"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                      }`}
                    >
                      <span className="text-sm">Medium</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Standard Operational</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPriority("high")}
                      className={`flex flex-col items-center justify-center p-3 rounded-md border text-center transition-all ${
                        priority === "high"
                          ? "border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20 font-bold dark:bg-rose-950/40 dark:text-rose-300"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                      }`}
                    >
                      <span className="text-sm">High Urgency</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Security Perimeter Impact</span>
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {t("incidentForm.descriptionLabel")} <span className="text-rose-500">*</span>
                  </label>
                  <Textarea
                    rows={4}
                    placeholder={t("incidentForm.descriptionPlaceholder")}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Photo Attachment Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="h-4 w-4 text-blue-600" />
                  <span>{t("incidentForm.photoLabel")}</span>
                </CardTitle>
                <CardDescription>{t("incidentForm.photoHelp")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100">
                      <img src={photo.preview} alt="Attachment" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {photos.length < 5 && (
                    <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 cursor-pointer dark:border-slate-700 dark:hover:border-blue-500 transition-colors">
                      <Upload className="h-5 w-5 text-slate-400 mb-1" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Upload Photo</span>
                      <span className="text-[10px] text-slate-400">JPG, PNG, WEBP</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href="/incidents">
                <Button type="button" variant="outline">
                  {t("common.cancel")}
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 font-semibold"
              >
                {isSubmitting ? t("incidentForm.submitting") : t("incidentForm.submitBtn")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
