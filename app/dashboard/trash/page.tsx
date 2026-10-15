"use client";

import React, { useState, useEffect } from "react";
import { Trash2, RotateCcw, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";

interface FileItem {
  id: string;
  name: string;
  sizeBytes: number;
  updatedAt: string;
}

export default function TrashPage() {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/files?view=trash");
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch {
      toast("Failed to load trash items", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (fileId: string, name: string) => {
    setActionId(fileId);
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTrash: false }),
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        toast(`Restored "${name}" to your vault`, "success");
      }
    } catch {
      toast("Failed to restore file", "error");
    } finally {
      setActionId(null);
    }
  };

  const handlePermanentDelete = async (fileId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"? This will delete all versions from S3 and cannot be undone.`)) {
      return;
    }

    setActionId(fileId);
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        toast(`Permanently deleted "${name}" and freed storage`, "info");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast(err.message || "Failed to delete file", "error");
    } finally {
      setActionId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-cv-border">
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-cv-danger" />
          <h2 className="text-base font-bold text-cv-navy">Trash</h2>
        </div>
        <span className="text-xs text-cv-text-secondary">
          Items in trash can be restored or permanently removed
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-white rounded-xl border border-cv-border animate-pulse" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-cv-border space-y-2">
          <Trash2 className="w-10 h-10 text-cv-text-secondary mx-auto" />
          <h3 className="text-sm font-bold text-cv-navy">Trash is empty</h3>
          <p className="text-xs text-cv-text-secondary">Deleted files will appear here before permanent removal.</p>
        </div>
      ) : (
        <div className="bg-white border border-cv-border rounded-xl shadow-cv-sm overflow-hidden">
          <table className="w-full text-left text-xs text-cv-navy">
            <thead className="bg-cv-bg border-b border-cv-border text-cv-text-secondary uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold">Size</th>
                <th className="py-3 px-4 font-semibold">Deleted Date</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cv-border">
              {files.map((f) => (
                <tr key={f.id} className="hover:bg-cv-surface-subtle/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-cv-navy">{f.name}</td>
                  <td className="py-3 px-4 text-cv-text-secondary">{formatFileSize(f.sizeBytes)}</td>
                  <td className="py-3 px-4 text-cv-text-secondary">
                    {new Date(f.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleRestore(f.id, f.name)}
                      disabled={actionId === f.id}
                      className="px-2.5 py-1.5 bg-white border border-cv-border rounded-lg text-cv-navy hover:bg-cv-surface-subtle font-semibold inline-flex items-center gap-1 shadow-cv-sm"
                      title="Restore file"
                    >
                      {actionId === f.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5 text-cv-blue" />
                      )}
                      <span>Restore</span>
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(f.id, f.name)}
                      disabled={actionId === f.id}
                      className="px-2.5 py-1.5 bg-cv-danger-subtle text-cv-danger border border-cv-danger/30 rounded-lg font-semibold inline-flex items-center gap-1 hover:bg-cv-danger hover:text-white transition-colors"
                      title="Delete permanently from S3"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Forever</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
