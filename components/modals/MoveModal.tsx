"use client";

import React, { useState, useEffect } from "react";
import { Folder, FolderTree, X, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "../Toast";

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: string;
    name: string;
    folderId: string | null;
  } | null;
  onMoved: () => void;
}

interface FolderOption {
  id: string;
  name: string;
  parentId: string | null;
}

export default function MoveModal({ isOpen, onClose, file, onMoved }: MoveModalProps) {
  const { toast } = useToast();
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedFolderId(file?.folderId || null);
      fetchFolders();
    }
  }, [isOpen, file]);

  const fetchFolders = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/folders");
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
      }
    } catch {
      // ignore
    } finally {
      setFetching(false);
    }
  };

  if (!isOpen || !file) return null;

  const handleMove = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: selectedFolderId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to move file");

      toast("File moved successfully", "success");
      onMoved();
      onClose();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cv-navy/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl border border-cv-border shadow-cv-xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="px-6 py-4 border-b border-cv-border flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <FolderTree className="w-4 h-4 text-cv-blue flex-shrink-0" />
            <h3 className="text-sm font-bold text-cv-navy truncate">Move &ldquo;{file.name}&rdquo;</h3>
          </div>
          <button onClick={onClose} className="p-1 text-cv-text-secondary hover:text-cv-navy rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <p className="text-xs text-cv-text-secondary">Select a destination folder in your vault:</p>

          <div className="space-y-1.5 border border-cv-border rounded-xl p-2 max-h-60 overflow-y-auto bg-cv-bg/40">
            {/* Root Option */}
            <button
              type="button"
              onClick={() => setSelectedFolderId(null)}
              className={`w-full p-2.5 rounded-lg text-left text-xs flex items-center gap-2.5 transition-all ${
                selectedFolderId === null
                  ? "bg-cv-navy text-white font-semibold"
                  : "hover:bg-white text-cv-navy"
              }`}
            >
              <FolderTree className={`w-4 h-4 ${selectedFolderId === null ? "text-white" : "text-cv-blue"}`} />
              <span>Root (My Files)</span>
            </button>

            {fetching ? (
              <div className="text-center py-4 text-xs text-cv-text-secondary flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading folders...</span>
              </div>
            ) : (
              folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFolderId(f.id)}
                  className={`w-full p-2.5 rounded-lg text-left text-xs flex items-center gap-2.5 transition-all ${
                    selectedFolderId === f.id
                      ? "bg-cv-navy text-white font-semibold"
                      : "hover:bg-white text-cv-navy"
                  }`}
                >
                  <Folder className={`w-4 h-4 ${selectedFolderId === f.id ? "text-white" : "text-cv-blue"}`} />
                  <span className="truncate">{f.name}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="px-6 py-3 bg-cv-bg border-t border-cv-border flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-cv-navy bg-white border border-cv-border rounded-lg hover:bg-cv-surface-subtle"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-white bg-cv-navy hover:bg-cv-blue rounded-lg shadow-cv-sm flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            <span>Move Here</span>
          </button>
        </div>
      </div>
    </div>
  );
}
