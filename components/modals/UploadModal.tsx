"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, X, File, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string | null;
  onUploadComplete: () => void;
}

interface QueuedFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

export default function UploadModal({
  isOpen,
  onClose,
  folderId,
  onUploadComplete,
}: UploadModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(Array.from(e.target.files));
    }
  };

  const addFilesToQueue = (files: File[]) => {
    const newItems: QueuedFile[] = files.map((f) => ({
      file: f,
      id: Math.random().toString(36).substring(2, 9),
      status: "pending",
      progress: 0,
    }));
    setQueue((prev) => [...prev, ...newItems]);
  };

  const removeFile = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const startUpload = async () => {
    if (queue.length === 0) return;
    setIsUploading(true);

    let successCount = 0;

    for (const item of queue) {
      if (item.status === "success") continue;

      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: "uploading", progress: 40 } : q))
      );

      try {
        const formData = new FormData();
        formData.append("file", item.file);
        if (folderId) {
          formData.append("folderId", folderId);
        }

        const res = await fetch("/api/files", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Upload failed");
        }

        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: "success", progress: 100 } : q))
        );
        successCount++;
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: "error", error: err.message || "Failed" } : q
          )
        );
      }
    }

    setIsUploading(false);
    if (successCount > 0) {
      toast(`Successfully uploaded ${successCount} file(s)`, "success");
      onUploadComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cv-navy/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-cv-border shadow-cv-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cv-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-cv-blue" />
            <h3 className="text-base font-bold text-cv-navy">Upload Files to Vault</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1 text-cv-text-secondary hover:text-cv-navy rounded-lg hover:bg-cv-bg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-cv-blue bg-cv-blue-pale/30 scale-[0.99]"
                : "border-cv-border hover:border-cv-blue-secondary bg-cv-bg/50 hover:bg-cv-bg"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="w-12 h-12 mx-auto rounded-full bg-white border border-cv-border flex items-center justify-center text-cv-blue mb-3 shadow-cv-sm">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-cv-navy">
              Click to select or drag and drop files here
            </div>
            <p className="text-xs text-cv-text-secondary mt-1">
              Supports images, documents, audio, video and archives up to 100 MB per file
            </p>
          </div>

          {/* Queued Files List */}
          {queue.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-cv-text-secondary">
                <span>Selected Files ({queue.length})</span>
                <button
                  type="button"
                  onClick={() => setQueue([])}
                  disabled={isUploading}
                  className="text-cv-danger hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-cv-border bg-cv-surface-subtle/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <File className="w-4 h-4 text-cv-blue flex-shrink-0" />
                      <div className="truncate">
                        <div className="font-semibold text-cv-navy truncate">{item.file.name}</div>
                        <div className="text-[11px] text-cv-text-secondary">
                          {formatFileSize(item.file.size)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.status === "uploading" && (
                        <div className="flex items-center gap-1.5 text-cv-blue font-semibold">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </div>
                      )}
                      {item.status === "success" && (
                        <CheckCircle2 className="w-4 h-4 text-cv-success" />
                      )}
                      {item.status === "error" && (
                        <div className="flex items-center gap-1 text-cv-danger font-semibold">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-[10px]">{item.error || "Failed"}</span>
                        </div>
                      )}
                      {item.status === "pending" && !isUploading && (
                        <button
                          onClick={() => removeFile(item.id)}
                          className="p-1 text-cv-text-secondary hover:text-cv-danger rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-cv-bg border-t border-cv-border flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-xs font-semibold text-cv-navy bg-white border border-cv-border rounded-lg hover:bg-cv-surface-subtle"
          >
            Cancel
          </button>
          <button
            onClick={startUpload}
            disabled={queue.length === 0 || isUploading}
            className="px-5 py-2 text-xs font-semibold text-white bg-cv-navy hover:bg-cv-blue rounded-lg shadow-cv-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <span>Start Upload</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
