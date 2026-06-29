"use client";

import { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/layout/Topbar";
import {
  Folder,
  FileText,
  Image,
  FileSpreadsheet,
  Presentation,
  FileVideo,
  File,
  ChevronRight,
  ExternalLink,
  X,
  Search,
  RefreshCw,
  ArrowLeft,
  Info,
} from "lucide-react";

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  size?: string;
}

interface Breadcrumb {
  id: string;
  name: string;
}

export default function ResourcesPage() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [path, setPath] = useState<Breadcrumb[]>([]);
  const [selectedFile, setSelectedFile] = useState<DriveItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);

  const fetchFolder = useCallback(async (folderId: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const url = folderId
        ? `/api/student/resources?folderId=${folderId}`
        : "/api/student/resources";
      
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load resources.");
      }

      const data = await res.json();
      setItems(data.items || []);

      // Update breadcrumbs path
      const newFolder = { id: data.folderId, name: data.folderName };
      setPath((prev) => {
        const idx = prev.findIndex((p) => p.id === data.folderId);
        if (idx !== -1) {
          // If we clicked on an existing breadcrumb, truncate the path up to it
          return prev.slice(0, idx + 1);
        } else {
          // If it's a new folder, append it
          // Special case: if this is the root folder loading initially, replace path
          if (!folderId) {
            return [newFolder];
          }
          return [...prev, newFolder];
        }
      });
      
      setCurrentFolderId(data.folderId);
    } catch (err: any) {
      console.error("Error loading resources:", err);
      setError(err.message || "An error occurred while loading resources.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load root folder on mount
  useEffect(() => {
    fetchFolder(null);
  }, [fetchFolder]);

  // Handle folder click
  const handleFolderClick = (folderId: string) => {
    setSearchQuery(""); // Clear search when entering a new folder
    fetchFolder(folderId);
  };

  // Handle file click
  const handleFileClick = (file: DriveItem) => {
    setSelectedFile(file);
    if (window.innerWidth < 1024) {
      setIsMobilePreviewOpen(true);
    }
  };

  // Format file size
  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return "";
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return "";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Get appropriate icon based on mimeType
  const getFileIcon = (mimeType: string) => {
    if (mimeType === "application/vnd.google-apps.folder") {
      return <Folder className="h-5 w-5 text-amber-500 shrink-0" />;
    }
    if (mimeType === "application/pdf") {
      return <FileText className="h-5 w-5 text-red-500 shrink-0" />;
    }
    if (
      mimeType.includes("document") ||
      mimeType === "application/vnd.google-apps.document"
    ) {
      return <FileText className="h-5 w-5 text-blue-500 shrink-0" />;
    }
    if (
      mimeType.includes("sheet") ||
      mimeType === "application/vnd.google-apps.spreadsheet"
    ) {
      return <FileSpreadsheet className="h-5 w-5 text-emerald-600 shrink-0" />;
    }
    if (
      mimeType.includes("presentation") ||
      mimeType === "application/vnd.google-apps.presentation"
    ) {
      return <Presentation className="h-5 w-5 text-orange-500 shrink-0" />;
    }
    if (mimeType.startsWith("image/")) {
      return <Image className="h-5 w-5 text-purple-500 shrink-0" />;
    }
    if (
      mimeType.startsWith("video/") ||
      mimeType === "application/vnd.google-apps.video"
    ) {
      return <FileVideo className="h-5 w-5 text-rose-600 shrink-0" />;
    }
    return <File className="h-5 w-5 text-text-muted shrink-0" />;
  };

  // Filter items based on search query
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background">
      <Topbar title="Study Resources" subtitle="Access your study guides, worksheets, and resources" />

      <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-hidden flex flex-col">
        {/* Breadcrumbs & Search bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-border shadow-sm shrink-0">
          {/* Breadcrumbs */}
          <nav className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
            {path.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="h-4 w-4 text-text-muted" />}
                <button
                  onClick={() => fetchFolder(folder.id)}
                  className={`hover:text-primary transition-colors ${
                    index === path.length - 1
                      ? "text-text-primary font-bold pointer-events-none"
                      : "text-text-secondary"
                  }`}
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </nav>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search in this folder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background pl-9 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex-1 gap-6 overflow-hidden lg:grid lg:grid-cols-5 min-h-0">
          {/* Left Pane - Folders & Files List */}
          <div className="lg:col-span-2 flex flex-col h-full min-h-0 bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-surface-elevated/20 flex justify-between items-center shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Files & Folders ({filteredItems.length})
              </span>
              <button
                onClick={() => fetchFolder(currentFolderId)}
                title="Refresh Folder"
                className="p-1 hover:bg-surface-elevated rounded-lg text-text-secondary hover:text-primary transition-colors"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading ? (
                // Skeleton Loader
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-surface animate-pulse"
                  >
                    <div className="flex items-center gap-3 w-3/4">
                      <div className="h-5 w-5 bg-border rounded" />
                      <div className="h-4 bg-border rounded w-2/3" />
                    </div>
                    <div className="h-3 bg-border rounded w-12" />
                  </div>
                ))
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="bg-red-50 text-red-500 p-3 rounded-full mb-3">
                    <Info className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-text-primary mb-1">Could not load files</p>
                  <p className="text-xs text-text-muted max-w-xs mb-4">{error}</p>
                  <button
                    onClick={() => fetchFolder(currentFolderId)}
                    className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary-hover border border-primary/20 hover:border-primary px-3 py-1.5 rounded-lg transition-all"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Try Again
                  </button>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-text-muted">
                  <Folder className="h-10 w-10 text-text-muted/30 mb-2" />
                  <p className="text-sm">No files or folders found</p>
                  {searchQuery && <p className="text-xs text-text-muted">Try clearing your search query</p>}
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isFolder = item.mimeType === "application/vnd.google-apps.folder";
                  const isSelected = selectedFile?.id === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => (isFolder ? handleFolderClick(item.id) : handleFileClick(item))}
                      className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all group ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-surface hover:border-primary/50 hover:bg-surface-elevated/10"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {getFileIcon(item.mimeType)}
                        <span className="text-sm font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-xs text-text-muted ml-3 shrink-0">
                        {isFolder ? "Folder" : formatBytes(item.size)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Pane - Desktop File Preview */}
          <div className="hidden lg:col-span-3 lg:flex flex-col h-full bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
            {selectedFile ? (
              <div className="flex flex-col h-full">
                {/* Preview Header */}
                <div className="p-4 border-b border-border bg-surface-elevated/25 flex items-center justify-between shrink-0">
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      {getFileIcon(selectedFile.mimeType)}
                      <h3 className="text-sm font-semibold text-text-primary truncate">
                        {selectedFile.name}
                      </h3>
                    </div>
                    {selectedFile.size && (
                      <p className="text-xs text-text-muted mt-0.5 ml-7">
                        Size: {formatBytes(selectedFile.size)}
                      </p>
                    )}
                  </div>
                  {selectedFile.webViewLink && (
                    <a
                      href={selectedFile.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all border border-primary/10 shrink-0"
                    >
                      Open in Drive <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                {/* Preview Body (Iframe) */}
                <div className="flex-1 bg-surface-elevated/30 p-2 min-h-0">
                  <iframe
                    src={`https://drive.google.com/file/d/${selectedFile.id}/preview`}
                    className="w-full h-full border border-border rounded-lg bg-white shadow-inner"
                    allow="autoplay"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-text-muted">
                <div className="h-16 w-16 bg-primary/5 rounded-full flex items-center justify-center mb-4 border border-primary/10 text-primary">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1">No File Selected</h3>
                <p className="text-sm max-w-xs">
                  Select a document from the list on the left to view its contents directly in the portal.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Full-Screen Preview Modal */}
      {isMobilePreviewOpen && selectedFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col animate-fade-in lg:hidden">
          <div className="bg-surface flex flex-col h-full w-full">
            {/* Modal Header */}
            <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
              <button
                onClick={() => setIsMobilePreviewOpen(false)}
                className="p-1.5 hover:bg-surface-elevated rounded-lg text-text-secondary hover:text-text-primary transition-all mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {getFileIcon(selectedFile.mimeType)}
                  <h3 className="text-sm font-semibold text-text-primary truncate">
                    {selectedFile.name}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {selectedFile.webViewLink && (
                  <a
                    href={selectedFile.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    title="Open in Drive"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                )}
                <button
                  onClick={() => setIsMobilePreviewOpen(false)}
                  className="p-2 text-text-secondary hover:bg-surface-elevated rounded-lg transition-colors"
                  title="Close Preview"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body (Iframe) */}
            <div className="flex-1 bg-surface-elevated/40 p-2">
              <iframe
                src={`https://drive.google.com/file/d/${selectedFile.id}/preview`}
                className="w-full h-full border border-border rounded-lg bg-white shadow-sm"
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
