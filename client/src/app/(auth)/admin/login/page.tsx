"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, HARDCODED_ADMIN } from "@/lib/auth/context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, Lock, Mail, AlertCircle, ArrowLeft, KeyRound } from "lucide-react";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { signInAdmin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const result = await signInAdmin(email, password);
    setIsLoading(false);

    if (result.success) {
      router.push("/admin/users");
    } else {
      setErrorMsg(result.error || "Access Denied: Invalid Super Admin credentials.");
    }
  };

  const handleFillDemoAdmin = () => {
    setEmail(HARDCODED_ADMIN.email);
    setPassword(HARDCODED_ADMIN.password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 shadow-xl shadow-blue-900/40 border border-blue-500/30">
            <ShieldAlert className="h-9 w-9 text-white" />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-950/80 px-3 py-1 text-xs font-semibold text-blue-300 border border-blue-800">
            <span>TOWN SQUARE SOC</span>
            <span>&bull;</span>
            <span className="text-amber-400">SUPER ADMIN CONSOLE</span>
          </div>
          <h1 className="text-2xl font-black tracking-wide text-white">
            Administrative Access
          </h1>
          <p className="text-xs text-slate-400">
            Restricted to authenticated Town Square Operations Administrators
          </p>
        </div>

        <Card className="border-navy-800 bg-navy-900 text-white shadow-2xl">
          <CardHeader className="text-center pb-4 border-b border-navy-800">
            <CardTitle className="text-base text-white flex items-center justify-center gap-2">
              <Lock className="h-4 w-4 text-amber-400" />
              <span>Super Administrator Login</span>
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Direct elevated control for user delegation, routing, and audit logs.
              <span className="block text-rose-400/80 mt-1 font-medium">Public registration is strictly disabled for this portal.</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-5">
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-md border border-rose-800 bg-rose-950/70 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAdminSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Super Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    required
                    placeholder="admin@townsquare.ae"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 border-navy-700 bg-navy-950 text-white placeholder:text-slate-600 focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Master Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 border-navy-700 bg-navy-950 text-white placeholder:text-slate-600 focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 mt-2"
              >
                {isLoading ? "Authenticating..." : "Authorize Admin Session"}
              </Button>
            </form>

            {/* Client Demonstration Helper */}
            <div className="rounded-lg border border-amber-900/60 bg-amber-950/20 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                  <span>Preview Credentials</span>
                </span>
                <button
                  type="button"
                  onClick={handleFillDemoAdmin}
                  className="text-[11px] text-blue-400 hover:underline font-semibold"
                >
                  Click to Auto-Fill
                </button>
              </div>
              <div className="font-mono text-[11px] text-slate-300 space-y-0.5 bg-navy-950/90 p-2 rounded border border-navy-800">
                <div>Email: <span className="text-white">{HARDCODED_ADMIN.email}</span></div>
                <div>Password: <span className="text-white">{HARDCODED_ADMIN.password}</span></div>
              </div>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Service Provider / Contractor Portal</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
