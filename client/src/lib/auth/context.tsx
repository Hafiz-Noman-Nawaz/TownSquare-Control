"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/server/supabase/client";

export type UserRole = "super_admin" | "control_room_operator" | "maintenance_manager" | "contractor";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  preferred_language: "en" | "ar";
  provider_id?: string | null;
  provider_name?: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isOperator: boolean;
  isManager: boolean;
  isContractor: boolean;
  signInAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInContractor: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpContractor: (fullName: string, email: string, providerName: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  createManagedUser: (fullName: string, email: string, role: UserRole, password?: string) => Promise<{ success: boolean; error?: string }>;
  managedUsers: UserProfile[];
}

// Master Hardcoded Super Admin Credentials (for live client preview before Supabase is connected)
export const HARDCODED_ADMIN = {
  email: "admin@townsquare.ae",
  password: "TownSquareAdmin2026!",
  full_name: "Town Square Super Admin",
  role: "super_admin" as UserRole,
};

// Initial internal & contractor accounts
const INITIAL_ACCOUNTS: UserProfile[] = [
  {
    id: "u-admin-1",
    email: HARDCODED_ADMIN.email,
    full_name: HARDCODED_ADMIN.full_name,
    role: "super_admin",
    is_active: true,
    preferred_language: "en",
  },
  {
    id: "u-operator-1",
    email: "operator@townsquare.ae",
    full_name: "Control-Room Operator",
    role: "control_room_operator",
    is_active: true,
    preferred_language: "en",
  },
  {
    id: "u-manager-1",
    email: "manager@townsquare.ae",
    full_name: "Senior Maintenance Manager",
    role: "maintenance_manager",
    is_active: true,
    preferred_language: "en",
  },
  {
    id: "u-contractor-1",
    email: "contractor@apexsurv.demo",
    full_name: "Tariq Mansoor",
    role: "contractor",
    provider_name: "Apex CCTV & Surveillance Solutions",
    is_active: true,
    preferred_language: "en",
  },
];

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  isSuperAdmin: false,
  isOperator: false,
  isManager: false,
  isContractor: false,
  signInAdmin: async () => ({ success: false }),
  signInContractor: async () => ({ success: false }),
  signUpContractor: async () => ({ success: false }),
  signOut: async () => {},
  createManagedUser: async () => ({ success: false }),
  managedUsers: INITIAL_ACCOUNTS,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [managedUsers, setManagedUsers] = useState<UserProfile[]>(INITIAL_ACCOUNTS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Check local storage for existing session
    const storedUser = localStorage.getItem("ts_current_user");
    const storedManagedUsers = localStorage.getItem("ts_managed_users");

    if (storedManagedUsers) {
      try {
        setManagedUsers(JSON.parse(storedManagedUsers));
      } catch {}
    }

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch {}
    } else {
      // Default to initial contractor session for public portal preview if desired,
      // or start logged out so the user sees the login screen!
      const initialContractor = INITIAL_ACCOUNTS.find((u) => u.role === "contractor") || null;
      setUser(initialContractor);
      if (initialContractor) {
        localStorage.setItem("ts_current_user", JSON.stringify(initialContractor));
        document.cookie = `ts_user_role=${initialContractor.role}; path=/; max-age=604800; SameSite=Lax`;
      }
    }

    setIsLoading(false);
  }, []);

  const saveUserSession = (activeUser: UserProfile | null) => {
    setUser(activeUser);
    if (activeUser) {
      localStorage.setItem("ts_current_user", JSON.stringify(activeUser));
      document.cookie = `ts_user_role=${activeUser.role}; path=/; max-age=604800; SameSite=Lax`;
    } else {
      localStorage.removeItem("ts_current_user");
      document.cookie = `ts_user_role=; path=/; max-age=0; SameSite=Lax`;
    }
  };

  // 1. Super Admin Login
  const signInAdmin = async (email: string, password: string) => {
    // Check hardcoded super admin credentials
    if (
      email.trim().toLowerCase() === HARDCODED_ADMIN.email.toLowerCase() &&
      password === HARDCODED_ADMIN.password
    ) {
      const adminProfile: UserProfile = {
        id: "u-admin-1",
        email: HARDCODED_ADMIN.email,
        full_name: HARDCODED_ADMIN.full_name,
        role: "super_admin",
        is_active: true,
        preferred_language: "en",
      };
      saveUserSession(adminProfile);
      return { success: true };
    }

    // Also check any admin accounts created by super admin
    const foundAdmin = managedUsers.find(
      (u) => u.role === "super_admin" && u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (foundAdmin) {
      saveUserSession(foundAdmin);
      return { success: true };
    }

    return { success: false, error: "Invalid administrator credentials. Access is restricted." };
  };

  // 2. Service Provider / Contractor Login
  const signInContractor = async (email: string, password: string) => {
    const found = managedUsers.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (found) {
      if (!found.is_active) {
        return { success: false, error: "This account has been deactivated by the system administrator." };
      }
      saveUserSession(found);
      return { success: true };
    }

    // If testing with any contractor email, allow demo login
    const newContractor: UserProfile = {
      id: `u-${Date.now()}`,
      email: email.trim(),
      full_name: email.split("@")[0].replace(/[._-]/g, " "),
      role: "contractor",
      provider_name: "Registered Service Contractor",
      is_active: true,
      preferred_language: "en",
    };
    saveUserSession(newContractor);
    return { success: true };
  };

  // 3. Service Provider Sign Up (STRICTLY creates contractor role)
  const signUpContractor = async (fullName: string, email: string, providerName: string) => {
    const existing = managedUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      return { success: false, error: "An account with this email address already exists." };
    }

    // Role is strictly locked to 'contractor'
    const newContractor: UserProfile = {
      id: `u-${Date.now()}`,
      email: email.trim(),
      full_name: fullName.trim(),
      role: "contractor",
      provider_name: providerName.trim() || "Independent Security Contractor",
      is_active: true,
      preferred_language: "en",
    };

    const updated = [...managedUsers, newContractor];
    setManagedUsers(updated);
    localStorage.setItem("ts_managed_users", JSON.stringify(updated));
    saveUserSession(newContractor);
    return { success: true };
  };

  // 4. Super Admin User Creation (Can assign Operator, Manager, or Admin)
  const createManagedUser = async (fullName: string, email: string, role: UserRole) => {
    if (user?.role !== "super_admin") {
      return { success: false, error: "Only a Super Admin can create internal staff accounts." };
    }

    const existing = managedUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      return { success: false, error: "An account with this email already exists." };
    }

    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      email: email.trim(),
      full_name: fullName.trim(),
      role,
      is_active: true,
      preferred_language: "en",
    };

    const updated = [...managedUsers, newUser];
    setManagedUsers(updated);
    localStorage.setItem("ts_managed_users", JSON.stringify(updated));
    return { success: true };
  };

  const signOut = async () => {
    saveUserSession(null);
    window.location.href = "/login";
  };

  const role = user?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        isSuperAdmin: role === "super_admin",
        isOperator: role === "control_room_operator",
        isManager: role === "maintenance_manager",
        isContractor: role === "contractor",
        signInAdmin,
        signInContractor,
        signUpContractor,
        signOut,
        createManagedUser,
        managedUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
