"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, ShieldCheck, AlertCircle, FileText, Image as ImageIcon, Loader2, Calendar } from "lucide-react";

interface SharedFileInfo {
  name: string;
  sizeBytes: number;
  mimeType: string;
  updatedAt: string;
  ownerName: string;
}

export default function PublicSharePage({ params }: { params: { token: string } }) {
  const [file, setFile] = useState<SharedFileInfo | null>(null);
  const [permission, setPermission] = useState<string>("VIEW");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/share/${params.token}`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((d) => {
            throw new Error(d.error || "Failed to load shared file");
          });
        }
        return res.json();
      })
      .then((data) => {
        setFile(data.file);
        setPermission(data.permission);
        setExpiresAt(data.expiresAt);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.token]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const isImage = file?.mimeType.startsWith("image/");
  const canDownload = permission === "DOWNLOAD";

  return (
    <div className="min-h-screen bg-cv-bg flex flex-col justify-between selection:bg-cv-blue-pale text-cv-text-main">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-cv-border px-6 flex items-center justify-between">
        <Link href="/" className="relative w-36 h-9">
          <Image
            src="/brand/cloudvault-logo.svg"
            alt="CloudVault"
            fill
            priority
            className="object-contain object-left"
          />
        </Link>
        <div className="flex items-center gap-2 text-xs font-semibold text-cv-blue bg-cv-surface-subtle px-3 py-1 rounded-full border border-cv-border">
          <ShieldCheck className="w-3.5 h-3.5 text-cv-blue" />
          <span>Encrypted Share Link</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto p-4 sm:p-6 my-auto">
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-cv-border shadow-cv-md text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-cv-blue mx-auto" />
            <p className="text-xs text-cv-text-secondary">Resolving encrypted share token...</p>
          </div>
        ) : error ? (
          <div className="bg-white p-8 rounded-2xl border border-cv-danger/30 shadow-cv-md text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-cv-danger-subtle flex items-center justify-center text-cv-danger">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-cv-navy">Link Inaccessible</h3>
            <p className="text-xs text-cv-text-secondary max-w-sm mx-auto">{error}</p>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-cv-bg hover:bg-cv-surface-subtle border border-cv-border rounded-lg text-xs font-semibold text-cv-navy"
            >
              Return to CloudVault
            </Link>
          </div>
        ) : file ? (
          <div className="bg-white rounded-2xl border border-cv-border shadow-cv-md overflow-hidden">
            {/* Header / Meta */}
            <div className="p-6 border-b border-cv-border space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cv-surface-subtle flex items-center justify-center text-cv-blue flex-shrink-0">
                  {isImage ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                </div>
                <div className="truncate">
                  <h2 className="text-base font-bold text-cv-navy truncate">{file.name}</h2>
                  <div className="flex items-center gap-2 text-xs text-cv-text-secondary">
                    <span>{formatFileSize(file.sizeBytes)}</span>
                    <span>•</span>
                    <span>Shared by {file.ownerName}</span>
                  </div>
                </div>
              </div>

              {expiresAt && (
                <div className="flex items-center gap-1.5 text-[11px] text-cv-text-secondary">
                  <Calendar className="w-3.5 h-3.5 text-cv-blue" />
                  <span>Valid until {new Date(expiresAt).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Preview Box */}
            <div className="p-6 bg-cv-bg/40 flex items-center justify-center min-h-[250px]">
              {isImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`/api/share/${params.token}/download?inline=true`}
                  alt={file.name}
                  className="max-h-[50vh] max-w-full rounded-lg shadow-cv-sm object-contain"
                />
              ) : (
                <div className="text-center space-y-2">
                  <FileText className="w-12 h-12 text-cv-blue mx-auto" />
                  <div className="text-xs font-semibold text-cv-navy">{file.name}</div>
                  <div className="text-[11px] text-cv-text-secondary">{file.mimeType}</div>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="p-6 bg-white border-t border-cv-border flex items-center justify-between">
              <div className="text-xs text-cv-text-secondary">
                {canDownload ? "Download authorized" : "View-only access authorized"}
              </div>

              {canDownload ? (
                <a
                  href={`/api/share/${params.token}/download`}
                  download={file.name}
                  className="px-5 py-2.5 rounded-lg bg-cv-navy hover:bg-cv-blue text-white text-xs font-semibold shadow-cv-sm flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </a>
              ) : (
                <span className="text-xs font-semibold text-cv-text-secondary bg-cv-bg px-3 py-1.5 rounded-lg border border-cv-border">
                  Download Disabled by Owner
                </span>
              )}
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-cv-border text-center text-xs text-cv-text-secondary">
        <div>Powered by CloudVault • Your files. Organized. Under control.</div>
        <div className="mt-1 font-semibold text-cv-navy">Curated / Engineered by Vedansh Chamoli</div>
      </footer>
    </div>
  );
}
