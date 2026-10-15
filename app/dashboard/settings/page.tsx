"use client";

import React, { useState, useEffect } from "react";
import { User, ShieldCheck, Database, Key, HardDrive, CheckCircle2 } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  storageQuotaBytes: number;
  storageUsedBytes: number;
  createdAt: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const used = user?.storageUsedBytes || 0;
  const quota = user?.storageQuotaBytes || 10737418240;
  const percent = Math.min(100, Math.round((used / quota) * 1000) / 10);

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="pb-3 border-b border-cv-border">
        <h2 className="text-base font-bold text-cv-navy">Account &amp; Vault Settings</h2>
        <p className="text-xs text-cv-text-secondary">
          Manage your CloudVault profile, storage quota, and encryption parameters
        </p>
      </div>

      {loading ? (
        <div className="h-48 bg-white rounded-2xl border border-cv-border animate-pulse" />
      ) : user ? (
        <div className="space-y-6">
          {/* User Profile Card */}
          <div className="bg-white p-6 rounded-2xl border border-cv-border shadow-cv-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-cv-border">
              <User className="w-5 h-5 text-cv-blue" />
              <h3 className="text-sm font-bold text-cv-navy">Profile Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-cv-text-secondary block mb-1">Full Name</span>
                <div className="font-semibold text-cv-navy bg-cv-bg p-2.5 rounded-lg border border-cv-border">
                  {user.name}
                </div>
              </div>
              <div>
                <span className="text-cv-text-secondary block mb-1">Email Address</span>
                <div className="font-semibold text-cv-navy bg-cv-bg p-2.5 rounded-lg border border-cv-border">
                  {user.email}
                </div>
              </div>
              <div>
                <span className="text-cv-text-secondary block mb-1">Account Role</span>
                <div className="font-semibold text-cv-navy bg-cv-bg p-2.5 rounded-lg border border-cv-border">
                  {user.role}
                </div>
              </div>
              <div>
                <span className="text-cv-text-secondary block mb-1">Member Since</span>
                <div className="font-semibold text-cv-navy bg-cv-bg p-2.5 rounded-lg border border-cv-border">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Storage Quota Card */}
          <div className="bg-white p-6 rounded-2xl border border-cv-border shadow-cv-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-cv-border">
              <Database className="w-5 h-5 text-cv-blue" />
              <h3 className="text-sm font-bold text-cv-navy">Storage Consumption</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-cv-navy">Consumed: {formatBytes(used)}</span>
                <span className="text-cv-blue">{percent}% Used</span>
                <span className="text-cv-text-secondary">Quota: {formatBytes(quota)}</span>
              </div>

              <div className="w-full h-3 rounded-full bg-cv-border overflow-hidden">
                <div
                  className="h-full bg-cv-navy rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(1, percent)}%` }}
                />
              </div>

              <div className="p-3 bg-cv-surface-subtle/50 rounded-xl border border-cv-border text-xs text-cv-text-secondary flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cv-blue flex-shrink-0 mt-0.5" />
                <span>
                  Storage is verified against private S3 object keys and database relations. Overwriting or
                  revising files updates consumption figures accurately.
                </span>
              </div>
            </div>
          </div>

          {/* Security & Cryptography Info */}
          <div className="bg-white p-6 rounded-2xl border border-cv-border shadow-cv-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-cv-border">
              <ShieldCheck className="w-5 h-5 text-cv-blue" />
              <h3 className="text-sm font-bold text-cv-navy">Security Configuration</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl border border-cv-border bg-cv-bg/40 space-y-1">
                <div className="font-semibold text-cv-navy">Password Hashing</div>
                <div className="text-cv-text-secondary">Node.js Scrypt with 16-byte cryptographically unique salts.</div>
              </div>
              <div className="p-3 rounded-xl border border-cv-border bg-cv-bg/40 space-y-1">
                <div className="font-semibold text-cv-navy">Session Authentication</div>
                <div className="text-cv-text-secondary">HMAC-SHA256 signed session tokens in HTTP-only SameSite cookies.</div>
              </div>
              <div className="p-3 rounded-xl border border-cv-border bg-cv-bg/40 space-y-1">
                <div className="font-semibold text-cv-navy">Object Storage Driver</div>
                <div className="text-cv-text-secondary">AWS S3 SDK Client / MinIO S3 API with local fallback adapter.</div>
              </div>
              <div className="p-3 rounded-xl border border-cv-border bg-cv-bg/40 space-y-1">
                <div className="font-semibold text-cv-navy">Share Links</div>
                <div className="text-cv-text-secondary">Cryptographic 256-bit entropy, token hashed with SHA-256 before storage.</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
