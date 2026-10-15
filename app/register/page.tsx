"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cv-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-cv-blue-pale">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        <Link href="/" className="inline-block relative w-48 h-12">
          <Image
            src="/brand/cloudvault-logo.svg"
            alt="CloudVault"
            fill
            priority
            className="object-contain"
          />
        </Link>
        <h2 className="text-2xl font-extrabold text-cv-navy tracking-tight">Create your Vault Account</h2>
        <p className="text-xs text-cv-text-secondary">
          Get 10 GB of private, secure cloud storage with encrypted sharing
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-cv-border shadow-cv-md space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-cv-danger-subtle border border-cv-danger/20 flex items-center gap-3 text-xs font-medium text-cv-danger">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-cv-navy mb-1.5">Full name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cv-text-secondary">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Vedansh Chamoli"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-cv-border text-sm text-cv-text-main focus:border-cv-blue focus:ring-1 focus:ring-cv-blue transition-colors bg-cv-bg/40 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cv-navy mb-1.5">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cv-text-secondary">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vedansh@cloudvault.dev"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-cv-border text-sm text-cv-text-main focus:border-cv-blue focus:ring-1 focus:ring-cv-blue transition-colors bg-cv-bg/40 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cv-navy mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cv-text-secondary">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-cv-border text-sm text-cv-text-main focus:border-cv-blue focus:ring-1 focus:ring-cv-blue transition-colors bg-cv-bg/40 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-cv-navy hover:bg-cv-blue text-white text-sm font-semibold shadow-cv-sm hover:shadow-cv-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Vault Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-cv-text-secondary">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-cv-blue hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
