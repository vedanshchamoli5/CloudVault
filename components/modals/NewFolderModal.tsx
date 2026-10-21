"use client";

import React, { useState } from "react";
import { FolderPlus, X, Loader2 } from "lucide-react";
import { useToast } from "../Toast";

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId: string | null;
  onFolderCreated: () => void;
}

export default function NewFolderModal({
  isOpen,
  onClose,
  parentId,
  onFolderCreated,
}: NewFolderModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          parentId: parentId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create folder");

      toast("Folder created successfully", "success");
      setName("");
      onFolderCreated();
      onClose();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cv-navy/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl border border-cv-border shadow-cv-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-cv-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-cv-blue" />
            <h3 className="text-sm font-bold text-cv-navy">New Folder</h3>
          </div>
          <button onClick={onClose} className="p-1 text-cv-text-secondary hover:text-cv-navy rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cv-navy mb-1.5">Folder Name</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q4 Financials"
              className="w-full px-3.5 py-2.5 rounded-lg border border-cv-border text-xs text-cv-text-main focus:border-cv-blue focus:ring-1 focus:ring-cv-blue transition-colors bg-cv-bg/50 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-cv-navy bg-white border border-cv-border rounded-lg hover:bg-cv-surface-subtle"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-cv-navy hover:bg-cv-blue rounded-lg shadow-cv-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Create Folder</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
