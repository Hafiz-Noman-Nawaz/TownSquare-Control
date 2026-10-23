"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import {
  LayoutDashboard,
  AlertTriangle,
  PlusCircle,
  Briefcase,
  Users,
  Route,
  FileSpreadsheet,
  ShieldCheck,
  Send,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ("super_admin" | "control_room_operator" | "maintenance_manager" | "contractor")[];
}

const navItems: NavItem[] = [
  {
    href: "/",
    labelKey: "nav.dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "control_room_operator", "maintenance_manager"],
  },
  {
    href: "/incidents",
    labelKey: "nav.incidents",
    icon: AlertTriangle,
    roles: ["super_admin", "control_room_operator", "maintenance_manager"],
  },
  {
    href: "/incidents/new",
    labelKey: "nav.reportNew",
    icon: PlusCircle,
    roles: ["super_admin", "control_room_operator", "maintenance_manager"],
  },
  {
    href: "/contractor",
    labelKey: "nav.contractorPortal",
    icon: Briefcase,
    roles: ["super_admin", "contractor", "maintenance_manager"],
  },
  {
    href: "/admin/routing",
    labelKey: "nav.routing",
    icon: Route,
    roles: ["super_admin"],
  },
  {
    href: "/admin/users",
    labelKey: "nav.users",
    icon: Users,
    roles: ["super_admin"],
  },
  {
    href: "/admin/outbox",
    labelKey: "nav.outbox",
    icon: Send,
    roles: ["super_admin"],
  },
  {
    href: "/admin/audit",
    labelKey: "nav.auditLogs",
    icon: ShieldCheck,
    roles: ["super_admin"],
  },
  {
    href: "/admin/reports",
    labelKey: "nav.reports",
    icon: FileSpreadsheet,
    roles: ["super_admin", "maintenance_manager"],
  },
];

export function Sidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { role, isSuperAdmin } = useAuth();

  // Filter items matching user's active role (default to contractor if not yet signed in)
  const activeRole = role || "contractor";
  const permittedItems = navItems.filter((item) => item.roles.includes(activeRole));

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-slate-900 text-slate-300 dark:border-slate-800">
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        <nav className="space-y-1">
          {permittedItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white font-semibold shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Area: Super Admin Link per user requirement */}
      <div className="border-t border-slate-800 p-3 space-y-2 text-xs">
        {isSuperAdmin ? (
          <div className="rounded-md bg-navy-950/90 p-2.5 border border-blue-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-400 text-xs">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span className="font-semibold">Super Admin Active</span>
            </div>
            <Link href="/admin/users" onClick={onCloseMobile} className="text-[10px] text-slate-400 hover:text-white underline">
              Manage
            </Link>
          </div>
        ) : (
          <Link
            href="/admin/login"
            onClick={onCloseMobile}
            className="flex items-center justify-center gap-2 w-full rounded-md bg-slate-800/80 hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors border border-slate-700/60"
          >
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span>Admin Console Access</span>
          </Link>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 px-1">
          <span>Town Square SOC</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            System Live
          </span>
        </div>
      </div>
    </aside>
  );
}
