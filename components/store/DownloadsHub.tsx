"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  FileDown,
  Monitor,
  BookOpen,
  ShieldCheck,
  CheckCircle,
  ArrowDownToLine,
  ChevronDown,
  Search,
  FileText,
  Sparkles,
  Layers,
  HardDrive,
  Download,
  Eye,
} from "lucide-react";
import { PdfPreviewModal } from "@/components/ui/PdfPreviewModal";
import { LiveDocumentAsset } from "@/lib/types";

interface DownloadItem {
  id: string;
  title: string;
  desc: string;
  size: string;
  version: string;
  format: "PDF" | "EXE" | "ZIP" | "BIN" | "APK";
  updatedDate: string;
  fileUrl?: string;
}

interface DownloadCategory {
  id: string;
  category: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  items: DownloadItem[];
}

export function DownloadsHub() {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [liveDocs, setLiveDocs] = useState<LiveDocumentAsset[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unitech_live_catalogues");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const [previewingItem, setPreviewingItem] = useState<DownloadItem | null>(null);
  // By default, open the first category
  const [openCategories, setOpenCategories] = useState<string[]>(["catalogues"]);

  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const saved = localStorage.getItem("unitech_live_catalogues");
        if (saved) setLiveDocs(JSON.parse(saved));
      } catch {}
    };

    syncFromStorage();
    window.addEventListener("storage", syncFromStorage);

    fetch("/api/documents", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setLiveDocs(json.data);
          try {
            localStorage.setItem("unitech_live_catalogues", JSON.stringify(json.data));
          } catch {}
        }
      })
      .catch((err) => console.warn("[DownloadsHub fetch documents error]:", err));

    return () => window.removeEventListener("storage", syncFromStorage);
  }, []);

  const mapDocToItem = (d: LiveDocumentAsset): DownloadItem => ({
    id: d.id,
    title: d.title,
    desc: d.revisionSummary || `${d.category} · Version ${d.version} · Sahibabad Plant OEM Asset`,
    size: d.fileSize,
    version: d.version,
    format: (d.format || "PDF") as "PDF" | "EXE" | "ZIP" | "BIN" | "APK",
    updatedDate: d.updatedDate,
    fileUrl: d.fileUrl || `/downloads/${d.id}.pdf`,
  });

  const categories = useMemo<DownloadCategory[]>(
    () => {
      const finalCatDocs = liveDocs.filter((d) => !d.section || d.section === "catalogues");
      const finalSoftDocs = liveDocs.filter((d) => d.section === "software");
      const finalRmaDocs = liveDocs.filter((d) => d.section === "warranty-rma");

      return [
        {
          id: "catalogues",
          category: "Product Catalogues & Datasheets (PDF)",
          description: "Official factory brochures, optical sensor benchmarks, and cable technical datasheets.",
          icon: FileDown,
          accentColor: "text-red-600 bg-red-50 border-red-200",
          badgeBg: "bg-red-500/10 text-red-700 border-red-200",
          badgeText: "PDF Specs",
          items: finalCatDocs.map(mapDocToItem),
        },
        {
          id: "software",
          category: "Software & Surveillance Utilities",
          description: "Desktop VMS client, device discovery utilities, and mobile monitoring APK for installers.",
          icon: Monitor,
          accentColor: "text-blue-600 bg-blue-50 border-blue-200",
          badgeBg: "bg-blue-500/10 text-blue-700 border-blue-200",
          badgeText: "Windows & Android",
          items: finalSoftDocs.map(mapDocToItem),
        },
        {
          id: "warranty-rma",
          category: "RMA, Warranty & Compliance Policies",
          description: "Manufacturer warranty documentation, factory RMA submission forms, and ISO compliance certificates.",
          icon: ShieldCheck,
          accentColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
          badgeBg: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
          badgeText: "Official Policy",
          items: finalRmaDocs.map(mapDocToItem),
        },
      ];
    },
    [liveDocs]
  );

  // Toggle single category
  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Expand all / Collapse all
  const isAllOpen = openCategories.length === categories.length;
  const toggleAll = () => {
    if (isAllOpen) {
      setOpenCategories([]);
    } else {
      setOpenCategories(categories.map((c) => c.id));
    }
  };

  // Filter items based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.desc.toLowerCase().includes(q) ||
            item.version.toLowerCase().includes(q) ||
            item.format.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [searchQuery, categories]);

  const handleRealDownload = (item: DownloadItem) => {
    setDownloadingId(item.id);
    const targetUrl = item.fileUrl || `/downloads/${item.id}.pdf`;
    const downloadUrl = targetUrl.startsWith("data:") || targetUrl.startsWith("blob:")
      ? targetUrl
      : targetUrl.includes("?")
      ? `${targetUrl}&download=1`
      : `${targetUrl}?download=1`;

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${item.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.${item.format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setDownloadingId(null);
      setDownloadSuccess(item.title);
      setTimeout(() => setDownloadSuccess(null), 3500);
    }, 600);
  };

  const getFormatBadgeStyle = (format: DownloadItem["format"]) => {
    switch (format) {
      case "PDF":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "EXE":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "ZIP":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "BIN":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "APK":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <section id="downloads" className="py-8 sm:py-12 bg-[#faf9f5] border-b border-slate-200/60">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-unitech-red/10 text-unitech-red border border-unitech-red/20 mb-2">
              <FileDown className="w-3.5 h-3.5" />
              <span>Technical Resource Center</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
              Downloads & Engineering Hub
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Official product catalogues, VMS software, firmware upgrade packages, and wiring guides.
            </p>
          </div>

          {/* Quick Actions: Search & Expand All */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[260px] sm:min-w-[320px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search resources, firmware..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim().length > 0) {
                    // Open all when searching
                    setOpenCategories(categories.map((c) => c.id));
                  }
                }}
                className="w-full pl-10 pr-4 py-2.5 text-base sm:text-xs rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-unitech-red/20 focus:border-unitech-red transition-all shadow-2xs"
              />
            </div>

            {/* Expand / Collapse All Toggle */}
            <button
              onClick={toggleAll}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-unitech-red" />
              <span>{isAllOpen ? "Collapse All" : "Expand All"}</span>
            </button>
          </div>
        </div>

        {/* Global Download Success Banner */}
        {downloadSuccess && (
          <div className="mb-6 p-3.5 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center justify-between shadow-md transition-all">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>
                Download started: <strong className="underline">{downloadSuccess}</strong>
              </span>
            </div>
            <span className="text-[11px] opacity-80">Serving from Sahibabad Cloud Mirror</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* 1 COLUMN × N ROWS COLLAPSIBLE LIST */}
        {/* ========================================================= */}
        <div className="space-y-4">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 p-8">
              <p className="text-slate-500 text-sm font-semibold">
                No resources match your search query "{searchQuery}".
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            filteredCategories.map((group) => {
              const isOpen = openCategories.includes(group.id);
              const GroupIcon = group.icon;

              return (
                <div
                  key={group.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all duration-200"
                >
                  {/* Category Collapsible Header Button */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(group.id)}
                    className="w-full px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4 text-left hover:bg-slate-50/70 transition-colors cursor-pointer select-none"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 border ${group.accentColor}`}
                      >
                        <GroupIcon className="w-5 h-5" />
                      </div>

                      {/* Title & Description */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading font-black text-slate-950 text-base sm:text-lg tracking-tight">
                            {group.category}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${group.badgeBg}`}
                          >
                            {group.items.length} {group.items.length === 1 ? "File" : "Files"}
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs sm:text-sm mt-0.5 hidden sm:block">
                          {group.description}
                        </p>
                      </div>
                    </div>

                    {/* Right side: Chevron indicator */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-slate-400 hidden md:inline">
                        {isOpen ? "Hide Files" : "View Files"}
                      </span>
                      <div
                        className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 transition-transform duration-200 ${
                          isOpen ? "rotate-180 bg-unitech-red/10 text-unitech-red" : ""
                        }`}
                      >
                        <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </div>
                  </button>

                  {/* Collapsible Body: Sub-part Items List */}
                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6 space-y-3">
                      {group.items.map((item) => {
                        const isDownloading = downloadingId === item.id;

                        return (
                          <div
                            key={item.id}
                            className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            {/* Left Info */}
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-heading font-bold text-slate-900 text-sm sm:text-base">
                                  {item.title}
                                </h4>
                                <span className="text-[10px] sm:text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  {item.version}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getFormatBadgeStyle(
                                    item.format
                                  )}`}
                                >
                                  {item.format}
                                </span>
                              </div>

                              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                                {item.desc}
                              </p>

                              <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-slate-400">
                                <span>File Size: <strong className="text-slate-600">{item.size}</strong></span>
                                <span>•</span>
                                <span>Updated: <strong className="text-slate-600">{item.updatedDate}</strong></span>
                                <span>•</span>
                                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Verified Clean</span>
                                </span>
                              </div>
                            </div>

                            {/* Right Download & Preview CTA Buttons */}
                            <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex flex-wrap sm:flex-row items-center gap-2">
                              {item.format === "PDF" && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewingItem(item)}
                                  className="px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs hover:border-slate-400"
                                >
                                  <Eye className="w-3.5 h-3.5 text-unitech-red" />
                                  <span>Preview PDF</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleRealDownload(item)}
                                disabled={isDownloading}
                                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                                  isDownloading
                                    ? "bg-slate-200 text-slate-500 cursor-wait"
                                    : "bg-slate-900 hover:bg-unitech-red text-white hover:shadow-md hover:shadow-unitech-red/20"
                                }`}
                              >
                                {isDownloading ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                    <span>Downloading...</span>
                                  </>
                                ) : (
                                  <>
                                    <ArrowDownToLine className="w-3.5 h-3.5" />
                                    <span>Download {item.format}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Technical Note */}
        <div className="mt-8 p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 text-center text-xs sm:text-sm text-slate-600 flex flex-col sm:flex-row items-center justify-center gap-2 shadow-2xs">
          <HardDrive className="w-4 h-4 text-unitech-red shrink-0" />
          <span>
            Need legacy DVR firmware or customized SDK for third-party integration?
          </span>
          <a
            href="tel:+919911961407"
            className="text-unitech-red font-bold hover:underline"
          >
            Contact Sahibabad Engineering Helpline (+91 99119 61407)
          </a>
        </div>

      </div>
      {/* Embedded In-Website PDF Preview Modal */}
      {previewingItem && (
        <PdfPreviewModal
          isOpen={!!previewingItem}
          onClose={() => setPreviewingItem(null)}
          title={previewingItem.title}
          fileUrl={previewingItem.fileUrl || `/downloads/${previewingItem.id}.pdf`}
          version={previewingItem.version}
          fileSize={previewingItem.size}
          format={previewingItem.format}
        />
      )}
    </section>
  );
}
