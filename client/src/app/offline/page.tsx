"use client";

import React from "react";
import { Shield, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 p-4 text-white">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-800 border border-navy-700 text-blue-400">
          <WifiOff className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight">Offline Connection Mode</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            TownSquare Control requires an active secure network connection to query live incidents,
            upload photos, or submit contractor reports. No sensitive security data is cached offline.
          </p>
        </div>

        <Button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Network Connection</span>
        </Button>
      </div>
    </div>
  );
}
