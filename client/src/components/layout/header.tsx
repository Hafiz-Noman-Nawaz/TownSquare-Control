"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { Shield, Globe, LogOut, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header({ onToggleMobileMenu }: { onToggleMobileMenu?: () => void }) {
  const { language, setLanguage, t } = useLanguage();
  const { user, role, signOut } = useAuth();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

  return (
    <header className="safe-area-top sticky top-0 z-40 flex min-h-14 w-full items-center justify-between border-b border-navy-800 bg-navy-900 px-3 text-white shadow-md sm:h-16 sm:px-6">
      {/* Left: Organization & Branding */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="rounded-md p-2 text-slate-300 hover:bg-navy-800 md:hidden"
            aria-label="Toggle Navigation Menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 shadow-inner sm:h-9 sm:w-9">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-extrabold tracking-wider text-white sm:text-base">
                {t("brand.org")}
              </span>
              <span className="hidden rounded border border-blue-700/50 bg-blue-900/60 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300 sm:inline">
                CONTROL
              </span>
            </div>
            <p className="hidden text-[11px] text-slate-400 sm:block">
              {t("brand.tagline")}
            </p>
          </div>
        </div>
      </div>

      {/* Center: Community Scope Indicator */}
      <div className="hidden lg:flex items-center gap-2 rounded-full border border-navy-700 bg-navy-800/80 px-3 py-1 text-xs text-slate-300">
        <Building2 className="h-3.5 w-3.5 text-blue-400" />
        <span>Town Square Community &bull; Zones 1–4</span>
      </div>

      {/* Right: Language Switcher & User Profile */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        {/* Language Switcher */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="h-9 gap-1.5 border-navy-700 bg-navy-800 px-2 text-xs text-slate-200 hover:bg-navy-700 hover:text-white sm:px-3"
        >
          <Globe className="h-3.5 w-3.5 text-blue-400" />
          <span className="hidden sm:inline">{language === "en" ? "العربية" : "English"}</span>
        </Button>

        {/* User Info / Sign Out */}
        {user ? (
          <div className="flex items-center gap-2 border-l border-navy-800 pl-2 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-2">
            <div className="hidden text-right rtl:text-left sm:block">
              <p className="text-xs font-medium text-slate-200">{user.full_name}</p>
              <p className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold">
                {role ? role.replace(/_/g, " ") : "User"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              title={t("nav.signOut")}
              className="h-9 w-9 text-slate-400 hover:bg-navy-800 hover:text-rose-400"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <a href="/login">
            <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              Sign In
            </Button>
          </a>
        )}
      </div>
    </header>
  );
}
