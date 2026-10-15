"use client";

import React, { useState, useEffect } from "react";
import { X, Download, FileText, Image as ImageIcon, AlertCircle, Loader2 } from "lucide-react";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
    currentVersionNumber: number;
    updatedAt: string;
  } | null;
}

export default function PreviewModal({ isOpen, onClose, file }: PreviewModalProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isImage = file?.mimeType.startsWith("image/");
  const isPdf = file?.mimeType === "application/pdf";
  const isText =
    file?.mimeType.startsWith("text/") ||
    file?.mimeType.includes("json") ||
    file?.mimeType.includes("javascript") ||
    file?.mimeType.includes("typescript") ||
    file?.name.endsWith(".md") ||
    file?.name.endsWith(".txt") ||
    file?.name.endsWith(".sql") ||
    file?.name.endsWith(".csv");

  useEffect(() => {
    if (isOpen && file && isText) {
      setLoading(true);
      setError(null);
      fetch(`/api/files/${file.id}/download?inline=true`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load text preview");
          return res.text();
        })
        .then((text) => setTextContent(text.slice(0, 100000))) // Limit to 100KB for preview safety
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setTextContent(null);
    }
  }, [isOpen, file, isText]);

  if (!isOpen || !file) return null;

  const downloadUrl = `/api/files/${file.id}/download`;
  const inlineUrl = `/api/files/${file.id}/download?inline=true`;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cv-navy/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl border border-cv-border shadow-cv-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cv-border flex items-center justify-between bg-cv-bg/70">
          <div className="flex items-center gap-3 truncate">
            {isImage ? (
              <ImageIcon className="w-5 h-5 text-cv-blue flex-shrink-0" />
            ) : (
              <FileText className="w-5 h-5 text-cv-blue flex-shrink-0" />
            )}
            <div className="truncate">
              <h3 className="text-sm font-bold text-cv-navy truncate">{file.name}</h3>
              <div className="flex items-center gap-2 text-xs text-cv-text-secondary">
                <span>{formatFileSize(file.sizeBytes)}</span>
                <span>•</span>
                <span className="font-semibold text-cv-blue">v{file.currentVersionNumber}</span>
                <span>•</span>
                <span>{file.mimeType}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              download={file.name}
              className="px-3 py-1.5 rounded-lg bg-white border border-cv-border text-cv-navy hover:bg-cv-surface-subtle text-xs font-semibold flex items-center gap-1.5 shadow-cv-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-cv-text-secondary hover:text-cv-navy rounded-lg hover:bg-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-auto flex-1 flex items-center justify-center bg-cv-bg/30 min-h-[350px]">
          {isImage && (
            <div className="relative max-h-[70vh] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inlineUrl}
                alt={file.name}
                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-cv-md border border-cv-border"
              />
            </div>
          )}

          {isPdf && (
            <iframe
              src={inlineUrl}
              title={file.name}
              className="w-full h-[65vh] rounded-lg border border-cv-border bg-white"
            />
          )}

          {isText && (
            <div className="w-full h-full max-h-[65vh] flex flex-col">
              {loading && (
                <div className="m-auto flex items-center gap-2 text-cv-text-secondary text-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-cv-blue" />
                  <span>Loading file preview...</span>
                </div>
              )}
              {error && (
                <div className="m-auto p-4 rounded-xl bg-cv-danger-subtle text-cv-danger flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
              {textContent !== null && (
                <pre className="p-4 rounded-xl bg-white border border-cv-border font-mono text-xs text-cv-navy overflow-auto whitespace-pre-wrap leading-relaxed flex-1 select-text">
                  {textContent}
                </pre>
              )}
            </div>
          )}

          {!isImage && !isPdf && !isText && (
            <div className="text-center py-12 space-y-4 max-w-sm mx-auto">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-cv-border flex items-center justify-center text-cv-blue shadow-cv-sm">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-cv-navy">Binary Preview Not Available</h4>
                <p className="text-xs text-cv-text-secondary leading-relaxed">
                  This file format ({file.mimeType}) cannot be directly rendered inside the browser. You can
                  safely download the file to inspect it on your device.
                </p>
              </div>
              <a
                href={downloadUrl}
                download={file.name}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cv-navy text-white text-xs font-semibold hover:bg-cv-blue shadow-cv-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download {file.name}</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
