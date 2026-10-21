"use client";

import React, { useState, useEffect } from "react";
import { Share2, X, Copy, Check, Trash2, Shield, Calendar, Download, Loader2 } from "lucide-react";
import { useToast } from "../Toast";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: string;
    name: string;
  } | null;
}

interface ExistingLink {
  id: string;
  permission: string;
  expiresAt: string | null;
  downloadCount: number;
  createdAt: string;
}

export default function ShareModal({ isOpen, onClose, file }: ShareModalProps) {
  const { toast } = useToast();
  const [permission, setPermission] = useState<"VIEW" | "DOWNLOAD">("VIEW");
  const [expiresInDays, setExpiresInDays] = useState<number | null>(7);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingLinks, setExistingLinks] = useState<ExistingLink[]>([]);
  const [fetchingLinks, setFetchingLinks] = useState(false);

  useEffect(() => {
    if (isOpen && file) {
      setCreatedUrl(null);
      setCopied(false);
      fetchExistingLinks();
    }
  }, [isOpen, file]);

  const fetchExistingLinks = async () => {
    if (!file) return;
    setFetchingLinks(true);
    try {
      const res = await fetch(`/api/files/${file.id}/share`);
      if (res.ok) {
        const data = await res.json();
        setExistingLinks(data.links || []);
      }
    } catch {
      // ignore
    } finally {
      setFetchingLinks(false);
    }
  };

  if (!isOpen || !file) return null;

  const handleCreateShareLink = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files/${file.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permission,
          expiresInDays: expiresInDays || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create share link");

      setCreatedUrl(data.shareUrl);
      toast("Share link generated successfully", "success");
      fetchExistingLinks();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!createdUrl) return;
    navigator.clipboard.writeText(createdUrl);
    setCopied(true);
    toast("Link copied to clipboard", "success");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleRevoke = async (linkId: string) => {
    try {
      const res = await fetch(`/api/files/${file.id}/share?linkId=${linkId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to revoke link");
      toast("Share link revoked", "info");
      fetchExistingLinks();
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cv-navy/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-cv-border shadow-cv-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cv-border flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <Share2 className="w-5 h-5 text-cv-blue flex-shrink-0" />
            <div className="truncate">
              <h3 className="text-sm font-bold text-cv-navy truncate">Share &ldquo;{file.name}&rdquo;</h3>
              <p className="text-[11px] text-cv-text-secondary">
                Generate a cryptographically secured link with access controls
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-cv-text-secondary hover:text-cv-navy rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Newly Generated URL Banner */}
          {createdUrl ? (
            <div className="p-4 rounded-xl bg-cv-surface-subtle border border-cv-blue/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-cv-navy">
                <Shield className="w-4 h-4 text-cv-blue" />
                <span>Link Ready to Share</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdUrl}
                  className="flex-1 bg-white border border-cv-border rounded-lg px-3 py-2 text-xs font-mono text-cv-navy truncate select-all"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 bg-cv-navy hover:bg-cv-blue text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-cv-sm"
                >
                  {copied ? <Check className="w-4 h-4 text-cv-success" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <p className="text-[11px] text-cv-text-secondary">
                The raw token is only shown now. A SHA-256 hash has been saved in the vault database.
              </p>
            </div>
          ) : (
            /* Configure New Link */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-cv-navy mb-1.5">Permissions</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPermission("VIEW")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      permission === "VIEW"
                        ? "border-cv-blue bg-cv-surface-subtle shadow-cv-sm"
                        : "border-cv-border hover:bg-cv-bg"
                    }`}
                  >
                    <div className="text-xs font-bold text-cv-navy flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-cv-blue" />
                      <span>View Only</span>
                    </div>
                    <p className="text-[11px] text-cv-text-secondary mt-1">Recipient can preview without download</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPermission("DOWNLOAD")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      permission === "DOWNLOAD"
                        ? "border-cv-blue bg-cv-surface-subtle shadow-cv-sm"
                        : "border-cv-border hover:bg-cv-bg"
                    }`}
                  >
                    <div className="text-xs font-bold text-cv-navy flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-cv-blue" />
                      <span>Allow Download</span>
                    </div>
                    <p className="text-[11px] text-cv-text-secondary mt-1">Recipient can download file bytes</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-cv-navy mb-1.5">Link Expiration</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "1 Day", val: 1 },
                    { label: "7 Days", val: 7 },
                    { label: "30 Days", val: 30 },
                    { label: "Never", val: null },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setExpiresInDays(opt.val)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium text-center transition-all ${
                        expiresInDays === opt.val
                          ? "border-cv-blue bg-cv-surface-subtle text-cv-navy font-bold"
                          : "border-cv-border text-cv-text-secondary hover:bg-cv-bg"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateShareLink}
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-cv-navy hover:bg-cv-blue text-white text-xs font-semibold shadow-cv-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Link...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Generate Share Link</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Active Existing Share Links */}
          <div className="pt-4 border-t border-cv-border space-y-2">
            <h4 className="text-xs font-bold text-cv-navy">Active Links ({existingLinks.length})</h4>
            {fetchingLinks ? (
              <div className="text-center py-4 text-xs text-cv-text-secondary">Loading active links...</div>
            ) : existingLinks.length === 0 ? (
              <div className="text-center py-4 text-xs text-cv-text-secondary bg-cv-bg/50 rounded-lg">
                No active links currently created for this file.
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {existingLinks.map((link) => (
                  <div
                    key={link.id}
                    className="p-2.5 rounded-lg border border-cv-border bg-cv-bg/40 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-cv-navy uppercase text-[10px] bg-cv-surface-subtle px-1.5 py-0.5 rounded border border-cv-border">
                          {link.permission}
                        </span>
                        <span className="text-[11px] text-cv-text-secondary">
                          {link.downloadCount} download{link.downloadCount === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="text-[10px] text-cv-text-secondary flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {link.expiresAt
                            ? `Expires ${new Date(link.expiresAt).toLocaleDateString()}`
                            : "Never expires"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevoke(link.id)}
                      className="p-1 text-cv-text-secondary hover:text-cv-danger rounded"
                      title="Revoke link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-cv-bg border-t border-cv-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-cv-navy bg-white border border-cv-border rounded-lg hover:bg-cv-surface-subtle"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
