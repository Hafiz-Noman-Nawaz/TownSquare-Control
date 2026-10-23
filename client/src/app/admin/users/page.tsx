"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/shell";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth, type UserRole } from "@/lib/auth/context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, ShieldAlert, CheckCircle2, XCircle, Lock, Shield, KeyRound, AlertCircle } from "lucide-react";

export default function UserManagementPage() {
  const { t } = useLanguage();
  const { isSuperAdmin, managedUsers, createManagedUser } = useAuth();

  const [users, setUsers] = useState(managedUsers);
  const [showAddModal, setShowAddModal] = useState(false);

  // New User Form State
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("control_room_operator");
  const [newPassword, setNewPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Sync state if managedUsers updates in context
  React.useEffect(() => {
    setUsers(managedUsers);
  }, [managedUsers]);

  // Route protection view if not Super Admin
  if (!isSuperAdmin) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card className="max-w-md w-full border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-center p-6 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Super Admin Access Required
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                User account delegation, password management, and role provisioning are restricted to authenticated Super Administrators.
              </p>
            </div>
            <Link href="/admin/login">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                Sign In to Super Admin Console
              </Button>
            </Link>
          </Card>
        </div>
      </AppShell>
    );
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const res = await createManagedUser(newFullName, newEmail, newRole, newPassword);
    if (!res.success) {
      setFormError(res.error || "Failed to create user account.");
    } else {
      setFormSuccess(`Account for ${newFullName} (${newRole.replace(/_/g, " ")}) created successfully.`);
      setNewFullName("");
      setNewEmail("");
      setNewPassword("");
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess(null);
      }, 1500);
    }
  };

  const toggleUserStatus = (id: string) => {
    const userToToggle = users.find((u) => u.id === id);
    if (userToToggle?.role === "super_admin" && userToToggle.is_active) {
      const activeAdmins = users.filter((u) => u.role === "super_admin" && u.is_active);
      if (activeAdmins.length <= 1) {
        alert("Protection constraint: Cannot deactivate the only remaining active Super Admin.");
        return;
      }
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, is_active: !u.is_active } : u))
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t("nav.users")}
              </h1>
              <span className="rounded bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 border border-amber-300">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Authorized personnel directory, role delegations, and password provisioning
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 font-semibold"
          >
            <UserPlus className="h-4 w-4" />
            <span>Create New User & Assign Role</span>
          </Button>
        </div>

        {/* Modal / Dialog for Adding New User */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <Card className="w-full max-w-lg shadow-2xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <span>Provision New System Account</span>
                </CardTitle>
                <CardDescription>
                  Configure official credentials and role permissions for Town Square operations
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {formError && (
                  <div className="mb-4 flex items-center gap-2 rounded bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                {formSuccess && (
                  <div className="mb-4 flex items-center gap-2 rounded bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Full Name
                    </label>
                    <Input
                      required
                      placeholder="e.g. Omar Al-Zaabi"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Official Email Address
                    </label>
                    <Input
                      type="email"
                      required
                      placeholder="o.alzaabi@townsquare.ae"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Role & Permissions Assignment
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                      className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                    >
                      <option value="control_room_operator">Control-Room Operator (Fast incident reporting & triage)</option>
                      <option value="maintenance_manager">Maintenance Manager (Assignment, approvals, resolution)</option>
                      <option value="super_admin">Super Admin (System configuration & full access)</option>
                      <option value="contractor">Service Provider (Contractor portal only)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Initial Password
                    </label>
                    <Input
                      type="password"
                      required
                      placeholder="Assign temporary password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                      Create & Authorize Account
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Accounts Directory Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>System Accounts & Role Directory</span>
              <span className="text-xs font-normal text-slate-400">{users.length} registered accounts</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 rtl:text-right">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3.5 font-bold">User</th>
                    <th className="px-4 py-3.5 font-bold">Assigned Role</th>
                    <th className="px-4 py-3.5 font-bold">Affiliation</th>
                    <th className="px-4 py-3.5 font-bold">Account State</th>
                    <th className="px-4 py-3.5 font-bold text-center">Lifecycle Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">
                            {u.full_name}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          u.role === "super_admin"
                            ? "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-400"
                            : u.role === "control_room_operator"
                            ? "bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950 dark:text-blue-400"
                            : u.role === "maintenance_manager"
                            ? "bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950 dark:text-purple-400"
                            : "bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-300"
                        }`}>
                          {u.role.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {u.provider_name || <span className="text-slate-400">Town Square Internal SOC</span>}
                      </td>
                      <td className="px-4 py-3">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800">
                            <XCircle className="h-3 w-3" /> Deactivated
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(u.id)}
                          className={`text-xs h-7 ${
                            u.is_active
                              ? "border-rose-300 text-rose-700 hover:bg-rose-50"
                              : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
