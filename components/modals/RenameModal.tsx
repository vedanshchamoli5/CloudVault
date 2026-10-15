"use client";

import React, { useState, useEffect } from "react";
import { Edit2, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    name: string;
    type: "file" | "folder";
  } | null;
  onRenamed: () => void;
}

export default function RenameModal({ isOpen, onClose, item, onRenamed }: RenameModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      setName(item.name);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const endpoint = item.type === "file" ? `/api/files/${item.id}` : `/api/folders/${item.id}`;
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rename");

      toast(`${item.type === "file" ? "File" : "Folder"} renamed`, "success");
      onRenamed();
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
            <Edit2 className="w-4 h-4 text-cv-blue" />
            <h3 className="text-sm font-bold text-cv-navy">Rename {item.type === "file" ? "File" : "Folder"}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-cv-text-secondary hover:text-cv-navy rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cv-navy mb-1.5">New Name</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
