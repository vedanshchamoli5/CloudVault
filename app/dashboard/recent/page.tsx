"use client";

import React, { useState, useEffect } from "react";
import { Clock, Download, Share2, Star, Eye } from "lucide-react";
import { useToast } from "@/components/Toast";
import PreviewModal from "@/components/modals/PreviewModal";
import ShareModal from "@/components/modals/ShareModal";

interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  currentVersionNumber: number;
  isStarred: boolean;
  updatedAt: string;
}

export default function RecentFilesPage() {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);

  useEffect(() => {
    fetch("/api/files?view=recent&sortBy=date&order=desc")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.files) setFiles(data.files);
      })
      .catch(() => toast("Failed to load recent files", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-3 border-b border-cv-border">
        <Clock className="w-5 h-5 text-cv-blue" />
        <h2 className="text-base font-bold text-cv-navy">Recently Modified Files</h2>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-white rounded-xl border border-cv-border animate-pulse" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-cv-border space-y-2">
          <Clock className="w-10 h-10 text-cv-text-secondary mx-auto" />
          <h3 className="text-sm font-bold text-cv-navy">No recent files</h3>
          <p className="text-xs text-cv-text-secondary">Files you edit or upload will appear here.</p>
        </div>
      ) : (
        <div className="bg-white border border-cv-border rounded-xl shadow-cv-sm overflow-hidden">
          <table className="w-full text-left text-xs text-cv-navy">
            <thead className="bg-cv-bg border-b border-cv-border text-cv-text-secondary uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold">Size</th>
                <th className="py-3 px-4 font-semibold">Version</th>
                <th className="py-3 px-4 font-semibold">Last Modified</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cv-border">
              {files.map((f) => (
                <tr key={f.id} className="hover:bg-cv-surface-subtle/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-cv-navy">{f.name}</td>
                  <td className="py-3 px-4 text-cv-text-secondary">{formatFileSize(f.sizeBytes)}</td>
                  <td className="py-3 px-4 font-semibold text-cv-blue">v{f.currentVersionNumber}</td>
                  <td className="py-3 px-4 text-cv-text-secondary">
                    {new Date(f.updatedAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => setPreviewFile(f)}
                      className="p-1 hover:text-cv-blue text-cv-text-secondary"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShareFile(f)}
                      className="p-1 hover:text-cv-blue text-cv-text-secondary"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <a
                      href={`/api/files/${f.id}/download`}
                      download={f.name}
                      className="p-1 hover:text-cv-blue text-cv-text-secondary inline-block"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
      <ShareModal
        isOpen={!!shareFile}
        onClose={() => setShareFile(null)}
        file={shareFile}
      />
    </div>
  );
}
