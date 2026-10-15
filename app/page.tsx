"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  FolderTree,
  UploadCloud,
  FileSearch,
  Share2,
  History,
  Lock,
  ArrowRight,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  FileText,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const showcaseSlides = [
    {
      title: "Clean File & Folder Navigation",
      category: "ORGANIZATION",
      description:
        "Seamlessly organize files into deeply nested folders. Switch between high-density list and visual grid modes with instant search and category filtering.",
      features: ["Nested folder hierarchies", "Image thumbnail previews", "Instant keyword search", "Custom sort orders"],
      highlight: "Explorer View",
    },
    {
      title: "Non-Destructive File Versioning",
      category: "VERSION CONTROL",
      description:
        "Every file edit or replacement preserves previous versions in private object storage. Inspect historical timestamps, compare file sizes, and restore prior versions in a single click.",
      features: ["Cryptographic SHA-256 checksums", "Immutable historical copies", "One-click version rollback", "Audit event trail"],
      highlight: "Version Engine",
    },
    {
      title: "Cryptographic Private Share Links",
      category: "SECURITY & SHARING",
      description:
        "Share files with clients or teammates using time-bound links. Raw tokens are never stored in plaintext—only SHA-256 hashes exist in the database.",
      features: ["Hashed share tokens", "Configurable expiration dates", "View-only or download modes", "Instant link revocation"],
      highlight: "Access Control",
    },
  ];

  // Auto-advance showcase carousel every 6s unless interacted
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % showcaseSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [showcaseSlides.length]);

  return (
    <div className="min-h-screen bg-cv-bg text-cv-text-main flex flex-col selection:bg-cv-blue-pale selection:text-cv-navy">
      {/* 1. PUBLIC NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-cv-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-44 h-10">
              <Image
                src="/brand/cloudvault-logo.svg"
                alt="CloudVault"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-cv-text-secondary">
            <a href="#features" className="hover:text-cv-navy transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-cv-navy transition-colors">
              How It Works
            </a>
            <a href="#showcase" className="hover:text-cv-navy transition-colors">
              Showcase
            </a>
            <a href="#security" className="hover:text-cv-navy transition-colors">
              Security
            </a>
          </nav>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-cv-navy hover:text-cv-blue transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-cv-navy hover:bg-cv-blue rounded-lg shadow-cv-sm hover:shadow-cv-md transition-all flex items-center gap-2 group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-cv-navy rounded-lg hover:bg-cv-surface-subtle"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-cv-border bg-white px-4 pt-3 pb-6 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-cv-text-main"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-cv-text-main"
            >
              How It Works
            </a>
            <a
              href="#showcase"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-cv-text-main"
            >
              Showcase
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-cv-text-main"
            >
              Security
            </a>
            <div className="pt-4 border-t border-cv-border flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full text-center py-2.5 text-sm font-semibold text-cv-navy bg-cv-surface-subtle rounded-lg"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="w-full text-center py-2.5 text-sm font-semibold text-white bg-cv-navy rounded-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-b from-white via-cv-bg to-cv-bg border-b border-cv-border">
        {/* Subtle Background Geometry */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-r from-cv-blue-pale/40 via-cv-surface-subtle to-cv-blue-pale/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Header */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cv-surface-subtle border border-cv-border text-xs font-semibold text-cv-navy">
              <ShieldCheck className="w-4 h-4 text-cv-blue" />
              <span>Private S3 Storage &amp; Cryptographic Sharing</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-cv-navy tracking-tight leading-[1.15]">
              Your digital world, <br />
              <span className="text-cv-blue">beautifully organized.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-lg sm:text-xl text-cv-text-secondary leading-relaxed max-w-2xl mx-auto">
              Keep your documents, photos, and projects in one secure place. Organize effortlessly, share
              confidently, and stay in control of every file.
            </p>

            {/* CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-cv-navy hover:bg-cv-blue text-white text-base font-semibold shadow-cv-md hover:shadow-cv-lg transition-all flex items-center justify-center gap-2 group"
              >
                <span>Start with CloudVault</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-white hover:bg-cv-surface-subtle text-cv-navy border border-cv-border text-base font-semibold shadow-cv-sm transition-all text-center"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* Hero Visual: Realistic Layered CloudVault Dashboard Composition */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="relative rounded-2xl border border-cv-border bg-white shadow-cv-xl p-3 sm:p-5 overflow-hidden">
              {/* Window Chrome Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-cv-border">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cv-border" />
                  <span className="w-3 h-3 rounded-full bg-cv-border" />
                  <span className="w-3 h-3 rounded-full bg-cv-border" />
                  <span className="ml-3 text-xs font-semibold text-cv-text-secondary">
                    CloudVault Explorer — /Work/Production-V2
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-cv-blue bg-cv-surface-subtle px-3 py-1 rounded-md border border-cv-border">
                  <ShieldCheck className="w-3.5 h-3.5 text-cv-blue" />
                  <span>S3 Bucket Encrypted</span>
                </div>
              </div>

              {/* Mock Dashboard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Mock Sidebar */}
                <div className="hidden md:block col-span-1 border-r border-cv-border pr-4 space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-cv-surface-subtle text-cv-navy font-semibold text-xs">
                      <HardDrive className="w-4 h-4 text-cv-blue" />
                      <span>All Files</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-cv-text-secondary font-medium text-xs">
                      <FolderTree className="w-4 h-4 text-cv-blue-muted" />
                      <span>Folders (14)</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-cv-text-secondary font-medium text-xs">
                      <Share2 className="w-4 h-4 text-cv-blue-muted" />
                      <span>Shared Links</span>
                    </div>
                  </div>
                  {/* Storage Meter */}
                  <div className="p-3 rounded-lg bg-cv-bg border border-cv-border space-y-2">
                    <div className="flex justify-between text-[11px] font-semibold text-cv-navy">
                      <span>Storage</span>
                      <span>12.4 GB / 50 GB</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-cv-border overflow-hidden">
                      <div className="w-1/4 h-full bg-cv-blue rounded-full" />
                    </div>
                    <p className="text-[10px] text-cv-text-secondary">24.8% of quota consumed</p>
                  </div>
                </div>

                {/* Mock File Cards */}
                <div className="col-span-1 md:col-span-3 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Item 1: Folder */}
                    <div className="p-3 rounded-xl border border-cv-border bg-cv-bg hover:bg-white transition-all space-y-2">
                      <div className="flex items-center justify-between">
                        <FolderTree className="w-7 h-7 text-cv-blue" />
                        <span className="text-[10px] font-bold text-cv-blue-muted bg-cv-surface-subtle px-1.5 py-0.5 rounded">
                          FOLDER
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-cv-navy truncate">Architecture_Specs</div>
                      <div className="text-[11px] text-cv-text-secondary">12 items • 42 MB</div>
                    </div>

                    {/* Item 2: PDF File */}
                    <div className="p-3 rounded-xl border border-cv-blue-pale bg-white shadow-cv-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <FileText className="w-7 h-7 text-cv-blue" />
                        <span className="text-[10px] font-bold text-cv-blue bg-cv-blue-pale px-1.5 py-0.5 rounded">
                          v3 ACTIVE
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-cv-navy truncate">CloudVault_Spec.pdf</div>
                      <div className="text-[11px] text-cv-text-secondary">4.2 MB • Updated 2h ago</div>
                    </div>

                    {/* Item 3: Shared File */}
                    <div className="p-3 rounded-xl border border-cv-border bg-cv-bg hover:bg-white transition-all space-y-2">
                      <div className="flex items-center justify-between">
                        <KeyRound className="w-7 h-7 text-cv-navy" />
                        <span className="text-[10px] font-bold text-cv-navy bg-cv-surface-subtle px-1.5 py-0.5 rounded">
                          PASSCODE
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-cv-navy truncate">Financial_Report.csv</div>
                      <div className="text-[11px] text-cv-text-secondary">1.8 MB • Link Active</div>
                    </div>
                  </div>

                  {/* Mock Detailed File Row */}
                  <div className="p-3 rounded-xl border border-cv-border bg-cv-surface-subtle/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-cv-border flex items-center justify-center font-bold text-cv-blue">
                        SVG
                      </div>
                      <div>
                        <div className="font-semibold text-cv-navy">cloudvault-branding-system.svg</div>
                        <div className="text-[11px] text-cv-text-secondary">Version 2 • 840 KB • S3 Direct</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline-block text-[11px] text-cv-text-secondary">
                        Presigned Download Ready
                      </span>
                      <button className="px-3 py-1 bg-white border border-cv-border text-cv-navy rounded font-semibold text-xs hover:bg-cv-bg">
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="py-20 bg-white border-b border-cv-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-bold text-cv-blue uppercase tracking-widest">Architected for Scale</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-cv-navy tracking-tight">
              Engineered for absolute control over your assets
            </h3>
            <p className="text-cv-text-secondary text-base">
              From multi-version file lifecycles to cryptographically verified sharing links, CloudVault delivers
              enterprise precision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-cv-bg border border-cv-border hover:border-cv-blue/40 transition-all shadow-cv-sm hover:shadow-cv-md space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-white border border-cv-border flex items-center justify-center text-cv-navy group-hover:text-cv-blue group-hover:border-cv-blue/30 transition-colors">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-cv-navy">Private Object Storage</h4>
              <p className="text-sm text-cv-text-secondary leading-relaxed">
                Buckets remain strictly private. Direct access is denied by default; files are served exclusively
                through authenticated, short-lived presigned URLs.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-cv-bg border border-cv-border hover:border-cv-blue/40 transition-all shadow-cv-sm hover:shadow-cv-md space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-white border border-cv-border flex items-center justify-center text-cv-navy group-hover:text-cv-blue group-hover:border-cv-blue/30 transition-colors">
                <FolderTree className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-cv-navy">Deeply Nested Folders</h4>
              <p className="text-sm text-cv-text-secondary leading-relaxed">
                Organize projects with unlimited depth. Recursive folder relations in PostgreSQL provide lightning-fast
                breadcrumb trails and seamless move operations.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-cv-bg border border-cv-border hover:border-cv-blue/40 transition-all shadow-cv-sm hover:shadow-cv-md space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-white border border-cv-border flex items-center justify-center text-cv-navy group-hover:text-cv-blue group-hover:border-cv-blue/30 transition-colors">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-cv-navy">Fast, Validated Uploads</h4>
              <p className="text-sm text-cv-text-secondary leading-relaxed">
                Drag-and-drop or select multiple files. Server-side validation inspects size bounds and user quotas
                prior to storage writes, logging SHA-256 integrity hashes.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-cv-bg border border-cv-border hover:border-cv-blue/40 transition-all shadow-cv-sm hover:shadow-cv-md space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-white border border-cv-border flex items-center justify-center text-cv-navy group-hover:text-cv-blue group-hover:border-cv-blue/30 transition-colors">
                <FileSearch className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-cv-navy">In-Browser File Previews</h4>
              <p className="text-sm text-cv-text-secondary leading-relaxed">
                Inspect image thumbnails, read markdown documentation, view PDFs, and examine source code without
                needing to download files to your local drive.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-cv-bg border border-cv-border hover:border-cv-blue/40 transition-all shadow-cv-sm hover:shadow-cv-md space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-white border border-cv-border flex items-center justify-center text-cv-navy group-hover:text-cv-blue group-hover:border-cv-blue/30 transition-colors">
                <Share2 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-cv-navy">Hashed Share Links</h4>
              <p className="text-sm text-cv-text-secondary leading-relaxed">
                Tokens are cryptographically generated and stored as SHA-256 digests. Configure download limits,
                strict expiration timestamps, or instant revocation.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-cv-bg border border-cv-border hover:border-cv-blue/40 transition-all shadow-cv-sm hover:shadow-cv-md space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-white border border-cv-border flex items-center justify-center text-cv-navy group-hover:text-cv-blue group-hover:border-cv-blue/30 transition-colors">
                <History className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-cv-navy">Immutable Version History</h4>
              <p className="text-sm text-cv-text-secondary leading-relaxed">
                Never fear overwriting critical data. Every update increments version numbers, keeps historical copies
                intact in S3, and supports one-click rollback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-cv-bg border-b border-cv-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-bold text-cv-blue uppercase tracking-widest">Streamlined Flow</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-cv-navy tracking-tight">
              Three simple steps to complete file sovereignty
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-2xl border border-cv-border shadow-cv-sm space-y-4 relative">
              <div className="w-10 h-10 rounded-full bg-cv-surface-subtle text-cv-navy font-bold flex items-center justify-center text-sm border border-cv-border">
                01
              </div>
              <h4 className="text-xl font-bold text-cv-navy">Upload your files</h4>
              <p className="text-sm text-cv-text-secondary leading-relaxed">
                Drag-and-drop single files or multi-file batches. The server computes cryptographic checksums, checks
                your remaining quota, and streams directly into S3.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-2xl border border-cv-border shadow-cv-sm space-y-4 relative">
              <div className="w-10 h-10 rounded-full bg-cv-surface-subtle text-cv-navy font-bold flex items-center justify-center text-sm border border-cv-border">
                02
              </div>
              <h4 className="text-xl font-bold text-cv-navy">Organize into folders</h4>
              <p className="text-sm text-cv-text-secondary leading-relaxed">
                Structure files with nested folders, star your most critical documents, filter by file type, and preview
                assets directly within your browser.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-2xl border border-cv-border shadow-cv-sm space-y-4 relative">
              <div className="w-10 h-10 rounded-full bg-cv-surface-subtle text-cv-navy font-bold flex items-center justify-center text-sm border border-cv-border">
                03
              </div>
              <h4 className="text-xl font-bold text-cv-navy">Share on your terms</h4>
              <p className="text-sm text-cv-text-secondary leading-relaxed">
                Generate secure sharing links with configurable expiration, download limits, and view-only permissions.
                Revoke access at any moment with immediate effect.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRODUCT SHOWCASE CAROUSEL */}
      <section id="showcase" className="py-20 bg-white border-b border-cv-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
            <h2 className="text-xs font-bold text-cv-blue uppercase tracking-widest">Interactive Showcase</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-cv-navy tracking-tight">
              Designed for everyday engineering productivity
            </h3>
          </div>

          {/* Carousel Component */}
          <div className="max-w-4xl mx-auto bg-cv-bg rounded-2xl border border-cv-border p-6 sm:p-10 shadow-cv-md">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Left Column: Slide Description */}
              <div className="space-y-4 flex-1">
                <span className="text-xs font-bold text-cv-blue bg-cv-surface-subtle px-3 py-1 rounded-full border border-cv-border">
                  {showcaseSlides[activeSlide].category}
                </span>
                <h4 className="text-2xl font-bold text-cv-navy">{showcaseSlides[activeSlide].title}</h4>
                <p className="text-sm text-cv-text-secondary leading-relaxed">
                  {showcaseSlides[activeSlide].description}
                </p>
                <div className="pt-2 space-y-2">
                  {showcaseSlides[activeSlide].features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-medium text-cv-text-main">
                      <CheckCircle2 className="w-4 h-4 text-cv-blue" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Visual Feature Box */}
              <div className="w-full md:w-80 h-64 rounded-xl bg-white border border-cv-border p-5 flex flex-col justify-between shadow-cv-sm">
                <div className="flex items-center justify-between border-b border-cv-border pb-3">
                  <span className="text-xs font-semibold text-cv-navy">{showcaseSlides[activeSlide].highlight}</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-cv-blue animate-pulse" />
                </div>
                <div className="my-auto text-center space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-cv-surface-subtle flex items-center justify-center text-cv-blue">
                    {activeSlide === 0 ? (
                      <FolderTree className="w-6 h-6" />
                    ) : activeSlide === 1 ? (
                      <History className="w-6 h-6" />
                    ) : (
                      <Share2 className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-xs font-semibold text-cv-navy">{showcaseSlides[activeSlide].title}</div>
                  <div className="text-[11px] text-cv-text-secondary">Verified against PostgreSQL &amp; MinIO S3</div>
                </div>
                <div className="pt-3 border-t border-cv-border flex items-center justify-between text-[11px] text-cv-text-secondary">
                  <span>Status: Operational</span>
                  <span className="text-cv-blue font-semibold">100% Typed</span>
                </div>
              </div>
            </div>

            {/* Slider Controls */}
            <div className="mt-8 pt-6 border-t border-cv-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showcaseSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-2 rounded-full transition-all ${
                      activeSlide === idx ? "w-8 bg-cv-navy" : "w-2 bg-cv-border hover:bg-cv-blue-muted"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setActiveSlide((prev) => (prev - 1 + showcaseSlides.length) % showcaseSlides.length)
                  }
                  className="p-2 rounded-lg bg-white border border-cv-border hover:bg-cv-surface-subtle text-cv-navy"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveSlide((prev) => (prev + 1) % showcaseSlides.length)}
                  className="p-2 rounded-lg bg-white border border-cv-border hover:bg-cv-surface-subtle text-cv-navy"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRUST & SECURITY */}
      <section id="security" className="py-20 bg-cv-bg border-b border-cv-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-bold text-cv-blue uppercase tracking-widest">Transparent Architecture</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-cv-navy tracking-tight">
              Real security built into every layer
            </h3>
            <p className="text-cv-text-secondary text-base">
              No exaggerated buzzwords or fake compliance badges. Here are the concrete security controls
              implemented in CloudVault.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl bg-white border border-cv-border shadow-cv-sm space-y-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-cv-blue" />
                <h4 className="text-base font-bold text-cv-navy">Private Buckets &amp; Signed URLs</h4>
              </div>
              <p className="text-xs text-cv-text-secondary leading-relaxed">
                Raw object storage buckets are never exposed to the public internet. All file downloads and previews
                generate short-lived presigned URLs (900s expiry) or authenticated streams after validating database
                ownership.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-cv-border shadow-cv-sm space-y-3">
              <div className="flex items-center gap-3">
                <KeyRound className="w-5 h-5 text-cv-blue" />
                <h4 className="text-base font-bold text-cv-navy">Hashed Share Tokens</h4>
              </div>
              <p className="text-xs text-cv-text-secondary leading-relaxed">
                When a user generates a share link, a 256-bit cryptographically random token is created. Only its
                SHA-256 hash is persisted in PostgreSQL. A database compromise never exposes usable share URLs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-cv-border shadow-cv-sm space-y-3">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-cv-blue" />
                <h4 className="text-base font-bold text-cv-navy">Scrypt Password Hashing &amp; HMAC Sessions</h4>
              </div>
              <p className="text-xs text-cv-text-secondary leading-relaxed">
                Authentication utilizes Node.js scrypt with individual cryptographic salts. Sessions use tamper-evident
                HMAC-SHA256 tokens stored inside secure, HTTP-only, SameSite cookies.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-cv-border shadow-cv-sm space-y-3">
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5 text-cv-blue" />
                <h4 className="text-base font-bold text-cv-navy">Strict Server-Side Quotas</h4>
              </div>
              <p className="text-xs text-cv-text-secondary leading-relaxed">
                Storage quotas are calculated directly from verified database metadata and enforced server-side before
                storage writes occur. Malicious oversized uploads are bounded and rejected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-white py-12 border-t border-cv-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-cv-border">
            {/* Logo */}
            <div className="relative w-40 h-9">
              <Image
                src="/brand/cloudvault-logo.svg"
                alt="CloudVault"
                fill
                className="object-contain object-left"
              />
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-cv-text-secondary">
              <a href="#features" className="hover:text-cv-navy">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-cv-navy">
                How It Works
              </a>
              <a href="#security" className="hover:text-cv-navy">
                Security Architecture
              </a>
              <Link href="/login" className="hover:text-cv-navy">
                Sign In
              </Link>
              <Link href="/register" className="hover:text-cv-navy">
                Register
              </Link>
            </div>
          </div>

          {/* Bottom Attribution */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cv-text-secondary">
            <div>&copy; {new Date().getFullYear()} CloudVault. Your files. Organized. Under control.</div>
            <div className="font-semibold text-cv-navy">
              Curated / Engineered by Vedansh Chamoli
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
