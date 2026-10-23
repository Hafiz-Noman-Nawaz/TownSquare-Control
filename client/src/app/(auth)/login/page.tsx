"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Briefcase, Lock, Mail, AlertCircle, Building, User, KeyRound, ShieldAlert } from "lucide-react";

export default function ServiceProviderLoginPage() {
  const router = useRouter();
  const { signInContractor, signUpContractor } = useAuth();

  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [providerName, setProviderName] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const res = await signInContractor(email, password);
    setIsLoading(false);

    if (res.success) {
      router.push("/contractor");
    } else {
      setErrorMsg(res.error || "Failed to authenticate contractor credentials.");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const res = await signUpContractor(fullName, email, providerName, password);
    setIsLoading(false);

    if (res.success) {
      router.push("/contractor");
    } else {
      setErrorMsg(res.error || "Failed to create contractor account.");
    }
  };

  const handleAutoFillDemoContractor = () => {
    setEmail("contractor@apexsurv.demo");
    setPassword("password123");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <Briefcase className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white">
            TOWN SQUARE
          </h1>
          <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
            Service Provider & Contractor Workspace
          </p>
        </div>

        <Card className="border-navy-800 bg-navy-900 text-white shadow-2xl">
          <CardHeader className="text-center pb-2 border-b border-navy-800">
            {/* Tabs switcher: Sign In vs Sign Up */}
            <div className="grid grid-cols-2 rounded-lg bg-navy-950 p-1 mb-2 border border-navy-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("signin");
                  setErrorMsg(null);
                }}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "signin"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("signup");
                  setErrorMsg(null);
                }}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "signup"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Contractor Registration
              </button>
            </div>

            <CardTitle className="text-base text-white">
              {activeTab === "signin"
                ? "Contractor Workspace Access"
                : "Create Service Provider Account"}
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              {activeTab === "signin"
                ? "Access assigned Town Square security maintenance work orders"
                : "Public registration strictly creates an authorized Service Provider role"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-5 space-y-4">
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-md border border-rose-800 bg-rose-950/70 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {activeTab === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Contractor Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      type="email"
                      required
                      placeholder="contractor@apexsurv.demo"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 border-navy-700 bg-navy-950 text-white placeholder:text-slate-600 focus-visible:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Password
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 mt-1"
                >
                  {isLoading ? "Authenticating..." : "Access Contractor Portal"}
                </Button>

                {/* Demo Helper */}
                <div className="rounded-lg border border-navy-700 bg-navy-950/60 p-3 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Demo Contractor Creds:</span>
                  <button
                    type="button"
                    onClick={handleAutoFillDemoContractor}
                    className="text-blue-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <KeyRound className="h-3 w-3" />
                    <span>Auto-Fill Demo</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Technician / Contact Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Tariq Mansoor"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-9 border-navy-700 bg-navy-950 text-white placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Contractor Company Name
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Apex Surveillance Solutions"
                      value={providerName}
                      onChange={(e) => setProviderName(e.target.value)}
                      className="pl-9 border-navy-700 bg-navy-950 text-white placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Official Business Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      type="email"
                      required
                      placeholder="technician@company.ae"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 border-navy-700 bg-navy-950 text-white placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Set Account Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 border-navy-700 bg-navy-950 text-white placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="rounded bg-navy-950 p-2 text-[11px] text-slate-400 border border-navy-800">
                  <span className="font-semibold text-blue-400">Security Rule:</span> Public registration only provisions Service Provider accounts. Operations staff roles are delegated strictly by Super Admin.
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 mt-1"
                >
                  {isLoading ? "Creating Contractor Profile..." : "Register Service Provider"}
                </Button>
              </form>
            )}

            {/* Admin Console Access Banner */}
            <div className="pt-2 border-t border-navy-800 text-center">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Town Square Operations Staff or Super Admin? Sign In Here</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
