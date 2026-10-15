"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FolderPlus,
  UploadCloud,
  Search,
  LayoutGrid,
  List,
  Folder,
  FileText,
  Image as ImageIcon,
  MoreVertical,
  Star,
  Download,
  Share2,
  History,
  FolderInput,
  Edit2,
  Trash2,
  Eye,
  ChevronRight,
  Filter,
  CheckSquare,
  Square,
  ArrowUpDown,
  FileArchive,
  FileCode,
  Film,
  Music,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import UploadModal from "@/components/modals/UploadModal";
import PreviewModal from "@/components/modals/PreviewModal";
import ShareModal from "@/components/modals/ShareModal";
import VersionHistoryModal from "@/components/modals/VersionHistoryModal";
import RenameModal from "@/components/modals/RenameModal";
import MoveModal from "@/components/modals/MoveModal";
import NewFolderModal from "@/components/modals/NewFolderModal";

interface FileItem {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  folderId: string | null;
  isStarred: boolean;
  isTrash: boolean;
  currentVersionNumber: number;
  createdAt: string;
  updatedAt: string;
}

interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Breadcrumb {
  id: string | null;
  name: string;
}

export default function DashboardFilesPage() {
  const { toast } = useToast();

  // State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: null, name: "My Files" }]);
  const [loading, setLoading] = useState(true);

  // Filters & Controls
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Multi-select
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

  // Active Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [versionFile, setVersionFile] = useState<FileItem | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string; type: "file" | "folder" } | null>(null);
  const [moveFile, setMoveFile] = useState<FileItem | null>(null);

  // Active action menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Drag and drop zone for entire dashboard panel
  const [dragOverPanel, setDragOverPanel] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentFolderId) params.set("folderId", currentFolderId);
      if (search) params.set("search", search);
      if (typeFilter !== "all") params.set("type", typeFilter);
      params.set("sortBy", sortBy);
      params.set("order", sortOrder);

      const res = await fetch(`/api/files?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
        setFolders(data.folders || []);
        if (data.breadcrumbs) setBreadcrumbs(data.breadcrumbs);
      }
    } catch {
      toast("Failed to load files", "error");
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, search, typeFilter, sortBy, sortOrder, toast]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Close context menu on external click
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (file: FileItem) => {
    if (file.mimeType.startsWith("image/")) {
      return <ImageIcon className="w-6 h-6 text-cv-blue" />;
    }
    if (file.mimeType === "application/pdf") {
      return <FileText className="w-6 h-6 text-cv-navy" />;
    }
    if (file.mimeType.startsWith("video/")) {
      return <Film className="w-6 h-6 text-cv-blue-secondary" />;
    }
    if (file.mimeType.startsWith("audio/")) {
      return <Music className="w-6 h-6 text-cv-blue-muted" />;
    }
    if (file.name.endsWith(".zip") || file.name.endsWith(".tar") || file.name.endsWith(".gz")) {
      return <FileArchive className="w-6 h-6 text-cv-navy" />;
    }
    if (file.name.endsWith(".ts") || file.name.endsWith(".js") || file.name.endsWith(".json")) {
      return <FileCode className="w-6 h-6 text-cv-blue" />;
    }
    return <FileText className="w-6 h-6 text-cv-text-secondary" />;
  };

  const handleToggleStar = async (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStarred: !file.isStarred }),
      });
      if (res.ok) {
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, isStarred: !f.isStarred } : f))
        );
        toast(file.isStarred ? "Removed from Starred" : "Added to Starred", "info");
      }
    } catch {
      toast("Failed to update star", "error");
    }
  };

  const handleTrashFile = async (file: FileItem) => {
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTrash: true }),
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
        toast(`"${file.name}" moved to Trash`, "info");
      }
    } catch {
      toast("Failed to move file to Trash", "error");
    }
  };

  const handleTrashFolder = async (folder: FolderItem) => {
    try {
      const res = await fetch(`/api/folders/${folder.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFolders((prev) => prev.filter((f) => f.id !== folder.id));
        toast(`"${folder.name}" moved to Trash`, "info");
      }
    } catch {
      toast("Failed to move folder to Trash", "error");
    }
  };

  const toggleSelectFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedFileIds.size === files.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(files.map((f) => f.id)));
    }
  };

  const handleBatchTrash = async () => {
    if (selectedFileIds.size === 0) return;
    for (const id of Array.from(selectedFileIds)) {
      await fetch(`/api/files/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTrash: true }),
      });
    }
    toast(`Moved ${selectedFileIds.size} files to Trash`, "info");
    setSelectedFileIds(new Set());
    fetchFiles();
  };

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        setDragOverPanel(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOverPanel(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragOverPanel(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOverPanel(false);
        setUploadModalOpen(true);
      }}
      className="space-y-6 relative min-h-[80vh]"
    >
      {/* Drag overlay notice */}
      {dragOverPanel && (
        <div className="fixed inset-0 z-40 bg-cv-blue/10 backdrop-blur-xs border-4 border-dashed border-cv-blue flex items-center justify-center pointer-events-none">
          <div className="p-6 rounded-2xl bg-white shadow-cv-xl text-center space-y-2 border border-cv-border">
            <UploadCloud className="w-12 h-12 text-cv-blue mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-cv-navy">Drop files to upload</h3>
            <p className="text-xs text-cv-text-secondary">Direct streaming to private S3 storage</p>
          </div>
        </div>
      )}

      {/* TOP BAR CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cv-text-secondary">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files and folders..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-cv-border text-xs text-cv-text-main focus:border-cv-blue focus:ring-1 focus:ring-cv-blue bg-white shadow-cv-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setNewFolderModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-cv-border text-xs font-semibold text-cv-navy hover:bg-cv-surface-subtle shadow-cv-sm flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4 text-cv-blue" />
            <span>New Folder</span>
          </button>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-cv-navy hover:bg-cv-blue text-xs font-semibold text-white shadow-cv-sm flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* BREADCRUMB & VIEW SWITCHER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cv-border">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.id || "root"}>
                <button
                  onClick={() => setCurrentFolderId(crumb.id)}
                  className={`font-semibold transition-colors ${
                    isLast
                      ? "text-cv-navy cursor-default"
                      : "text-cv-text-secondary hover:text-cv-blue hover:underline"
                  }`}
                >
                  {crumb.name}
                </button>
                {!isLast && <ChevronRight className="w-3.5 h-3.5 text-cv-border" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Filter & View Mode Controls */}
        <div className="flex items-center gap-3">
          {/* Filter Pills */}
          <div className="hidden md:flex items-center gap-1 bg-white border border-cv-border p-1 rounded-lg text-xs">
            {["all", "image", "document", "media"].map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`px-2.5 py-1 rounded capitalize font-medium transition-all ${
                  typeFilter === f
                    ? "bg-cv-surface-subtle text-cv-navy font-bold shadow-cv-sm"
                    : "text-cv-text-secondary hover:text-cv-navy"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-white border border-cv-border px-2 py-1 rounded-lg text-xs text-cv-text-secondary">
            <ArrowUpDown className="w-3 h-3 text-cv-blue" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-cv-navy focus:outline-none cursor-pointer"
            >
              <option value="name">Name</option>
              <option value="date">Date</option>
              <option value="size">Size</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-1 text-cv-blue font-bold"
              title="Toggle sort direction"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white border border-cv-border p-0.5 rounded-lg shadow-cv-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded ${
                viewMode === "grid" ? "bg-cv-surface-subtle text-cv-navy" : "text-cv-text-secondary"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded ${
                viewMode === "list" ? "bg-cv-surface-subtle text-cv-navy" : "text-cv-text-secondary"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MULTI-SELECT ACTION BAR (Appears when items are selected) */}
      {selectedFileIds.size > 0 && (
        <div className="p-3 rounded-xl bg-cv-navy text-white flex items-center justify-between text-xs animate-in slide-in-from-top-1 shadow-cv-md">
          <div className="flex items-center gap-3">
            <span className="font-semibold">{selectedFileIds.size} file(s) selected</span>
            <button
              onClick={() => setSelectedFileIds(new Set())}
              className="text-cv-blue-pale hover:underline"
            >
              Deselect all
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchTrash}
              className="px-3 py-1.5 bg-cv-danger text-white rounded-lg font-semibold hover:bg-red-700 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Move to Trash</span>
            </button>
          </div>
        </div>
      )}

      {/* FOLDERS SECTION */}
      {folders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-cv-text-secondary uppercase tracking-wider">
            Folders ({folders.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => setCurrentFolderId(folder.id)}
                className="group relative p-3 rounded-xl border border-cv-border bg-white hover:border-cv-blue/40 hover:bg-cv-bg transition-all shadow-cv-sm cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Folder className="w-5 h-5 text-cv-blue flex-shrink-0" />
                  <span className="text-xs font-semibold text-cv-navy truncate">{folder.name}</span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameTarget({ id: folder.id, name: folder.name, type: "folder" });
                    }}
                    className="p-1 text-cv-text-secondary hover:text-cv-navy"
                    title="Rename Folder"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTrashFolder(folder);
                    }}
                    className="p-1 text-cv-text-secondary hover:text-cv-danger"
                    title="Move Folder to Trash"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILES SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-cv-text-secondary uppercase tracking-wider">
            Files ({files.length})
          </h3>
          {files.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-xs font-semibold text-cv-blue hover:underline flex items-center gap-1.5"
            >
              {selectedFileIds.size === files.length ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Deselect all</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Select all</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-44 rounded-xl border border-cv-border bg-white p-4 space-y-3 animate-pulse"
              >
                <div className="w-full h-24 bg-cv-bg rounded-lg" />
                <div className="w-3/4 h-3 bg-cv-bg rounded" />
                <div className="w-1/2 h-2 bg-cv-bg rounded" />
              </div>
            ))}
          </div>
        ) : files.length === 0 && folders.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-cv-border space-y-4 shadow-cv-sm">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-cv-surface-subtle flex items-center justify-center text-cv-blue">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-cv-navy">No files in this location</h4>
              <p className="text-xs text-cv-text-secondary">
                Upload your documents, code, or images to begin storing them securely in CloudVault.
              </p>
            </div>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-5 py-2.5 rounded-lg bg-cv-navy hover:bg-cv-blue text-white text-xs font-semibold shadow-cv-sm inline-flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload your first file</span>
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* GRID VIEW */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((file) => {
              const isSelected = selectedFileIds.has(file.id);
              const isImg = file.mimeType.startsWith("image/");
              return (
                <div
                  key={file.id}
                  onClick={() => setPreviewFile(file)}
                  className={`group relative rounded-xl border transition-all bg-white shadow-cv-sm hover:shadow-cv-md cursor-pointer flex flex-col overflow-hidden ${
                    isSelected ? "border-cv-blue ring-2 ring-cv-blue/30" : "border-cv-border hover:border-cv-blue/50"
                  }`}
                >
                  {/* Select Checkbox & Star Bar */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
                    <button
                      onClick={(e) => toggleSelectFile(file.id, e)}
                      className={`pointer-events-auto p-1 rounded-md transition-all ${
                        isSelected
                          ? "bg-cv-blue text-white"
                          : "opacity-0 group-hover:opacity-100 bg-white/80 text-cv-text-secondary hover:text-cv-navy"
                      }`}
                    >
                      {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={(e) => handleToggleStar(file, e)}
                      className={`pointer-events-auto p-1 rounded-md transition-all ${
                        file.isStarred
                          ? "text-amber-500 fill-amber-500"
                          : "opacity-0 group-hover:opacity-100 text-cv-text-secondary hover:text-amber-500"
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 ${file.isStarred ? "fill-amber-500 text-amber-500" : ""}`}
                      />
                    </button>
                  </div>

                  {/* Thumbnail / File Icon Area */}
                  <div className="w-full h-32 bg-cv-bg/60 flex items-center justify-center relative overflow-hidden border-b border-cv-border">
                    {isImg ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={`/api/files/${file.id}/download?inline=true`}
                        alt={file.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="transform group-hover:scale-110 transition-transform duration-200">
                        {getFileIcon(file)}
                      </div>
                    )}
                  </div>

                  {/* Metadata Card Footer */}
                  <div className="p-3 flex flex-col justify-between flex-1 space-y-2">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-cv-navy truncate" title={file.name}>
                        {file.name}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-cv-text-secondary">
                        <span>{formatFileSize(file.sizeBytes)}</span>
                        <span className="font-semibold text-cv-blue bg-cv-blue-pale/60 px-1.5 py-0.2 rounded">
                          v{file.currentVersionNumber}
                        </span>
                      </div>
                    </div>

                    {/* Quick Action Icons */}
                    <div className="pt-2 border-t border-cv-border flex items-center justify-between text-cv-text-secondary">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShareFile(file);
                          }}
                          className="p-1 hover:text-cv-blue rounded"
                          title="Share Link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setVersionFile(file);
                          }}
                          className="p-1 hover:text-cv-blue rounded"
                          title="Version History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`/api/files/${file.id}/download`}
                          download={file.name}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 hover:text-cv-blue rounded"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {/* Dropdown Menu Toggle */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === file.id ? null : file.id);
                          }}
                          className="p-1 hover:text-cv-navy rounded"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {activeMenuId === file.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 bottom-full mb-1 w-40 bg-white border border-cv-border rounded-xl shadow-cv-lg p-1 z-30 text-xs text-cv-navy space-y-0.5"
                          >
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                setPreviewFile(file);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-cv-surface-subtle flex items-center gap-2"
                            >
                              <Eye className="w-3.5 h-3.5 text-cv-blue" />
                              <span>Preview</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                setMoveFile(file);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-cv-surface-subtle flex items-center gap-2"
                            >
                              <FolderInput className="w-3.5 h-3.5 text-cv-blue" />
                              <span>Move To...</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                setRenameTarget({ id: file.id, name: file.name, type: "file" });
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-cv-surface-subtle flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-cv-blue" />
                              <span>Rename</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                handleTrashFile(file);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-cv-danger-subtle text-cv-danger flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Move to Trash</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="bg-white border border-cv-border rounded-xl shadow-cv-sm overflow-hidden">
            <table className="w-full text-left text-xs text-cv-navy">
              <thead className="bg-cv-bg border-b border-cv-border text-cv-text-secondary uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-8">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold">Size</th>
                  <th className="py-3 px-4 font-semibold">Version</th>
                  <th className="py-3 px-4 font-semibold">Modified</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cv-border">
                {files.map((file) => {
                  const isSelected = selectedFileIds.has(file.id);
                  return (
                    <tr
                      key={file.id}
                      onClick={() => setPreviewFile(file)}
                      className={`hover:bg-cv-surface-subtle/50 cursor-pointer transition-colors ${
                        isSelected ? "bg-cv-blue-pale/20" : ""
                      }`}
                    >
                      <td className="py-3 px-4" onClick={(e) => toggleSelectFile(file.id, e)}>
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-cv-blue" />
                        ) : (
                          <Square className="w-4 h-4 text-cv-border hover:text-cv-text-secondary" />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => handleToggleStar(file, e)} className="p-0.5">
                            <Star
                              className={`w-3.5 h-3.5 ${
                                file.isStarred
                                  ? "fill-amber-500 text-amber-500"
                                  : "text-cv-border hover:text-amber-500"
                              }`}
                            />
                          </button>
                          <span className="font-semibold text-cv-navy truncate max-w-xs">{file.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-cv-text-secondary">{formatFileSize(file.sizeBytes)}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-cv-blue bg-cv-blue-pale/60 px-2 py-0.5 rounded text-[11px]">
                          v{file.currentVersionNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-cv-text-secondary">
                        {new Date(file.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setShareFile(file)}
                            className="p-1 hover:text-cv-blue rounded"
                            title="Share"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setVersionFile(file)}
                            className="p-1 hover:text-cv-blue rounded"
                            title="Version History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <a
                            href={`/api/files/${file.id}/download`}
                            download={file.name}
                            className="p-1 hover:text-cv-blue rounded"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleTrashFile(file)}
                            className="p-1 hover:text-cv-danger rounded"
                            title="Trash"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DIALOGS */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        folderId={currentFolderId}
        onUploadComplete={fetchFiles}
      />

      <NewFolderModal
        isOpen={newFolderModalOpen}
        onClose={() => setNewFolderModalOpen(false)}
        parentId={currentFolderId}
        onFolderCreated={fetchFiles}
      />

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

      <VersionHistoryModal
        isOpen={!!versionFile}
        onClose={() => setVersionFile(null)}
        file={versionFile}
        onVersionUpdated={fetchFiles}
      />

      <RenameModal
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        item={renameTarget}
        onRenamed={fetchFiles}
      />

      <MoveModal
        isOpen={!!moveFile}
        onClose={() => setMoveFile(null)}
        file={moveFile}
        onMoved={fetchFiles}
      />
    </div>
  );
}
