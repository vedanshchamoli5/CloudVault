"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  HardDrive,
  Clock,
  Star,
  Trash2,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  Database,
} from "lucide-react";
import { ToastProvider } from "@/components/Toast";

interface UserInfo {
  name: string;
  email: string;
}

interface StorageUsage {
  storageQuotaBytes: number;
  storageUsedBytes: number;
  usedPercentage: number;
  fileCount: number;
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [storageData, setStorageData] = useState<StorageUsage>({
    storageQuotaBytes: 10737418240,
    storageUsedBytes: 0,
    usedPercentage: 0,
    fileCount: 0,
  });

  useEffect(() => {
    // Fetch authenticated user
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => router.push("/login"));

    // Fetch storage metrics
    fetch("/api/user/storage")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStorageData(data);
      })
      .catch(() => {});
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const navItems = [
    { label: "My Files", href: "/dashboard", icon: HardDrive },
    { label: "Recent", href: "/dashboard/recent", icon: Clock },
    { label: "Starred", href: "/dashboard/starred", icon: Star },
    { label: "Trash", href: "/dashboard/trash", icon: Trash2 },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-cv-bg flex text-cv-text-main selection:bg-cv-blue-pale">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-cv-border fixed inset-y-0 z-30">
        {/* Brand Logo */}
        <div className="h-20 px-6 border-b border-cv-border flex items-center justify-between">
          <Link href="/dashboard" className="relative w-36 h-9">
            <Image
              src="/brand/cloudvault-logo.svg"
              alt="CloudVault"
              fill
              priority
              className="object-contain object-left"
            />
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-cv-surface-subtle text-cv-navy border border-cv-border shadow-cv-sm"
                    : "text-cv-text-secondary hover:text-cv-navy hover:bg-cv-bg"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${isActive ? "text-cv-blue" : "text-cv-blue-muted"}`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-cv-blue" />}
              </Link>
            );
          })}
        </nav>

        {/* Real Storage Quota Progress Card */}
        <div className="p-4 border-t border-cv-border">
          <div className="p-4 rounded-xl bg-cv-bg border border-cv-border space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-cv-navy flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cv-blue" />
                <span>Vault Storage</span>
              </span>
              <span className="text-[11px] font-semibold text-cv-blue">
                {storageData.usedPercentage}%
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-cv-border overflow-hidden">
              <div
                className="h-full bg-cv-navy rounded-full transition-all duration-500"
                style={{ width: `${Math.max(2, storageData.usedPercentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-cv-text-secondary font-medium">
              <span>{formatBytes(storageData.storageUsedBytes)}</span>
              <span>of {formatBytes(storageData.storageQuotaBytes)}</span>
            </div>
          </div>
        </div>

        {/* Authenticated User Menu Footer */}
        <div className="p-4 border-t border-cv-border flex items-center justify-between bg-cv-bg/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-cv-surface-subtle border border-cv-border flex items-center justify-center font-bold text-xs text-cv-navy flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-cv-navy truncate">{user?.name || "User"}</div>
              <div className="text-[10px] text-cv-text-secondary truncate">{user?.email || "user@vault"}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-cv-text-secondary hover:text-cv-danger rounded-lg hover:bg-white"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-cv-navy/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 bg-white flex flex-col h-full z-10 border-r border-cv-border">
            <div className="h-16 px-6 border-b border-cv-border flex items-center justify-between">
              <Link href="/dashboard" className="relative w-32 h-8">
                <Image
                  src="/brand/cloudvault-logo.svg"
                  alt="CloudVault"
                  fill
                  className="object-contain object-left"
                />
              </Link>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-cv-navy">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1 flex-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive
                        ? "bg-cv-surface-subtle text-cv-navy border border-cv-border"
                        : "text-cv-text-secondary"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-cv-blue" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-cv-border">
              <button
                onClick={handleLogout}
                className="w-full py-2 px-3 rounded-lg bg-cv-bg text-cv-danger text-xs font-semibold flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile Top Header */}
        <header className="lg:hidden h-16 bg-white border-b border-cv-border px-4 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-cv-navy hover:bg-cv-bg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="relative w-32 h-8">
            <Image
              src="/brand/cloudvault-logo.svg"
              alt="CloudVault"
              fill
              className="object-contain"
            />
          </div>
          <div className="w-6" />
        </header>

        {/* Page Children */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DashboardShell>{children}</DashboardShell>
    </ToastProvider>
  );
}
