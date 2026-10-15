"use client";

import React, { useState, useEffect, useRef } from "react";
import { History, X, Download, RotateCcw, Upload, Check, Loader2, FileCode } from "lucide-react";
import { useToast } from "@/components/Toast";

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: string;
    name: string;
    currentVersionNumber: number;
  } | null;
  onVersionUpdated: () => void;
}

interface VersionItem {
  id: string;
  versionNumber: number;
  sizeBytes: number;
  mimeType: string;
  checksumSha256: string | null;
  createdAt: string;
  uploadedBy?: {
    name: string;
  };
}

export default function VersionHistoryModal({
  isOpen,
  onClose,
  file,
  onVersionUpdated,
}: VersionHistoryModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && file) {
      fetchVersions();
    }
  }, [isOpen, file]);

  const fetchVersions = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/files/${file.id}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !file) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleRestore = async (versionId: string, versionNumber: number) => {
    setRestoringId(versionId);
    try {
      const res = await fetch(`/api/files/${file.id}/versions/${versionId}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to restore version");

      toast(`Restored version ${versionNumber} as active version`, "success");
      onVersionUpdated();
      fetchVersions();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setRestoringId(null);
    }
  };

  const handleUploadReplacement = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const replacementFile = e.target.files[0];
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", replacementFile);

      const res = await fetch(`/api/files/${file.id}/versions`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload new version");

      toast("New version uploaded successfully", "success");
      onVersionUpdated();
      fetchVersions();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cv-navy/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-2xl border border-cv-border shadow-cv-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cv-border flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <History className="w-5 h-5 text-cv-blue flex-shrink-0" />
            <div className="truncate">
              <h3 className="text-sm font-bold text-cv-navy truncate">Version History</h3>
              <p className="text-[11px] text-cv-text-secondary truncate">{file.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-cv-text-secondary hover:text-cv-navy rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar for uploading replacement version */}
        <div className="px-6 py-3 bg-cv-surface-subtle/50 border-b border-cv-border flex items-center justify-between">
          <span className="text-xs text-cv-text-secondary">Upload a new revision for this file</span>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUploadReplacement}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1.5 bg-cv-navy hover:bg-cv-blue text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-cv-sm"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Upload New Version</span>
              </>
            )}
          </button>
        </div>

        {/* Versions List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-xs text-cv-text-secondary flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cv-blue" />
              <span>Loading version history...</span>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-xs text-cv-text-secondary">No versions recorded.</div>
          ) : (
            versions.map((v) => {
              const isCurrent = v.versionNumber === file.currentVersionNumber;
              return (
                <div
                  key={v.id}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                    isCurrent
                      ? "border-cv-blue bg-cv-surface-subtle shadow-cv-sm"
                      : "border-cv-border bg-white hover:bg-cv-bg"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-cv-navy">Version {v.versionNumber}</span>
                      {isCurrent ? (
                        <span className="text-[10px] font-bold text-cv-blue bg-cv-blue-pale px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>CURRENT ACTIVE</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-cv-text-secondary">Historical</span>
                      )}
                    </div>
                    <div className="text-[11px] text-cv-text-secondary flex items-center gap-3">
                      <span>{formatFileSize(v.sizeBytes)}</span>
                      <span>•</span>
                      <span>{new Date(v.createdAt).toLocaleString()}</span>
                      {v.uploadedBy && (
                        <>
                          <span>•</span>
                          <span>by {v.uploadedBy.name}</span>
                        </>
                      )}
                    </div>
                    {v.checksumSha256 && (
                      <div className="text-[10px] font-mono text-cv-text-secondary flex items-center gap-1 truncate max-w-sm">
                        <FileCode className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">SHA: {v.checksumSha256.slice(0, 16)}...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={`/api/files/${file.id}/download?version=${v.versionNumber}`}
                      download
                      className="p-1.5 bg-white border border-cv-border rounded-lg text-cv-navy hover:bg-cv-surface-subtle"
                      title="Download this version"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    {!isCurrent && (
                      <button
                        onClick={() => handleRestore(v.id, v.versionNumber)}
                        disabled={restoringId === v.id}
                        className="px-2.5 py-1.5 bg-white border border-cv-border rounded-lg text-xs font-semibold text-cv-navy hover:bg-cv-surface-subtle flex items-center gap-1 shadow-cv-sm"
                        title="Restore this version"
                      >
                        {restoringId === v.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3 h-3 text-cv-blue" />
                        )}
                        <span>Restore</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-cv-bg border-t border-cv-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-cv-navy bg-white border border-cv-border rounded-lg hover:bg-cv-surface-subtle"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
